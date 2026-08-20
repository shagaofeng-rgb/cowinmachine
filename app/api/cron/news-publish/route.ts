import { isSchedulerRequest } from "@/lib/content-automation/auth";
import { publishDailyNews } from "@/lib/content-automation/news-publisher";

export const runtime = "nodejs";
export const maxDuration = 60;

async function execute(request: Request) {
  if (!isSchedulerRequest(request)) return Response.json({ error: "Scheduler authorization is required." }, { status: 401 });
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";
  try {
    return Response.json(await publishDailyNews({ dryRun }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "News publication failed." }, { status: 503 });
  }
}
export const GET = execute;
export const POST = execute;
