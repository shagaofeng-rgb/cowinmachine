import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { runSitemapJob } from "@/lib/sitemap";

export async function GET(request: Request) {
  return runAuthorizedSitemapJob(request, "cron");
}

export async function POST(request: Request) {
  return runAuthorizedSitemapJob(request, "manual");
}

async function runAuthorizedSitemapJob(request: Request, fallbackTrigger: "cron" | "manual") {
  const user = await currentUser();
  if (!user && !hasCronSecret(request)) {
    return NextResponse.json({ ok: false, message: "未授权" }, { status: 401 });
  }

  const url = new URL(request.url);
  const result = await runSitemapJob({
    trigger: user ? "manual" : fallbackTrigger,
    force: url.searchParams.get("force") === "1",
    dryRun: url.searchParams.get("dryRun") === "1",
    submit: url.searchParams.get("submit") === "1" || (!user && fallbackTrigger === "cron"),
    verbose: url.searchParams.get("verbose") === "1",
  });

  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    const redirectUrl = new URL("/admin", request.url);
    redirectUrl.hash = "sitemap";
    redirectUrl.searchParams.set("sitemap", result.ok ? "success" : "failed");
    return NextResponse.redirect(redirectUrl, 303);
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

function hasCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}` || request.headers.get("x-cron-secret") === secret;
}
