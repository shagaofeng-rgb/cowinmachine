import { getPublishedNewsArticles } from "@/lib/content-automation/storage";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";
const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const articles = await getPublishedNewsArticles();
  const items = articles.map((article) => "<item><title>" + escapeXml(article.title) + "</title><link>" + siteConfig.siteUrl + "/news/" + article.slug + "</link><guid isPermaLink=\"true\">" + siteConfig.siteUrl + "/news/" + article.slug + "</guid><pubDate>" + new Date(article.publishedAt ?? article.updatedAt).toUTCString() + "</pubDate><description>" + escapeXml(article.summary) + "</description></item>").join("");
  const xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"><channel><title>" + escapeXml(siteConfig.brandName) + " News</title><link>" + siteConfig.siteUrl + "/news</link><description>Source-reviewed industrial equipment and application news.</description>" + items + "</channel></rss>";
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
