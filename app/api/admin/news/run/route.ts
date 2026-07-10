import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { runNewsAutomation } from "@/lib/automation";

export async function POST(request: Request) {
  return runAuthorizedNewsAutomation(request);
}

export async function GET(request: Request) {
  return runAuthorizedNewsAutomation(request);
}

async function runAuthorizedNewsAutomation(request: Request) {
  const user = await currentUser();
  if (!user && !hasCronSecret(request)) {
    return NextResponse.json({ ok: false, message: "未授权" }, { status: 401 });
  }
  const result = await runNewsAutomation({ forceTestCandidate: process.env.NEWS_TEST_MODE === "1" });
  return NextResponse.json(result);
}

function hasCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}` || request.headers.get("x-cron-secret") === secret;
}
