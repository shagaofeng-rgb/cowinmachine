import { isAdminRequest } from "@/lib/content-automation/auth";
import { reconcileLegacyThirdPartyBlogArticles } from "@/lib/content-automation/blog-reconciliation";
import { runContentAutomation } from "@/lib/content-automation/engine";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return Response.json({ error: "Protected content operations are unavailable." }, { status: 401, headers: { "WWW-Authenticate": "Basic realm=content-operations" } });
  const payload = await request.json().catch(() => ({})) as { action?: string };
  if (payload.action === "reconcile-blog") {
    try {
      const result = await reconcileLegacyThirdPartyBlogArticles();
      revalidatePath("/news");
      revalidatePath("/blog");
      revalidatePath("/sitemap.xml");
      revalidatePath("/blog-feed.xml");
      return Response.json({ status: "Blog reconciliation completed", ...result });
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "Blog reconciliation failed." }, { status: 503 });
    }
  }
  const dryRun = payload.action === "dry-run";
  try {
    return Response.json(await runContentAutomation({ dryRun, allowManualPublish: payload.action === "publish-next" }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Content operation failed." }, { status: 503 });
  }
}
