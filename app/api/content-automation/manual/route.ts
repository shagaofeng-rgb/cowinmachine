import { isAdminRequest } from "@/lib/content-automation/auth";
import { runContentAutomation } from "@/lib/content-automation/engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Protected content operations are unavailable." }, { status: 401, headers: { "WWW-Authenticate": "Basic realm=content-operations" } });
  const payload = await request.json().catch(() => ({})) as { action?: string };
  const dryRun = payload.action === "dry-run";
  try {
    return Response.json(await runContentAutomation({ dryRun, allowManualPublish: payload.action === "publish-next" }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Content operation failed." }, { status: 503 });
  }
}
