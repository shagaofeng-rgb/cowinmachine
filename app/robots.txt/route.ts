import { siteUrl } from "@/lib/seo";

export async function GET() {
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${siteUrl("/sitemap.xml")}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
