import { isSchedulerRequest } from "@/lib/content-automation/auth";
import { runContentAutomation } from "@/lib/content-automation/engine";

export const runtime = "nodejs";

async function execute(request: Request) {
  if (!isSchedulerRequest(request)) return Response.json({ error: "Scheduler authorization is required." }, { status: 401 });
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";
  try {
    return Response.json(await runContentAutomation({ dryRun }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Content automation failed." }, { status: 503 });
  }
}

export const GET = execute;
export const POST = execute;
