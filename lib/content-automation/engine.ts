import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { contentAutomationConfig, isAutoPublishEnabled } from "@/lib/content-automation/config";
import { ngramSimilarity, tokenSimilarity } from "@/lib/content-automation/similarity";
import { contentStore } from "@/lib/content-automation/storage";
import type { ContentArticle, ContentAutomationState, ContentQualityReport, ContentSource } from "@/types/content-automation";

type Candidate = { id: string; url: string; sourceName: string; publishedAt: string; primaryFacts: string[]; sourceQuality: ContentSource["sourceQuality"]; eligibleForArticle: boolean; imageLicenseStatus: string; originalityRisk: string };
type QueueItem = { id: string; title: string; primaryProductFamily: string; primaryProductUrl: string; industry: string; scenario: string; similarityKey: string; internalLinks: string[]; requiredSources: string[]; status: string };
type Canonical = { productStatus: string; currentUrls: string[] };

const root = process.cwd();
const queuePath = path.join(root, "data", "news", "article-queue.json");
const candidatesPath = path.join(root, "data", "news", "source-candidates.json");
const canonicalPath = path.join(root, "data", "product-audit", "canonical-product-master.json");
const readJson = async <T>(file: string): Promise<T> => JSON.parse(await fs.readFile(file, "utf8")) as T;
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const dateDaysAgo = (date: string, now: Date) => (now.getTime() - new Date(date).getTime()) / 86_400_000;

function publicPath(url: string) {
  try { return new URL(url).pathname; } catch { return url; }
}

function extractSummary(body: string) {
  const introduction = body.split("## Product / equipment category overview")[0] ?? body;
  const clean = introduction.replace(/^#.*$/m, "").replace(/^>.*$/gm, "").replace(/## Answer-first introduction/, "").replace(/\s+/g, " ").trim();
  return clean.split(/(?<=[.!?])\s+/).slice(0, 3).join(" ").slice(0, 650);
}

function qualityReport(article: Omit<ContentArticle, "qualityReport" | "status" | "createdAt" | "updatedAt" | "discoveryStatus">, history: ContentArticle[], verified: boolean): ContentQualityReport {
  const now = new Date();
  const previous = history.filter((entry) => dateDaysAgo(entry.publishedAt ?? entry.createdAt, now) <= 60);
  const titleSimilarity = Math.max(0, ...previous.map((entry) => tokenSimilarity(article.title, entry.title)));
  const bodySimilarity = Math.max(0, ...previous.map((entry) => ngramSimilarity(article.body, entry.body)));
  const sameCombination = previous.some((entry) => entry.similarityKey === article.similarityKey);
  const internalLinkCount = article.internalLinks.length;
  const visibleSources = article.sources.every((source) => source.url.startsWith("https://") && Boolean(source.name));
  const twoRecentSources = article.sources.length >= 2 && article.sources.every((source) => dateDaysAgo(source.publishedAt, now) <= 90);
  const sourceOverused = article.sources.some((source) => history.filter((entry) => dateDaysAgo(entry.publishedAt ?? entry.createdAt, now) <= 30).flatMap((entry) => entry.sources).filter((used) => used.id === source.id).length >= 2);
  const usesUnapprovedImage = Boolean(article.image && article.image.licenseStatus !== "authorized");
  const unverifiedSpecification = /\b\d+(?:\.\d+)?\s?(?:kw|bar|psi|cfm|m³\/min|mm|kg|t\/h|lux|db)\b/i.test(article.body);
  const languageLooksEnglish = (article.body.match(/[A-Za-z]/g)?.length ?? 0) / Math.max(article.body.length, 1) > 0.55;
  const checks = [
    { name: "verified-product-family", passed: verified, detail: verified ? "Mapped to a verified canonical product family." : "The product family is not verified." },
    { name: "two-recent-independent-sources", passed: twoRecentSources, detail: twoRecentSources ? "Two eligible 90-day sources are attached." : "Two eligible recent sources are required." },
    { name: "source-links", passed: visibleSources, detail: visibleSources ? "Sources have user-readable HTTPS links." : "Every source needs a readable HTTPS link." },
    { name: "authorized-image", passed: !usesUnapprovedImage, detail: usesUnapprovedImage ? "Article image is not authorized." : "No third-party image is assigned." },
    { name: "source-frequency", passed: !sourceOverused, detail: sourceOverused ? "A source has already been used twice within 30 days." : "No source exceeds the 30-day use limit." },
    { name: "unconfirmed-product-parameters", passed: !unverifiedSpecification, detail: unverifiedSpecification ? "A technical value requires an approved product fact card." : "No model-specific numeric performance claim was detected." },
    { name: "language-and-fact-guard", passed: languageLooksEnglish && article.body.includes("Configuration subject to application review"), detail: languageLooksEnglish ? "English draft retains the configuration-review fact guard." : "Draft language or fact guard requires review." },
    { name: "internal-links", passed: internalLinkCount >= 3, detail: `${internalLinkCount} internal links attached; minimum is 3.` },
    { name: "title-similarity", passed: titleSimilarity < 0.82 && !sameCombination, detail: `Title similarity ${titleSimilarity.toFixed(2)}; combination repeat ${sameCombination ? "blocked" : "clear"}.` },
    { name: "body-similarity", passed: bodySimilarity < 0.72, detail: `Body n-gram similarity ${bodySimilarity.toFixed(2)}.` },
    { name: "seo-structure", passed: article.body.includes("## FAQ") && article.body.includes("## Sources and further reading"), detail: "FAQ and source sections are present for schema and reader review." },
  ];
  return { passed: checks.every((check) => check.passed), checks, titleSimilarity, bodySimilarity, internalLinkCount };
}

async function loadInputs() {
  const [queueFile, candidateFile, masterFile] = await Promise.all([
    readJson<{ articles: QueueItem[] }>(queuePath),
    readJson<{ candidates: Candidate[] }>(candidatesPath),
    readJson<{ products: Canonical[] }>(canonicalPath),
  ]);
  return { queue: queueFile.articles, candidates: candidateFile.candidates, canonical: masterFile.products };
}

async function draftBody(item: QueueItem) {
  return fs.readFile(path.join(root, "data", "news", "drafts", `${slugify(item.title)}.md`), "utf8");
}

export type AutomationResult = { mode: "draft" | "publish"; dryRun: boolean; status: "drafted" | "published" | "blocked" | "nothing-eligible"; articleId?: string; reasons: string[] };

export async function runContentAutomation(options: { dryRun: boolean; allowManualPublish?: boolean } = { dryRun: false }): Promise<AutomationResult> {
  const { queue, candidates, canonical } = await loadInputs();
  const store = contentStore();
  const state = await store.read();
  const now = new Date();
  const eligible = queue.filter((item) => {
    if (item.status !== "research-ready" || item.requiredSources.some((source) => !source.startsWith("NEWS-"))) return false;
    if (state.articles.some((article) => article.similarityKey === item.similarityKey && dateDaysAgo(article.createdAt, now) <= 60)) return false;
    return true;
  });
  if (!eligible.length) return { mode: contentAutomationConfig().mode, dryRun: options.dryRun, status: "nothing-eligible", reasons: ["No eligible, non-duplicated queue item is available."] };
  let selected: { item: QueueItem; base: Omit<ContentArticle, "qualityReport" | "status" | "createdAt" | "updatedAt" | "discoveryStatus">; report: ContentQualityReport } | undefined;
  let rejectedReasons: string[] = [];
  for (const item of eligible) {
    const attachedSources = item.requiredSources.map((id) => candidates.find((candidate) => candidate.id === id)).filter((candidate): candidate is Candidate => Boolean(candidate)).map((source) => ({ id: source.id, name: source.sourceName, url: source.url, publishedAt: source.publishedAt, sourceQuality: source.sourceQuality, primaryFact: source.primaryFacts[0] ?? "Source context requires review." }));
    const body = await draftBody(item);
    const verified = canonical.some((product) => product.productStatus === "verified-model" && product.currentUrls.some((url) => publicPath(url) === item.primaryProductUrl));
    const base = { id: item.id, slug: slugify(item.title), title: item.title, summary: extractSummary(body), body, productFamily: item.primaryProductFamily, productUrl: item.primaryProductUrl, industry: item.industry, scenario: item.scenario, similarityKey: item.similarityKey, sources: attachedSources, internalLinks: item.internalLinks };
    const report = qualityReport(base, state.articles, verified);
    if (report.passed) { selected = { item, base, report }; break; }
    rejectedReasons = report.checks.filter((check) => !check.passed).map((check) => `${check.name}: ${check.detail}`);
  }
  if (!selected) return { mode: contentAutomationConfig().mode, dryRun: options.dryRun, status: "blocked", reasons: rejectedReasons.length ? rejectedReasons : ["Every available topic failed the quality gate."] };
  const { item: selectedItem, base: selectedBase, report } = selected;
  const base = { ...selectedBase, createdAt: now.toISOString(), updatedAt: now.toISOString() };
  const config = contentAutomationConfig();
  const canPublish = report.passed && (options.allowManualPublish ? config.mode === "publish" && config.adminPublishEnabled : isAutoPublishEnabled());
  const article: ContentArticle = { ...base, status: canPublish ? "published" : "pending-review", publishedAt: canPublish ? now.toISOString() : undefined, discoveryStatus: canPublish ? "included-in-sitemap" : "crawl-status-unknown", qualityReport: report };
  const reasons = report.checks.filter((check) => !check.passed).map((check) => `${check.name}: ${check.detail}`);
  if (!options.dryRun) {
    const next: ContentAutomationState = { ...state, articles: [...state.articles.filter((entry) => entry.id !== article.id), article], runs: [...state.runs, { id: `run-${now.getTime()}`, startedAt: now.toISOString(), mode: config.mode, dryRun: false, result: `${article.status}:${selectedItem.id}` }] };
    await store.write(next);
  }
  return { mode: config.mode, dryRun: options.dryRun, status: article.status === "published" ? "published" : article.status === "blocked" ? "blocked" : "drafted", articleId: article.id, reasons };
}
