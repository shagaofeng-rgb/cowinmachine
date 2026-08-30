import { isSchedulerRequest } from "@/lib/content-automation/auth";
import { discoverApprovedNews } from "@/lib/content-automation/news-discovery";

export const runtime = "nodejs";
export const maxDuration = 60;

async function execute(request: Request) {
  if (!isSchedulerRequest(request)) {
    return Response.json({ error: "Scheduler authorization is required." }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";
  try {
    const result = await discoverApprovedNews({ dryRun });
    console.info(JSON.stringify({ event: "news.discover.cron", ...result }));
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "News discovery failed.";
    console.error(JSON.stringify({ event: "news.discover.error", message }));
    return Response.json(
      { error: message },
      { status: 503 },
    );
  }
}

export const GET = execute;
export const POST = execute;
