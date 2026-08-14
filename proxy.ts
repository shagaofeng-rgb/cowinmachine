import { NextResponse, type NextRequest } from "next/server";

function adminEnabled() {
  return process.env.CONTENT_ADMIN_ENABLED === "true" && Boolean(process.env.CONTENT_ADMIN_USER && process.env.CONTENT_ADMIN_PASSWORD);
}

export function proxy(request: NextRequest) {
  if (!adminEnabled()) return new NextResponse(null, { status: 404 });
  const expected = `Basic ${btoa(`${process.env.CONTENT_ADMIN_USER}:${process.env.CONTENT_ADMIN_PASSWORD}`)}`;
  if (request.headers.get("authorization") === expected) return NextResponse.next();
  return new NextResponse("Authentication required.", { status: 401, headers: { "WWW-Authenticate": "Basic realm=content-operations" } });
}

export const config = { matcher: ["/internal/content-operations/:path*", "/api/content-automation/manual/:path*"] };
