import { db, articles, productCategories, products, relatedProductsForArticle } from "../lib/db";
import { buildSitemapBundle } from "../lib/sitemap";

const base = process.env.SITE_URL || "http://localhost:3000";
const pages = [
  "/",
  "/products",
  ...productCategories().map((category) => `/products/category/${category.slug}`),
  ...products().map((p) => `/products/${p.slug}`),
  "/news",
  ...articles("news").map((a) => `/news/${a.slug}`),
  "/blog",
  ...articles("blog").map((a) => `/blog/${a.slug}`),
  "/search?q=packing",
  "/contact",
  "/sitemap.xml",
  ...buildSitemapBundle().files.map((file) => `/${file.name}`),
  "/rss.xml",
  "/robots.txt",
  "/api/health",
];

async function main() {
  const tableCount = (db().prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get() as { count: number }).count;
  const issues: Array<{ severity: string; module: string; problem: string }> = [];
  for (const product of products()) {
    if (!product.seo_title || !product.seo_description) issues.push({ severity: "P2", module: "SEO", problem: `Product SEO missing: ${product.slug}` });
  }
  const bundle = buildSitemapBundle();
  if (bundle.entries.some((entry) => entry.loc.includes("?") || entry.loc.includes("/admin") || entry.loc.includes("/search"))) {
    issues.push({ severity: "P1", module: "Sitemap", problem: "Sitemap contains non-canonical or blocked URLs" });
  }
  if (!bundle.indexXml.includes("sitemapindex")) issues.push({ severity: "P1", module: "Sitemap", problem: "Sitemap index missing" });
  for (const article of articles("news")) {
    if (!article.cover_image_url || !article.cover_image_source_url) issues.push({ severity: "P1", module: "News 图片", problem: `News image source missing: ${article.slug}` });
    if (relatedProductsForArticle("news", article.id).length === 0) issues.push({ severity: "P1", module: "News 产品关联", problem: `News relation missing: ${article.slug}` });
  }
  for (const article of articles("blog")) {
    if (!article.cover_image_url || !article.cover_image_source_url) issues.push({ severity: "P1", module: "Blog 图片", problem: `Blog image source missing: ${article.slug}` });
    if (relatedProductsForArticle("blog", article.id).length === 0) issues.push({ severity: "P1", module: "Blog 产品关联", problem: `Blog relation missing: ${article.slug}` });
  }
  console.log(JSON.stringify({ ok: issues.length === 0, architecture: { frontend: "Next.js App Router", database: "SQLite local persistent database", tables: tableCount }, pages: pages.map((p) => `${base}${p}`), issues }, null, 2));
  if (issues.some((issue) => issue.severity === "P0" || issue.severity === "P1")) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
