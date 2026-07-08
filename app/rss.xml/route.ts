import { articles } from "@/lib/db";
import { siteUrl } from "@/lib/seo";

export async function GET() {
  const items = [...articles("news", 20), ...articles("blog", 20)]
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .map((item) => {
      const path = item.source_publisher ? `/news/${item.slug}` : `/blog/${item.slug}`;
      return `<item><title><![CDATA[${item.title}]]></title><link>${siteUrl(path)}</link><guid>${siteUrl(path)}</guid><pubDate>${new Date(item.published_at).toUTCString()}</pubDate><description><![CDATA[${item.excerpt}]]></description></item>`;
    })
    .join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Lianteng Packaging Updates</title><link>${siteUrl("/")}</link><description>News and Blog updates</description>${items}</channel></rss>`, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
