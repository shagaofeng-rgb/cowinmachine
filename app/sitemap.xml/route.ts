import { articles, products } from "@/lib/db";
import { siteUrl } from "@/lib/seo";

export async function GET() {
  const urls = [
    ["", new Date().toISOString()],
    ["/products", new Date().toISOString()],
    ["/news", new Date().toISOString()],
    ["/blog", new Date().toISOString()],
    ["/contact", new Date().toISOString()],
    ...products().map((p) => [`/products/${p.slug}`, p.updated_at]),
    ...articles("news", 100).map((a) => [`/news/${a.slug}`, a.updated_at || a.published_at]),
    ...articles("blog", 100).map((a) => [`/blog/${a.slug}`, a.updated_at || a.published_at]),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .map(([path, lastmod]) => `<url><loc>${siteUrl(path)}</loc><lastmod>${new Date(lastmod).toISOString()}</lastmod><changefreq>daily</changefreq></url>`)
    .join("")}</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
