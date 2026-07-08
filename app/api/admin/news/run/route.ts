import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { runNewsAutomation } from "@/lib/automation";

export async function POST(request: Request) {
  const user = await currentUser();
  const cronSecret = request.headers.get("x-cron-secret");
  if (!user && (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET)) {
    return NextResponse.json({ ok: false, message: "未授权" }, { status: 401 });
  }
  const result = await runNewsAutomation({ forceTestCandidate: process.env.NEWS_TEST_MODE === "1" });
  return NextResponse.json(result);
}
