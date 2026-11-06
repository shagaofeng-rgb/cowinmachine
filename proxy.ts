import { NextResponse, type NextRequest } from "next/server";
import { hasAdminAccess, isAdminEnabled } from "@/lib/admin-operations/auth";

const canonicalHost = "cowinmachine.com";

export async function proxy(request: NextRequest) {
  const isRootWebhookPost = request.method === "POST" && request.nextUrl.pathname === "/";

  if (isRootWebhookPost) {
    return NextResponse.rewrite(new URL("/api/integrations/blog-publish", request.url));
  }

  const host = request.headers.get("host")?.toLowerCase().split(":")[0];

  if (host === "www." + canonicalHost) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.protocol = "https:";
    canonicalUrl.host = canonicalHost;
    canonicalUrl.port = "";
    return NextResponse.redirect(canonicalUrl, 301);
  }

  const isProtectedContentRoute =
    request.nextUrl.pathname.startsWith("/internal/admin") ||
    request.nextUrl.pathname.startsWith("/internal/content-operations") ||
    request.nextUrl.pathname.startsWith("/api/content-automation/manual");

  if (!isProtectedContentRoute) return NextResponse.next();
  if (!isAdminEnabled()) return new NextResponse(null, { status: 404 });
  if (hasAdminAccess(request.headers.get("authorization"))) return NextResponse.next();

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="content-operations", charset="UTF-8"', "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
