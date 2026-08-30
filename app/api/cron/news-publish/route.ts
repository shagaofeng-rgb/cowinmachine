import { isSchedulerRequest } from "@/lib/content-automation/auth";
import { publishDailyNews } from "@/lib/content-automation/news-publisher";

export const runtime = "nodejs";
export const maxDuration = 60;

async function execute(request: Request) {
  if (!isSchedulerRequest(request)) return Response.json({ error: "Scheduler authorization is required." }, { status: 401 });
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";
  try {
    const result = await publishDailyNews({ dryRun });
    console.info(JSON.stringify({ event: "news.publish.cron", ...result }));
    return Response.json(result, { status: result.status === "blocked" ? 503 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "News publication failed.";
    console.error(JSON.stringify({ event: "news.publish.error", message }));
    return Response.json({ error: message }, { status: 503 });
  }
}
export const GET = execute;
export const POST = execute;
