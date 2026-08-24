import { NextResponse, type NextRequest } from "next/server";

const canonicalHost = "cowinmachine.com";

function adminEnabled() {
  return process.env.CONTENT_ADMIN_ENABLED === "true" && Boolean(process.env.CONTENT_ADMIN_USER && process.env.CONTENT_ADMIN_PASSWORD);
}

export async function proxy(request: NextRequest) {
  const isRootWebhookPost = request.method === "POST" && request.nextUrl.pathname === "/";

  if (isRootWebhookPost) {
    const target = new URL("/api/integrations/news-publish", request.url);
    const headers = new Headers(request.headers);
    headers.delete("host");

    return fetch(target, {
      method: request.method,
      headers,
      body: request.body,
      duplex: "half",
      redirect: "manual",
    } as RequestInit & { duplex: "half" });
  }

  const host = request.headers.get("host")?.toLowerCase().split(":")[0];

  if (host === `www.${canonicalHost}`) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.protocol = "https:";
    canonicalUrl.host = canonicalHost;
    return NextResponse.redirect(canonicalUrl, 308);
  }

  const isProtectedContentRoute =
    request.nextUrl.pathname.startsWith("/internal/admin") ||
    request.nextUrl.pathname.startsWith("/internal/content-operations") ||
    request.nextUrl.pathname.startsWith("/api/content-automation/manual");

  if (!isProtectedContentRoute) return NextResponse.next();
  if (!adminEnabled()) return new NextResponse(null, { status: 404 });

  const expected = `Basic ${btoa(`${process.env.CONTENT_ADMIN_USER}:${process.env.CONTENT_ADMIN_PASSWORD}`)}`;
  if (request.headers.get("authorization") === expected) return NextResponse.next();

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": "Basic realm=content-operations" },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
