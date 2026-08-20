import { isSchedulerRequest } from "@/lib/content-automation/auth";
import { getPublishedArticles } from "@/lib/content-automation/storage";

export const runtime = "nodejs";

async function execute(request: Request) {
  if (!isSchedulerRequest(request)) return Response.json({ error: "Scheduler authorization is required." }, { status: 401 });
  const articles = await getPublishedArticles();
  return Response.json({
    status: process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY && process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON
      ? "sitemap-updated"
      : "search-console-not-configured",
    sitemap: "/sitemap.xml",
    rss: "/feed.xml",
    publishedNewsCount: articles.length,
    note: "This task validates discovery surfaces. It does not claim or guarantee indexing.",
  });
}
export const GET = execute;
export const POST = execute;
