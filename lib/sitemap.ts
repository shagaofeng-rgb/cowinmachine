import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { db, articles, productCategories, products } from "./db";
import { submitGoogleSitemap } from "./google-seo";

const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";
const MAX_URLS_PER_SITEMAP = 50_000;
const MAX_BYTES_PER_SITEMAP = 50 * 1024 * 1024;
const STATIC_LASTMOD = "2026-07-10";

export type SitemapSection = "pages" | "products" | "categories" | "posts";

export type SitemapEntry = {
  loc: string;
  lastmod: string;
  section: SitemapSection;
};

export type SitemapFile = {
  name: string;
  section: SitemapSection;
  urlCount: number;
  lastmod: string;
  xml: string;
  sizeBytes: number;
};

export type SitemapBundle = {
  indexXml: string;
  files: SitemapFile[];
  entries: SitemapEntry[];
  urlCount: number;
  totalSizeBytes: number;
  split: boolean;
  skipped: Array<{ path: string; reason: string }>;
  errors: Array<{ path: string; reason: string }>;
};

export type SitemapRunResult = {
  ok: boolean;
  runId: string;
  trigger: string;
  bundle: SitemapBundle;
  submittedToGoogle: boolean;
  googleResult: string;
  diff: { added: string[]; removed: string[]; changed: string[] };
  message: string;
};

type BuildOptions = {
  baseUrl?: string;
  maxUrlsPerFile?: number;
  submit?: boolean;
};

type RunOptions = BuildOptions & {
  trigger: "manual" | "cron" | "content-change" | "test";
  force?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  outputDir?: string;
};

export function productionSiteUrl() {
  return normalizeBaseUrl(process.env.SITE_URL || "https://cowinmachine.com");
}

export function sitemapIndexUrl(baseUrl = productionSiteUrl()) {
  return `${normalizeBaseUrl(baseUrl)}/sitemap.xml`;
}

export function buildSitemapBundle(options: BuildOptions = {}): SitemapBundle {
  const baseUrl = normalizeBaseUrl(options.baseUrl || productionSiteUrl());
  const maxUrlsPerFile = options.maxUrlsPerFile || MAX_URLS_PER_SITEMAP;
  const skipped: SitemapBundle["skipped"] = [];
  const errors: SitemapBundle["errors"] = [];
  const entries = collectSitemapEntries(baseUrl, skipped, errors);
  const files = splitSections(entries, maxUrlsPerFile);
  const indexXml = renderSitemapIndex(files, baseUrl);
  const totalSizeBytes = files.reduce((sum, file) => sum + file.sizeBytes, Buffer.byteLength(indexXml, "utf8"));
  return {
    indexXml,
    files,
    entries,
    urlCount: entries.length,
    totalSizeBytes,
    split: files.length > 1,
    skipped,
    errors,
  };
}

export async function runSitemapJob(options: RunOptions): Promise<SitemapRunResult> {
  const sqlite = db();
  const runId = `sitemap-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const startedAt = new Date();
  const lock = acquireSitemapLock(runId);
  if (!lock) {
    const emptyBundle = buildSitemapBundle(options);
    return {
      ok: false,
      runId,
      trigger: options.trigger,
      bundle: emptyBundle,
      submittedToGoogle: false,
      googleResult: "skipped: lock already held",
      diff: { added: [], removed: [], changed: [] },
      message: "Sitemap job skipped because another run is active.",
    };
  }

  sqlite
    .prepare("INSERT INTO sitemap_runs(id, trigger_type, status, started_at) VALUES (?, ?, 'running', ?)")
    .run(runId, options.trigger, startedAt.toISOString());

  try {
    const bundle = buildSitemapBundle(options);
    const diff = computeDiff(bundle.entries);
    let googleResult = "disabled";
    let submittedToGoogle = false;

    if (!options.dryRun && options.outputDir) {
      await writeSitemapFilesAtomic(options.outputDir, bundle);
    }

    if (options.submit && googleSubmissionEnabled()) {
      const result = await submitGoogleSitemap();
      submittedToGoogle = result.ok;
      googleResult = result.message;
    } else if (options.submit) {
      googleResult = "disabled: GOOGLE_SEARCH_CONSOLE_ENABLED is not true";
    }

    if (!options.dryRun) {
      sqlite
        .prepare("INSERT OR REPLACE INTO system_settings(key, value, updated_at) VALUES ('sitemap_snapshot', ?, CURRENT_TIMESTAMP)")
        .run(JSON.stringify(snapshotFromEntries(bundle.entries)));
    }

    const completedAt = new Date();
    sqlite
      .prepare(
        `UPDATE sitemap_runs SET
          status = 'success',
          completed_at = ?,
          duration_ms = ?,
          sitemap_files = ?,
          url_count = ?,
          success_count = ?,
          skipped_count = ?,
          error_count = ?,
          file_size_bytes = ?,
          split = ?,
          submitted_to_google = ?,
          google_result = ?,
          diff_summary = ?
        WHERE id = ?`,
      )
      .run(
        completedAt.toISOString(),
        completedAt.getTime() - startedAt.getTime(),
        JSON.stringify(bundle.files.map((file) => file.name)),
        bundle.urlCount,
        bundle.urlCount,
        bundle.skipped.length,
        bundle.errors.length,
        bundle.totalSizeBytes,
        bundle.split ? 1 : 0,
        submittedToGoogle ? 1 : 0,
        googleResult,
        JSON.stringify(diff),
        runId,
      );

    return {
      ok: true,
      runId,
      trigger: options.trigger,
      bundle,
      submittedToGoogle,
      googleResult,
      diff,
      message: "Sitemap generated successfully.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sitemap generation error";
    const completedAt = new Date();
    sqlite
      .prepare("UPDATE sitemap_runs SET status = 'failed', completed_at = ?, duration_ms = ?, error_count = 1, error_message = ? WHERE id = ?")
      .run(completedAt.toISOString(), completedAt.getTime() - startedAt.getTime(), message, runId);
    const bundle = buildSitemapBundle(options);
    return {
      ok: false,
      runId,
      trigger: options.trigger,
      bundle,
      submittedToGoogle: false,
      googleResult: "not submitted",
      diff: { added: [], removed: [], changed: [] },
      message,
    };
  } finally {
    releaseSitemapLock(runId);
  }
}

export function getSitemapFile(name: string, options: BuildOptions = {}) {
  const bundle = buildSitemapBundle(options);
  return bundle.files.find((file) => file.name === name);
}

export function latestSitemapRuns(limit = 10) {
  return db()
    .prepare("SELECT * FROM sitemap_runs ORDER BY started_at DESC LIMIT ?")
    .all(limit) as Array<Record<string, string | number>>;
}

function collectSitemapEntries(baseUrl: string, skipped: SitemapBundle["skipped"], errors: SitemapBundle["errors"]) {
  const entries: SitemapEntry[] = [];
  const add = (section: SitemapSection, pagePath: string, lastmod: string) => {
    try {
      if (!pagePath || pagePath.includes("?") || pagePath.startsWith("/admin") || pagePath.startsWith("/search")) {
        skipped.push({ path: pagePath, reason: "not a canonical public URL" });
        return;
      }
      entries.push({ section, loc: absoluteUrl(baseUrl, pagePath), lastmod: normalizeLastmod(lastmod) });
    } catch (error) {
      errors.push({ path: pagePath, reason: error instanceof Error ? error.message : "invalid URL" });
    }
  };

  const productList = products();
  const categoryList = productCategories();
  const newsList = articles("news", 1000);
  const blogList = articles("blog", 1000);
  const latestProduct = maxLastmod(productList.map((product) => product.updated_at));
  const latestNews = maxLastmod(newsList.map((article) => article.updated_at || article.published_at));
  const latestBlog = maxLastmod(blogList.map((article) => article.updated_at || article.published_at));
  const latestAny = maxLastmod([latestProduct, latestNews, latestBlog, STATIC_LASTMOD]);

  add("pages", "/", latestAny);
  add("pages", "/products", latestProduct);
  add("pages", "/news", latestNews || STATIC_LASTMOD);
  add("pages", "/blog", latestBlog || STATIC_LASTMOD);
  add("pages", "/contact", STATIC_LASTMOD);

  for (const category of categoryList) add("categories", `/products/category/${category.slug}`, category.updated_at || latestProduct);
  for (const product of productList) add("products", `/products/${product.slug}`, product.updated_at);
  for (const article of newsList) add("posts", `/news/${article.slug}`, article.updated_at || article.published_at);
  for (const article of blogList) add("posts", `/blog/${article.slug}`, article.updated_at || article.published_at);

  return dedupeEntries(entries);
}

function splitSections(entries: SitemapEntry[], maxUrlsPerFile: number) {
  const files: SitemapFile[] = [];
  for (const section of ["pages", "categories", "products", "posts"] as SitemapSection[]) {
    const sectionEntries = entries.filter((entry) => entry.section === section);
    if (!sectionEntries.length) continue;
    for (let index = 0; index < sectionEntries.length; index += maxUrlsPerFile) {
      const chunk = sectionEntries.slice(index, index + maxUrlsPerFile);
      const needsNumber = sectionEntries.length > maxUrlsPerFile;
      const name = `sitemaps/${section}${needsNumber ? `-${Math.floor(index / maxUrlsPerFile) + 1}` : ""}.xml`;
      const xml = renderUrlset(chunk);
      const sizeBytes = Buffer.byteLength(xml, "utf8");
      if (sizeBytes > MAX_BYTES_PER_SITEMAP) throw new Error(`${name} exceeds 50MB uncompressed sitemap limit`);
      files.push({ name, section, urlCount: chunk.length, lastmod: maxLastmod(chunk.map((entry) => entry.lastmod)), xml, sizeBytes });
    }
  }
  return files;
}

function renderUrlset(entries: SitemapEntry[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${SITEMAP_NS}">${entries
    .map((entry) => `<url><loc>${escapeXml(entry.loc)}</loc><lastmod>${escapeXml(entry.lastmod)}</lastmod></url>`)
    .join("")}</urlset>`;
}

function renderSitemapIndex(files: SitemapFile[], baseUrl: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="${SITEMAP_NS}">${files
    .map((file) => `<sitemap><loc>${escapeXml(`${baseUrl}/${file.name}`)}</loc><lastmod>${escapeXml(file.lastmod)}</lastmod></sitemap>`)
    .join("")}</sitemapindex>`;
}

async function writeSitemapFilesAtomic(outputDir: string, bundle: SitemapBundle) {
  const targetRoot = path.resolve(outputDir);
  const tempRoot = path.join(targetRoot, `.sitemap-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`);
  try {
    await fs.mkdir(path.join(tempRoot, "sitemaps"), { recursive: true });
    await fs.writeFile(path.join(tempRoot, "sitemap.xml"), bundle.indexXml, "utf8");
    for (const file of bundle.files) {
      const target = path.join(tempRoot, file.name);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, file.xml, "utf8");
    }
    validateXml(bundle.indexXml, "sitemap.xml");
    for (const file of bundle.files) validateXml(file.xml, file.name);
    await fs.mkdir(path.join(targetRoot, "sitemaps"), { recursive: true });
    await fs.rename(path.join(tempRoot, "sitemap.xml"), path.join(targetRoot, "sitemap.xml"));
    for (const file of bundle.files) {
      await fs.rename(path.join(tempRoot, file.name), path.join(targetRoot, file.name));
    }
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

function acquireSitemapLock(owner: string) {
  const sqlite = db();
  sqlite.prepare("DELETE FROM sitemap_locks WHERE lock_name = 'sitemap' AND expires_at < ?").run(new Date().toISOString());
  try {
    sqlite
      .prepare("INSERT INTO sitemap_locks(lock_name, owner, expires_at) VALUES ('sitemap', ?, ?)")
      .run(owner, new Date(Date.now() + 5 * 60 * 1000).toISOString());
    return true;
  } catch {
    return false;
  }
}

function releaseSitemapLock(owner: string) {
  db().prepare("DELETE FROM sitemap_locks WHERE lock_name = 'sitemap' AND owner = ?").run(owner);
}

function computeDiff(entries: SitemapEntry[]) {
  const previous = readPreviousSnapshot();
  const current = snapshotFromEntries(entries);
  const added = Object.keys(current).filter((loc) => !previous[loc]);
  const removed = Object.keys(previous).filter((loc) => !current[loc]);
  const changed = Object.keys(current).filter((loc) => previous[loc] && previous[loc] !== current[loc]);
  return { added, removed, changed };
}

function readPreviousSnapshot() {
  const row = db().prepare("SELECT value FROM system_settings WHERE key = 'sitemap_snapshot'").get() as { value: string } | undefined;
  if (!row) return {} as Record<string, string>;
  try {
    return JSON.parse(row.value) as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
}

function snapshotFromEntries(entries: SitemapEntry[]) {
  return Object.fromEntries(entries.map((entry) => [entry.loc, entry.lastmod]));
}

function googleSubmissionEnabled() {
  return process.env.GOOGLE_SEARCH_CONSOLE_ENABLED === "true" || process.env.GSC_SUBMIT_ENABLED === "true";
}

function dedupeEntries(entries: SitemapEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.loc)) return false;
    seen.add(entry.loc);
    return true;
  });
}

function maxLastmod(values: Array<string | null | undefined>) {
  const dates = values.filter(Boolean).map((value) => normalizeLastmod(value || STATIC_LASTMOD)).sort();
  return dates.at(-1) || STATIC_LASTMOD;
}

function normalizeLastmod(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return STATIC_LASTMOD;
  return date.toISOString().slice(0, 10);
}

function absoluteUrl(baseUrl: string, pagePath: string) {
  const url = new URL(pagePath, `${baseUrl}/`);
  if (url.origin !== baseUrl) throw new Error("URL must stay on production origin");
  return url.toString();
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function validateXml(xml: string, name: string) {
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) throw new Error(`${name} missing XML declaration`);
  if (xml.includes("<script")) throw new Error(`${name} contains unsafe markup`);
}

export const sitemapTesting = {
  escapeXml,
  validateXml,
};
