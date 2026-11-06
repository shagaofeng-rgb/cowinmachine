import { NextResponse, type NextRequest } from "next/server";
import { hasAdminAccess, isAdminEnabled } from "@/lib/admin-operations/auth";
import { catalogResultsDestination, isCatalogResultsPath } from "@/lib/catalog-routing";

const canonicalHost = "cowinmachine.com";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isRootWebhookPost = request.method === "POST" && pathname === "/";

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

  if (isCatalogResultsPath(pathname)) return new NextResponse(null, { status: 404 });
  const destination = catalogResultsDestination(request.method, request.nextUrl);
  if (destination) {
    const resultsUrl = request.nextUrl.clone();
    resultsUrl.pathname = destination;
    return NextResponse.rewrite(resultsUrl);
  }

  const isProtectedContentRoute =
    pathname.startsWith("/internal/admin") ||
    pathname.startsWith("/internal/content-operations") ||
    pathname.startsWith("/api/content-automation/manual");

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
