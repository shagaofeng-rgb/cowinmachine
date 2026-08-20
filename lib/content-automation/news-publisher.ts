import "server-only";

import { randomUUID } from "node:crypto";

import master from "@/data/product-audit/canonical-product-master.json";
import { createHumanizedEditorialDraft } from "@/lib/content-automation/ai-editorial";
import { contentAutomationConfig, isAutoPublishEnabled } from "@/lib/content-automation/config";
import { newsSql } from "@/lib/content-automation/database";
import { markSourceUsed, listFreshNewsCandidates, updateCandidateStatus } from "@/lib/content-automation/news-source-store";
import { ngramSimilarity, tokenSimilarity } from "@/lib/content-automation/similarity";
import { contentStore } from "@/lib/content-automation/storage";
import { products } from "@/lib/products";
import type { ContentArticle, ContentSource } from "@/types/content-automation";

type Canonical = {
  canonicalId: string;
  category: string;
  family: string;
  model: string | null;
  currentUrls: string[];
  productStatus: string;
  verifiedSpecifications: Record<string, string | number>;
};

const canonicalProducts = (master as unknown as { products: Canonical[] }).products;
const DAY = 86_400_000;
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 96);
const age = (value: string, now: Date) => (now.valueOf() - new Date(value).valueOf()) / DAY;
const publicUrl = (path: string) => `https://cowinmachine.com${path}`;

function selectVerifiedProduct(category: string) {
  const canonical = canonicalProducts.find((entry) => entry.category === category && entry.productStatus === "verified-model" && entry.currentUrls.length > 0);
  if (!canonical) return undefined;
  const path = new URL(canonical.currentUrls[0]).pathname;
  const product = products.find((entry) => `/products/${entry.category}/${entry.slug}` === path);
  if (!product?.heroImage) return undefined;
  return { canonical, product, path };
}

function cta(category: string) {
  const values: Record<string, string> = {
    "magnetic-separators": "Share belt width, burden depth, suspension height, material type and iron contamination level.",
    "compressed-air-equipment": "Share required pressure, air delivery, power source, operating hours and application.",
    "drilling-equipment": "Share drilling depth, hole diameter, geology, drilling method and site conditions.",
    "drilling-consumables": "Share hammer type, shank, bit size, formation and drilling method.",
    "mobile-lighting-systems": "Share required lighting duration, project location, power availability, mast requirement and security needs.",
    "generator-systems": "Share load requirement, voltage, frequency, phase, operating hours and site conditions.",
  };
  return values[category] ?? "Share your application and operating requirements for a configuration review.";
}

function relevance(candidate: { title: string; summary: string }, category: string) {
  const value = `${candidate.title} ${candidate.summary}`.toLowerCase();
  const terms: Record<string, string[]> = {
    "compressed-air-equipment": ["compressor", "compressed air", "pneumatic"],
    "generator-systems": ["generator", "temporary power", "diesel power"],
    "drilling-equipment": ["drilling", "drill rig", "borehole", "water well", "dth"],
    "drilling-consumables": ["dth", "drill bit", "drilling tool", "hammer"],
    "mobile-lighting-systems": ["light tower", "mobile lighting", "temporary lighting", "solar lighting"],
    "magnetic-separators": ["magnetic", "separation", "sorting", "iron removal", "mineral processing"],
  };
  return (terms[category] ?? []).some((term) => value.includes(term));
}

function formatBody(input: {
  body: string;
  faq: Array<{ question: string; answer: string }>;
  source: { publisher: string; title: string; date: string; url: string };
  internalLinks: string[];
  technicalCta: string;
}) {
  const relatedProducts = input.internalLinks.filter((link) => link.startsWith("/products/")).map((link) => `- [Related product](${link})`).join("\n");
  const solutions = input.internalLinks.filter((link) => link.startsWith("/solutions")).map((link) => `- [Related industry solution](${link})`).join("\n");
  const faq = input.faq.map((entry) => `### ${entry.question}\n${entry.answer}`).join("\n\n");
  return [
    input.body,
    "## Related Products",
    relatedProducts || "- Product selection is subject to application review.",
    "## Related Industry Solutions",
    solutions || "- [Discuss your application](/request-a-quote)",
    "## Sources & Further Reading",
    `- Publisher: ${input.source.publisher}`,
    `- Article title: [${input.source.title}](${input.source.url})`,
    `- Publication date: ${input.source.date}`,
    "- Why it is relevant: This independent reporting provides current industry context only and does not indicate a commercial relationship with COWIN MACHINE.",
    "## Technical Inquiry CTA",
    input.technicalCta,
    "## FAQ",
    faq,
  ].join("\n\n");
}

async function writeHumanizerAudit(input: {
  articleId: string;
  originalDraftHash: string;
  humanizedDraftHash: string;
  prohibitedPhrases: string[];
  similarityBefore: number;
  similarityAfter: number;
  factDeltaDetected: boolean;
  passed: boolean;
}) {
  const sql = newsSql();
  await sql.query(
    `INSERT INTO news_humanizer_audits (
      article_id, original_draft_hash, humanized_draft_hash, factual_fields_locked,
      removed_ai_patterns, prohibited_phrases_found, similarity_before,
      similarity_after, fact_delta_detected, passed, processed_at
    ) VALUES ($1,$2,$3,$4::text[],$5::text[],$6::text[],$7,$8,$9,$10,NOW())`,
    [input.articleId, input.originalDraftHash, input.humanizedDraftHash, ["product", "industry", "scenario", "source title", "source date", "source URL"], [], input.prohibitedPhrases, input.similarityBefore, input.similarityAfter, input.factDeltaDetected, input.passed],
  );
}

export type NewsPublishResult = {
  dryRun: boolean;
  status: "published" | "drafted" | "blocked" | "nothing-eligible";
  articleId?: string;
  reasons: string[];
};

export async function publishDailyNews(options: { dryRun: boolean }): Promise<NewsPublishResult> {
  const now = new Date();
  const store = contentStore();
  const state = await store.read();
  if (state.articles.some((article) => article.publishedAt && article.publishedAt.slice(0, 10) === now.toISOString().slice(0, 10))) {
    return { dryRun: options.dryRun, status: "nothing-eligible", reasons: ["A News article has already been published for this UTC day."] };
  }

  const candidates = (await listFreshNewsCandidates()).filter((candidate) =>
    candidate.sourceQuality !== "secondary"
    && candidate.productCategories.some((category) => relevance(candidate, category)),
  );

  for (const candidate of candidates) {
    const category = candidate.productCategories.find((entry) => relevance(candidate, entry));
    if (!category) continue;
    const selected = selectVerifiedProduct(category);
    if (!selected) continue;

    const productUrl = selected.path;
    const industry = candidate.industries[0] ?? "industrial projects";
    const scenario = `${industry} application review`;
    const topicKey = `${selected.canonical.canonicalId}:${industry}:${candidate.sourceId}`;
    const recent = state.articles.filter((article) => age(article.publishedAt ?? article.createdAt, now) <= 90);
    if (recent.some((article) => article.similarityKey === topicKey)) continue;
    if (recent.filter((article) => article.productFamily === category).slice(0, 2).length >= 2) continue;
    if (recent.some((article) => article.sources.some((source) => source.url === candidate.sourceUrl))) continue;

    if (options.dryRun) {
      return { dryRun: true, status: "drafted", reasons: [`Eligible candidate selected: ${candidate.title}`] };
    }

    try {
      await updateCandidateStatus(candidate.id, "queued");
      const internalLinks = [productUrl, `/solutions/${category === "magnetic-separators" ? "mineral-processing-recycling" : "construction-sites"}`, "/request-a-quote"];
      const { draft, audit, factDeltaDetected } = await createHumanizedEditorialDraft({
        productName: selected.product.name,
        productCategory: category,
        productModel: selected.canonical.model ?? undefined,
        productDescription: selected.product.description,
        industry,
        scenario,
        source: { publisher: candidate.sourceName, title: candidate.title, date: candidate.publishedAt.slice(0, 10), url: candidate.sourceUrl, sourceSummary: candidate.summary },
        internalLinks,
        technicalCta: cta(category),
      });
      const body = formatBody({ body: draft.body, faq: draft.faq, source: { publisher: candidate.sourceName, title: candidate.title, date: candidate.publishedAt.slice(0, 10), url: candidate.sourceUrl }, internalLinks, technicalCta: cta(category) });
      const titleSimilarity = Math.max(0, ...recent.map((article) => tokenSimilarity(draft.title, article.title)));
      const bodySimilarity = Math.max(0, ...recent.map((article) => ngramSimilarity(body, article.body)));
      const passed = audit.passed && !factDeltaDetected && titleSimilarity < 0.4 && bodySimilarity < 0.5;
      const id = randomUUID();
      if (!passed) {
        await updateCandidateStatus(candidate.id, "rejected", "Humanizer, fact lock, length, or similarity gate failed.");
        return { dryRun: false, status: "blocked", reasons: ["The selected candidate failed the mandatory editorial quality gate."] };
      }

      const source: ContentSource = { id: candidate.sourceId, name: `${candidate.sourceName}: ${candidate.title}`, url: candidate.sourceUrl, publishedAt: candidate.publishedAt, sourceQuality: candidate.sourceQuality, primaryFact: candidate.summary || "Current industry context cited in the article." };
      const canPublish = isAutoPublishEnabled();
      const article: ContentArticle = {
        id, slug: slugify(draft.title), title: draft.title, summary: draft.summary, body,
        productFamily: category, productUrl, industry, scenario, similarityKey: topicKey,
        sources: [source], internalLinks,
        image: { src: selected.product.heroImage ?? "", alt: `${selected.product.name} for ${industry}`, source: "cowin-machine-authorized", licenseStatus: "authorized" },
        status: canPublish ? "published" : "pending-review",
        createdAt: now.toISOString(), updatedAt: now.toISOString(),
        publishedAt: canPublish ? now.toISOString() : undefined,
        discoveryStatus: canPublish ? "included-in-sitemap" : "crawl-status-unknown",
        qualityReport: { passed, checks: [], titleSimilarity, bodySimilarity, internalLinkCount: internalLinks.length },
      };
      await store.write({ ...state, articles: [...state.articles, article], runs: [...state.runs, { id: `news-publish-${now.getTime()}`, startedAt: now.toISOString(), mode: contentAutomationConfig().mode, dryRun: false, result: article.status }] });
      await writeHumanizerAudit({
        articleId: id,
        originalDraftHash: String(draft.body.length),
        humanizedDraftHash: String(body.length),
        prohibitedPhrases: audit.found,
        similarityBefore: titleSimilarity,
        similarityAfter: bodySimilarity,
        factDeltaDetected,
        passed,
      });
            if (canPublish) await markSourceUsed(candidate.sourceId);
      return { dryRun: false, status: canPublish ? "published" : "drafted", articleId: article.id, reasons: canPublish ? [] : ["Draft generated successfully; set CONTENT_MODE=publish and AUTO_PUBLISH=true to permit publication."] };
    } catch (error) {
      await updateCandidateStatus(candidate.id, "rejected", error instanceof Error ? error.message.slice(0, 240) : "News generation failed.");
      return { dryRun: false, status: "blocked", reasons: [error instanceof Error ? error.message : "News generation failed."] };
    }
  }

  return { dryRun: options.dryRun, status: "nothing-eligible", reasons: ["No fresh, verified product-and-source combination is ready for publication."] };
}
