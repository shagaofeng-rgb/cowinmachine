import crypto from "node:crypto";
import { z } from "zod";
import { db, products, audit } from "./db";
import type { Product } from "./db";
import { canonicalizeUrl, fingerprint, sanitizeHtml, scoreRelevance, slugify, withinLookback } from "./core.mjs";

const Candidate = z.object({
  title: z.string().min(5),
  url: z.string().url(),
  publisher: z.string().min(2),
  publishedAt: z.string(),
  summary: z.string().min(20),
  imageUrl: z.string().url().optional(),
  language: z.string().default("en"),
});

export type CandidateNews = z.infer<typeof Candidate>;

export async function runNewsAutomation(input?: { candidates?: CandidateNews[]; forceTestCandidate?: boolean }) {
  const sqlite = db();
  const jobId = crypto.randomUUID();
  const now = new Date();
  sqlite.prepare("INSERT INTO news_jobs(id, job_type, status, scheduled_at, started_at, metadata) VALUES (?, 'daily_publish', 'running', ?, ?, ?)").run(
    jobId,
    now.toISOString(),
    now.toISOString(),
    JSON.stringify({ mode: input?.forceTestCandidate ? "test" : "live" }),
  );

  try {
    const target = Number(process.env.NEWS_DAILY_TARGET || 4);
    const timezone = process.env.NEWS_TIMEZONE || "Asia/Shanghai";
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const published = sqlite
      .prepare("SELECT COUNT(*) as count FROM news_articles WHERE status = 'published' AND date(published_at) = date(?)")
      .get(now.toISOString()) as { count: number };
    const missing = Math.max(0, target - published.count);
    if (missing === 0) {
      recordAudit(today, timezone, target, published.count, 0, "complete");
      finishJob(jobId, "success", { published: 0, reason: "target_already_met" });
      return { ok: true, published: 0, missing: 0, message: "当日发布数量已达标。" };
    }

    const candidates = input?.candidates?.length ? input.candidates : input?.forceTestCandidate ? [testCandidate()] : [];
    if (candidates.length === 0) {
      recordAudit(today, timezone, target, published.count, missing, "blocked_missing_external_source");
      finishJob(jobId, "failed", { published: 0, reason: "NEWS_API_KEY/RSS 未配置" }, "缺少可验证新闻来源配置");
      return { ok: false, published: 0, missing, message: "缺少可验证新闻来源配置，已记录任务失败；未伪造真实新闻。" };
    }

    let publishedNow = 0;
    for (const raw of candidates.slice(0, missing * 3)) {
      const parsed = Candidate.safeParse(raw);
      if (!parsed.success) continue;
      const result = publishCandidate(parsed.data);
      if (result.ok) publishedNow += 1;
      if (publishedNow >= missing) break;
    }
    const finalPublished = published.count + publishedNow;
    recordAudit(today, timezone, target, finalPublished, Math.max(0, target - finalPublished), finalPublished >= target ? "complete" : "incomplete");
    finishJob(jobId, finalPublished >= target ? "success" : "failed", { published: publishedNow }, finalPublished >= target ? undefined : "候选新闻不足");
    return { ok: finalPublished >= target, published: publishedNow, missing: Math.max(0, target - finalPublished), message: "News 自动发布任务已执行。" };
  } catch (error) {
    finishJob(jobId, "failed", {}, error instanceof Error ? error.message : "未知错误");
    throw error;
  }
}

function publishCandidate(candidate: CandidateNews) {
  const sqlite = db();
  const lookback = Number(process.env.NEWS_LOOKBACK_HOURS || 72);
  if (!withinLookback(candidate.publishedAt, new Date(), lookback)) return { ok: false, reason: "超过72小时或发布时间无效" };
  const canonical = canonicalizeUrl(candidate.url);
  const sourceFp = fingerprint([canonical, candidate.title, candidate.publishedAt]);
  const recentDuplicate = sqlite
    .prepare("SELECT id FROM news_articles WHERE (canonical_source_url = ? OR source_fingerprint = ?) AND source_published_at > datetime('now', '-7 days')")
    .get(canonical, sourceFp);
  if (recentDuplicate) return { ok: false, reason: "7天内重复来源" };

  const relation = scoreRelevance(`${candidate.title} ${candidate.summary}`, products());
  const threshold = Number(process.env.NEWS_RELEVANCE_THRESHOLD || 0.35);
  if (!relation.product || relation.score < threshold) return { ok: false, reason: "产品相关性不足" };
  const product = relation.product as Product;

  const slug = uniqueSlug(slugify(candidate.title));
  const image = candidate.imageUrl || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=80";
  const sourceAt = new Date(candidate.publishedAt).toISOString();
  const content = sanitizeHtml(`<h2>Core Answer</h2><p>${candidate.summary}</p><h2>Source Facts</h2><p>This article summarizes verified public source information from ${candidate.publisher}. It does not republish the original article.</p><h2>Our View</h2><p>The event may influence packaging automation buyers who need stable capacity, traceable coding, and reliable sealing or filling workflows.</p><h2>How We Can Help</h2><p>${product.english_name} is relevant because ${relation.reason}. Customers can review the product page or submit an inquiry for a tailored packaging solution.</p>`);
  const insert = sqlite.prepare(`INSERT INTO news_articles
    (title, slug, excerpt, content, status, cover_image_url, cover_image_source_url, cover_image_page_url, cover_image_alt,
     author_name, category_id, published_at, seo_title, seo_description, canonical_url, primary_keyword, secondary_keywords,
     geo_summary, key_takeaways, source_title, source_author, source_publisher, source_url, canonical_source_url,
     source_language, source_published_at, source_fetched_at, source_timezone, source_fingerprint, event_fingerprint,
     content_hash, relevance_score, credibility_score, generation_model, generation_prompt_version)
    VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?, 'Lianteng Editorial', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = insert.run(
    candidate.title,
    slug,
    candidate.summary.slice(0, 220),
    content,
    image,
    candidate.imageUrl ? candidate.imageUrl : "https://unsplash.com/",
    candidate.url,
    `${candidate.title} related packaging automation image`,
    new Date().toISOString(),
    `${candidate.title} | Lianteng News`,
    candidate.summary.slice(0, 155),
    `/news/${slug}`,
    product.english_name,
    product.tags,
    `${candidate.title}. Lianteng analysis connects this public source to ${product.english_name}.`,
    "Verified source summary; independent analysis; related product guidance",
    candidate.title,
    "",
    candidate.publisher,
    candidate.url,
    canonical,
    candidate.language,
    sourceAt,
    new Date().toISOString(),
    "UTC",
    sourceFp,
    fingerprint([candidate.publisher, candidate.title.slice(0, 40), sourceAt.slice(0, 10)]),
    fingerprint([content]),
    relation.score,
    0.7,
    process.env.AI_PROVIDER_API_KEY ? "configured-ai-provider" : "template-without-ai-key",
    "v1",
  );
  sqlite.prepare("INSERT INTO news_products(news_id, product_id, relevance_score, relationship_reason) VALUES (?, ?, ?, ?)").run(
    info.lastInsertRowid,
    product.id,
    relation.score,
    relation.reason,
  );
  audit("自动发布News", "News自动化", "success", String(info.lastInsertRowid), candidate.title);
  return { ok: true, id: info.lastInsertRowid };
}

function uniqueSlug(base: string) {
  const sqlite = db();
  let slug = base;
  let i = 2;
  while (sqlite.prepare("SELECT id FROM news_articles WHERE slug = ?").get(slug)) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

function recordAudit(date: string, timezone: string, target: number, published: number, missing: number, status: string) {
  db().prepare("INSERT INTO news_publication_audits(date, timezone, target_count, published_count, missing_count, status) VALUES (?, ?, ?, ?, ?, ?)").run(
    date,
    timezone,
    target,
    published,
    missing,
    status,
  );
}

function finishJob(id: string, status: string, metadata: unknown, error?: string) {
  db().prepare("UPDATE news_jobs SET status = ?, completed_at = ?, error_message = ?, metadata = ? WHERE id = ?").run(
    status,
    new Date().toISOString(),
    error || null,
    JSON.stringify(metadata),
    id,
  );
}

function testCandidate(): CandidateNews {
  return {
    title: `Granule packing machine automation source validation ${new Date().toISOString().slice(0, 10)}`,
    url: `https://example.com/public-source/packaging-automation-${Date.now()}`,
    publisher: "Example Public Source",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    summary: "A test-mode public-source candidate about granule packing, food packaging automation and LT-320K workflow validation. It validates publishing workflow, deduplication, image fields and product relevance without pretending to be a real news report.",
    imageUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1400&q=80",
    language: "en",
  };
}
