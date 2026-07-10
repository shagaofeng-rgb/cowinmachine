import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cowin-sitemap-"));
process.env.DATABASE_PATH = path.join(tmp, "site.db");
process.env.SITE_URL = "https://cowinmachine.com";
process.env.GOOGLE_SEARCH_CONSOLE_ENABLED = "false";

const sitemap = await import("../lib/sitemap.ts");
const google = await import("../lib/google-seo.ts");
const dbModule = await import("../lib/db.ts");

test("generates a sitemap index with public canonical URL groups", () => {
  const bundle = sitemap.buildSitemapBundle();
  assert.equal(bundle.urlCount > 180, true);
  assert.match(bundle.indexXml, /<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(bundle.indexXml, /https:\/\/cowinmachine\.com\/sitemaps\/products\.xml/);
  assert.equal(bundle.entries.some((entry) => entry.loc.includes("/admin")), false);
  assert.equal(bundle.entries.some((entry) => entry.loc.includes("/search")), false);
  assert.equal(bundle.entries.some((entry) => entry.loc.includes("?")), false);
});

test("validates XML and escapes XML-sensitive URL values", () => {
  const bundle = sitemap.buildSitemapBundle();
  sitemap.sitemapTesting.validateXml(bundle.indexXml, "sitemap.xml");
  assert.equal(
    sitemap.sitemapTesting.escapeXml("https://example.com/a?x=1&name=<quote>\"'"),
    "https://example.com/a?x=1&amp;name=&lt;quote&gt;&quot;&apos;",
  );
});

test("excludes archived products and removed public content", () => {
  const sqlite = dbModule.db();
  sqlite
    .prepare(
      `INSERT OR IGNORE INTO product_categories
       (name, english_name, slug, summary, description, image_url, seo_title, seo_description, updated_at)
       VALUES ('Test', 'Test', 'test-sitemap-category', 'Test category', 'Test category', 'https://example.com/test.jpg', 'Test', 'Test', '2025-01-01T00:00:00.000Z')`,
    )
    .run();
  const category = sqlite.prepare("SELECT id FROM product_categories WHERE slug = 'test-sitemap-category'").get();
  sqlite
    .prepare(
      `INSERT OR REPLACE INTO products
       (name, english_name, sku, slug, category_id, summary, description, applications, features, specifications, tags, image_url, status, seo_title, seo_description, updated_at)
       VALUES ('Delete Me', 'Delete Me', 'TEST-SITEMAP-DELETE', 'test-sitemap-delete', ?, 'Summary', 'Description', 'Applications', 'Features', 'Specs', 'Tags', 'https://example.com/delete.jpg', 'published', 'Delete Me', 'Delete Me', '2025-01-02T03:04:05.000Z')`,
    )
    .run(category.id);

  const before = sitemap.buildSitemapBundle();
  assert.equal(before.entries.some((entry) => entry.loc.endsWith("/products/test-sitemap-delete") && entry.lastmod === "2025-01-02"), true);
  assert.equal(before.entries.some((entry) => entry.loc.endsWith("/products/lt-320k-granule-packing-machine")), false);

  sqlite.prepare("UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE slug = 'test-sitemap-delete'").run();
  const after = sitemap.buildSitemapBundle();
  assert.equal(after.entries.some((entry) => entry.loc.endsWith("/products/test-sitemap-delete")), false);
});

test("splits large URL groups and renders sitemap index entries", () => {
  const bundle = sitemap.buildSitemapBundle({ maxUrlsPerFile: 2 });
  const productFiles = bundle.files.filter((file) => file.name.startsWith("sitemaps/products-"));
  assert.equal(productFiles.length > 1, true);
  assert.match(bundle.indexXml, /sitemaps\/products-1\.xml/);
  assert.equal(productFiles.every((file) => file.urlCount <= 2), true);
});

test("prevents concurrent sitemap runs with a database lock", async () => {
  const sqlite = dbModule.db();
  sqlite.prepare("DELETE FROM sitemap_locks WHERE lock_name = 'sitemap'").run();
  sqlite
    .prepare("INSERT INTO sitemap_locks(lock_name, owner, expires_at) VALUES ('sitemap', 'test-owner', ?)")
    .run(new Date(Date.now() + 60_000).toISOString());
  const result = await sitemap.runSitemapJob({ trigger: "test" });
  assert.equal(result.ok, false);
  assert.match(result.message, /another run is active/);
  sqlite.prepare("DELETE FROM sitemap_locks WHERE lock_name = 'sitemap'").run();
});

test("keeps the last good sitemap file if atomic writing fails", async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "cowin-sitemap-output-"));
  fs.writeFileSync(path.join(outputDir, "sitemap.xml"), "old-good-sitemap", "utf8");
  fs.writeFileSync(path.join(outputDir, "sitemaps"), "block-directory-creation", "utf8");

  const result = await sitemap.runSitemapJob({ trigger: "test", outputDir });
  assert.equal(result.ok, false);
  assert.equal(fs.readFileSync(path.join(outputDir, "sitemap.xml"), "utf8"), "old-good-sitemap");
});

test("does not call Google API when sitemap submission is disabled", async () => {
  process.env.GOOGLE_SEARCH_CONSOLE_ENABLED = "false";
  const result = await sitemap.runSitemapJob({ trigger: "test", submit: true });
  assert.equal(result.ok, true);
  assert.equal(result.submittedToGoogle, false);
  assert.match(result.googleResult, /disabled/);
});

test("records Google Search Console sitemap submission success", async () => {
  process.env.GOOGLE_SEARCH_CONSOLE_ENABLED = "true";
  process.env.GSC_CLIENT_EMAIL = "service@example.iam.gserviceaccount.com";
  process.env.GSC_PRIVATE_KEY = "test-key";
  let calls = 0;
  const fetchImpl = async (url, init = {}) => {
    calls += 1;
    if (String(url).includes("cowinmachine.com/sitemap.xml")) {
      return new Response("<xml />", { status: 200, headers: { "content-type": "application/xml" } });
    }
    assert.equal(init.method, "PUT");
    return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  };

  const result = await google.submitGoogleSitemap({
    fetchImpl,
    tokenFactory: async () => "fake-token",
    retries: 0,
  });
  assert.equal(result.ok, true);
  assert.equal(result.submittedSitemap, true);
  assert.equal(calls, 2);
});

test("records Google Search Console API failure without breaking sitemap generation", async () => {
  process.env.GOOGLE_SEARCH_CONSOLE_ENABLED = "true";
  process.env.GSC_CLIENT_EMAIL = "service@example.iam.gserviceaccount.com";
  process.env.GSC_PRIVATE_KEY = "test-key";
  const result = await google.submitGoogleSitemap({
    fetchImpl: async (url, init = {}) => {
      if (String(url).includes("cowinmachine.com/sitemap.xml")) {
        return new Response("<xml />", { status: 200, headers: { "content-type": "application/xml" } });
      }
      assert.equal(init.method, "PUT");
      return new Response(JSON.stringify({ error: { message: "permission denied" } }), { status: 403, headers: { "content-type": "application/json" } });
    },
    tokenFactory: async () => "fake-token",
    retries: 0,
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /permission denied/);
});
