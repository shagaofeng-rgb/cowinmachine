import { sitemapIndexUrl } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /search\nSitemap: ${sitemapIndexUrl()}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
