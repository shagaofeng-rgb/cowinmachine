import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { newsSql } from "@/lib/content-automation/database";
import type { ContentArticle, ContentAutomationState, ContentChannel, ContentImage, ContentQualityReport, ContentSource } from "@/types/content-automation";

const statePath = path.join(process.cwd(), "data", "content-automation", "content-state.json");
const emptyState = (): ContentAutomationState => ({ version: 1, articles: [], runs: [] });

export type ContentStore = { read(): Promise<ContentAutomationState>; write(state: ContentAutomationState): Promise<void> };

const array = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];
const date = (value: unknown) => value ? new Date(String(value)).toISOString() : undefined;

export function getArticleChannel(article: Pick<ContentArticle, "channel" | "productFamily">): ContentChannel {
  if (article.channel) return article.channel;
  // The legacy external webhook labelled Blog submissions as external-news.
  // Treat those records as Blog without rewriting or deleting production data.
  return article.productFamily === "external-news" || article.productFamily === "external-blog" ? "blog" : "news";
}

function toArticle(row: Record<string, unknown>): ContentArticle {
  const quality = row.quality_report && typeof row.quality_report === "object" ? row.quality_report as ContentQualityReport : { passed: false, checks: [], titleSimilarity: 0, bodySimilarity: 0, internalLinkCount: 0 };
  const productFamily = String(row.product_category);
  return {
    id: String(row.id), slug: String(row.slug), title: String(row.title), summary: String(row.summary), body: String(row.content),
    channel: productFamily === "external-news" || productFamily === "external-blog" ? "blog" : "news",
    productFamily, productUrl: String(row.product_id), industry: String(row.industry),
    scenario: String(row.application_scenario), similarityKey: String(row.topic_key), sources: array<ContentSource>(row.citations),
    internalLinks: array<string>(row.internal_links), image: array<ContentImage>(row.images)[0],
    status: String(row.status) as ContentArticle["status"], createdAt: date(row.created_at) ?? new Date().toISOString(),
    updatedAt: date(row.updated_at) ?? new Date().toISOString(), publishedAt: date(row.published_at),
    discoveryStatus: row.status === "published" ? "included-in-sitemap" : "crawl-status-unknown", qualityReport: quality,
  };
}

export class FileContentStore implements ContentStore {
  async read() {
    try { return JSON.parse(await fs.readFile(statePath, "utf8")) as ContentAutomationState; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyState(); throw error; }
  }
  async write(state: ContentAutomationState) {
    if (process.env.VERCEL === "1") throw new Error("File storage is not persistent on Vercel. Configure the Neon storage adapter.");
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  }
}

export class NeonContentStore implements ContentStore {
  async read(): Promise<ContentAutomationState> {
    const sql = newsSql();
    const [articles, runs] = await Promise.all([
      sql.query("SELECT * FROM news_articles ORDER BY COALESCE(published_at, created_at) DESC"),
      sql.query("SELECT idempotency_key AS id, started_at, status FROM news_runs ORDER BY started_at DESC LIMIT 120"),
    ]);
    return { version: 1, articles: articles.map((row) => toArticle(row as Record<string, unknown>)), runs: runs.map((row) => ({ id: String(row.id), startedAt: date(row.started_at) ?? new Date().toISOString(), mode: "publish", dryRun: false, result: String(row.status) })) };
  }

  async write(state: ContentAutomationState) {
    const sql = newsSql();
    for (const article of state.articles) {
      const words = article.body.trim() ? article.body.trim().split(/\s+/).length : 0;
      const channel = getArticleChannel(article);
      const storedProductFamily = channel === "blog" ? "external-blog" : article.productFamily;
      await sql.query(
        `INSERT INTO news_articles (id,slug,status,title,summary,content,word_count,character_count,product_id,product_category,industry,application_scenario,topic_key,source_ids,citations,images,internal_links,seo_title,seo_description,canonical_url,similarity_score,quality_report,published_at,created_at,updated_at)
         VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb,$17,$18,$19,$20,$21,$22::jsonb,$23,$24,$25)
         ON CONFLICT (slug) DO UPDATE SET status=EXCLUDED.status,title=EXCLUDED.title,summary=EXCLUDED.summary,content=EXCLUDED.content,word_count=EXCLUDED.word_count,character_count=EXCLUDED.character_count,product_id=EXCLUDED.product_id,product_category=EXCLUDED.product_category,industry=EXCLUDED.industry,application_scenario=EXCLUDED.application_scenario,topic_key=EXCLUDED.topic_key,source_ids=EXCLUDED.source_ids,citations=EXCLUDED.citations,images=EXCLUDED.images,internal_links=EXCLUDED.internal_links,seo_title=EXCLUDED.seo_title,seo_description=EXCLUDED.seo_description,canonical_url=EXCLUDED.canonical_url,similarity_score=EXCLUDED.similarity_score,quality_report=EXCLUDED.quality_report,published_at=EXCLUDED.published_at,updated_at=EXCLUDED.updated_at`,
        [article.id,article.slug,article.status,article.title,article.summary,article.body,words,article.body.length,article.productUrl,storedProductFamily,article.industry,article.scenario,article.similarityKey,article.sources.map((source) => source.id),JSON.stringify(article.sources),JSON.stringify(article.image ? [article.image] : []),article.internalLinks,article.title,article.summary,`https://cowinmachine.com/${channel}/${article.slug}`,article.qualityReport.bodySimilarity,JSON.stringify(article.qualityReport),article.publishedAt ?? null,article.createdAt,article.updatedAt],
      );
    }
    for (const run of state.runs) {
      await sql.query("INSERT INTO news_runs (run_date,run_type,status,idempotency_key,started_at,finished_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (idempotency_key) DO NOTHING",[run.startedAt.slice(0,10),"content-automation",run.result,run.id,run.startedAt,run.startedAt]);
    }
  }
}

export function contentStore(): ContentStore {
  const adapter = process.env.CONTENT_STORAGE_ADAPTER ?? ((process.env.DATABASE_URL ?? process.env.POSTGRES_URL) ? "neon" : "file");
  if (adapter === "neon") return new NeonContentStore();
  if (adapter === "file") return new FileContentStore();
  throw new Error("Unsupported CONTENT_STORAGE_ADAPTER. Use neon in production or file for local development.");
}

export async function getPublishedArticles(channel?: ContentChannel) {
  const state = await contentStore().read();
  return state.articles
    .filter((article) => article.status === "published" && (!channel || getArticleChannel(article) === channel))
    .sort((a,b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

export const getPublishedNewsArticles = () => getPublishedArticles("news");
export const getPublishedBlogArticles = () => getPublishedArticles("blog");
