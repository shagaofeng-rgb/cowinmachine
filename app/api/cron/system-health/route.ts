import { runDatabaseWriteHealthCheck } from "@/lib/admin-operations/system-health";
import { isSchedulerRequest } from "@/lib/content-automation/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function execute(request: Request) {
  if (!isSchedulerRequest(request)) {
    return Response.json({ error: "Scheduler authorization is required." }, { status: 401 });
  }

  try {
    return Response.json({ status: "healthy", checks: await runDatabaseWriteHealthCheck() });
  } catch (error) {
    console.error("system-health-check-failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ status: "unhealthy", error: error instanceof Error ? error.message : "System health check failed." }, { status: 503 });
  }
}

export const GET = execute;
export const POST = execute;
