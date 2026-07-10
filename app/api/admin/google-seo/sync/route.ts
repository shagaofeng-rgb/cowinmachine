import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { syncGoogleSeo } from "@/lib/google-seo";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user && !hasCronSecret(request)) {
    return NextResponse.json({ ok: false, message: "未授权" }, { status: 401 });
  }

  const result = await syncGoogleSeo();
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    const url = new URL("/admin", request.url);
    url.hash = "sync";
    url.searchParams.set("googleSeo", result.ok ? "success" : "failed");
    return NextResponse.redirect(url, 303);
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

function hasCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}` || request.headers.get("x-cron-secret") === secret;
}
