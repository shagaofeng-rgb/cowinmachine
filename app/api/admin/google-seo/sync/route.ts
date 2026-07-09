import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { syncGoogleSeo } from "@/lib/google-seo";

export async function POST(request: Request) {
  const user = await currentUser();
  const cronSecret = request.headers.get("x-cron-secret");
  if (!user && (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET)) {
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
