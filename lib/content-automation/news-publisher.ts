import "server-only";

import { randomUUID } from "node:crypto";

import master from "@/data/product-audit/canonical-product-master.json";
import { createHumanizedEditorialDraft, createTechnicalBriefDraft } from "@/lib/content-automation/ai-editorial";
import { contentAutomationConfig, isAutoPublishEnabled } from "@/lib/content-automation/config";
import { newsSql } from "@/lib/content-automation/database";
import { markSourceUsed, listFreshNewsCandidates, updateCandidateStatus } from "@/lib/content-automation/news-source-store";
import { evaluateFallbackPublication, rankFallbackPublishingOptions } from "@/lib/content-automation/publishing-policy";
import { validateDiscoveredArticle } from "@/lib/content-automation/source-validator";
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

const categoryOrder = ["compressed-air-equipment", "generator-systems", "drilling-equipment", "drilling-consumables", "mobile-lighting-systems", "magnetic-separators"];
const fallbackIndustry: Record<string, string> = {
  "compressed-air-equipment": "construction and drilling projects",
  "generator-systems": "temporary site power",
  "drilling-equipment": "water well and site drilling",
  "drilling-consumables": "hard-rock drilling operations",
  "mobile-lighting-systems": "remote and temporary jobsites",
  "magnetic-separators": "bulk material handling and processing",
};
const fallbackScenario: Record<string, string> = {
  "compressed-air-equipment": "field air-supply planning",
  "generator-systems": "temporary-power configuration review",
  "drilling-equipment": "site drilling configuration review",
  "drilling-consumables": "drilling-tool selection review",
  "mobile-lighting-systems": "temporary site-lighting review",
  "magnetic-separators": "material-separation configuration review",
};

const fallbackAngles: Record<string, Array<{ industry: string; scenario: string }>> = {
  "compressed-air-equipment": [
    { industry: "construction and drilling projects", scenario: "field air-supply planning" },
    { industry: "industrial facilities", scenario: "compressor duty-cycle review" },
    { industry: "remote worksites", scenario: "power-source and installation planning" },
    { industry: "mining and quarrying", scenario: "service-access and maintenance planning" },
  ],
  "generator-systems": [
    { industry: "temporary site power", scenario: "temporary-power configuration review" },
    { industry: "remote construction", scenario: "load and power-distribution planning" },
    { industry: "industrial facilities", scenario: "backup-power duty review" },
    { industry: "mining sites", scenario: "fuel, runtime and service-access planning" },
  ],
  "drilling-equipment": [
    { industry: "water well and site drilling", scenario: "site drilling configuration review" },
    { industry: "agricultural irrigation", scenario: "depth, geology and access planning" },
    { industry: "geotechnical works", scenario: "drilling-method and site-layout review" },
    { industry: "mining and quarrying", scenario: "rig mobility and support-equipment planning" },
  ],
  "drilling-consumables": [
    { industry: "hard-rock drilling operations", scenario: "drilling-tool selection review" },
    { industry: "water-well drilling", scenario: "hammer, bit and shank compatibility review" },
    { industry: "quarrying", scenario: "formation and wear-planning review" },
    { industry: "mining maintenance", scenario: "consumables inventory and replacement planning" },
  ],
  "mobile-lighting-systems": [
    { industry: "remote and temporary jobsites", scenario: "temporary site-lighting review" },
    { industry: "roadworks", scenario: "coverage, mast and placement planning" },
    { industry: "construction sites", scenario: "runtime and power-availability review" },
    { industry: "remote camps", scenario: "mobility, security and maintenance planning" },
  ],
  "magnetic-separators": [
    { industry: "bulk material handling and processing", scenario: "material-separation configuration review" },
    { industry: "mineral processing", scenario: "feed, burden and installation planning" },
    { industry: "recycling", scenario: "contaminant-removal and sorting review" },
    { industry: "aggregates", scenario: "conveyor interface and suspension planning" },
  ],
};

function shanghaiDay(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return byType.year + "-" + byType.month + "-" + byType.day;
}

function formatTechnicalBriefBody(input: {
  body: string;
  faq: Array<{ question: string; answer: string }>;
  internalLinks: string[];
  technicalCta: string;
}) {
  const relatedProducts = input.internalLinks.filter((link) => link.startsWith("/products/")).map((link) => "- [Related product](" + link + ")").join("\n");
  const solutions = input.internalLinks.filter((link) => link.startsWith("/solutions")).map((link) => "- [Related industry solution](" + link + ")").join("\n");
  const faq = input.faq.map((entry) => "### " + entry.question + "\n" + entry.answer).join("\n\n");
  return [
    input.body,
    "## Related Products",
    relatedProducts || "- Product selection is subject to application review.",
    "## Related Industry Solutions",
    solutions || "- [Discuss your application](/request-a-quote)",
    "## About this technical brief",
    "This article provides configuration-planning guidance from verified COWIN MACHINE product context. It does not report a current external industry event.",
    "## Technical Inquiry CTA",
    input.technicalCta,
    "## FAQ",
    faq,
  ].join("\n\n");
}


function verifiedProductsForCategory(category: string) {
  return canonicalProducts.flatMap((canonical) => {
    if (canonical.category !== category || canonical.productStatus !== "verified-model" || canonical.currentUrls.length === 0) return [];
    let publicPath: string;
    try { publicPath = new URL(canonical.currentUrls[0]).pathname; }
    catch { return []; }
    const product = products.find((entry) => `/products/${entry.category}/${entry.slug}` === publicPath);
    return product?.heroImage ? [{ canonical, product, path: publicPath }] : [];
  });
}

function selectVerifiedProduct(category: string) {
  return verifiedProductsForCategory(category)[0];
}

function fallbackPublishingOptions() {
  return categoryOrder.flatMap((category) => verifiedProductsForCategory(category).flatMap((selected) =>
    (fallbackAngles[category] ?? [{ industry: fallbackIndustry[category], scenario: fallbackScenario[category] }]).map((angle) => ({
      key: `technical-brief:${selected.canonical.canonicalId}:${angle.scenario}`,
      category,
      productUrl: selected.path,
      payload: { selected, ...angle },
    })),
  ));
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
    )
    SELECT $1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8,$9,$10,NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM news_humanizer_audits WHERE article_id = $1
    )`,
    [
      input.articleId,
      input.originalDraftHash,
      input.humanizedDraftHash,
      JSON.stringify(["product", "industry", "scenario", "source title", "source date", "source URL"]),
      JSON.stringify([]),
      JSON.stringify(input.prohibitedPhrases),
      input.similarityBefore,
      input.similarityAfter,
      input.factDeltaDetected,
      input.passed,
    ],
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
  const day = shanghaiDay(now);
  const finish = async (result: NewsPublishResult, article?: ContentArticle) => {
    if (!options.dryRun) {
      const runId = `news-publish:${day}:${result.status}`;
      const runResult = [result.status, ...result.reasons].join(":").slice(0, 480);
      await store.write({
        ...state,
        articles: article
          ? [...state.articles.filter((entry) => entry.id !== article.id && entry.slug !== article.slug), article]
          : state.articles,
        runs: [
          ...state.runs.filter((run) => run.id !== runId),
          { id: runId, startedAt: now.toISOString(), mode: contentAutomationConfig().mode, dryRun: false, result: runResult },
        ],
      });
    }
    console.info(JSON.stringify({ event: "news.publish.result", day, ...result }));
    return result;
  };

  const todaysArticle = state.articles.find((article) => article.publishedAt && shanghaiDay(new Date(article.publishedAt)) === shanghaiDay(now));
  if (todaysArticle) {
    if (!options.dryRun) {
      await writeHumanizerAudit({
        articleId: todaysArticle.id,
        originalDraftHash: String(todaysArticle.body.length),
        humanizedDraftHash: String(todaysArticle.body.length),
        prohibitedPhrases: [],
        similarityBefore: todaysArticle.qualityReport.titleSimilarity,
        similarityAfter: todaysArticle.qualityReport.bodySimilarity,
        factDeltaDetected: false,
        passed: todaysArticle.qualityReport.passed,
      });
    }
    return finish({ dryRun: options.dryRun, status: "nothing-eligible", reasons: ["A News article has already been published for this Shanghai calendar day."] });
  }

  const candidates = (await listFreshNewsCandidates()).filter((candidate) =>
    candidate.sourceQuality !== "secondary"
    && candidate.productCategories.some((category) => relevance(candidate, category)),
  );
  const candidateRejections: string[] = [];

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
    if (recent.filter((article) => article.productFamily === category && article.sources.length > 0).length >= 2) continue;
    if (recent.some((article) => article.sources.some((source) => source.url === candidate.sourceUrl))) continue;

    if (options.dryRun) {
      return { dryRun: true, status: "drafted", reasons: [`Eligible candidate selected: ${candidate.title}`] };
    }

    const articleEvidence = await validateDiscoveredArticle({
      url: candidate.sourceUrl,
      domain: candidate.sourceDomain,
      expectedTitle: candidate.title,
      expectedPublishedAt: candidate.publishedAt,
    });
    if (!articleEvidence.passed) {
      await updateCandidateStatus(candidate.id, "rejected", articleEvidence.reason);
      candidateRejections.push(`${candidate.sourceName}: ${articleEvidence.reason}`);
      continue;
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
        candidateRejections.push(`${candidate.sourceName}: editorial quality gate failed.`);
        continue;
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
      const result: NewsPublishResult = { dryRun: false, status: canPublish ? "published" : "drafted", articleId: article.id, reasons: canPublish ? [] : ["Draft generated successfully; set CONTENT_MODE=publish and AUTO_PUBLISH=true to permit publication."] };
      await finish(result, article);
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
      return result;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "News generation failed.";
      await updateCandidateStatus(candidate.id, "rejected", reason.slice(0, 240));
      candidateRejections.push(`${candidate.sourceName}: ${reason}`);
    }
  }

  // A daily visible News item is required. If every designated external source fails the
  // validation gates, publish an accurately-labelled technical brief instead of inventing news.
  const fallbackRecent = state.articles.filter((article) => age(article.publishedAt ?? article.createdAt, now) <= 90);
  const rankedOptions = rankFallbackPublishingOptions(fallbackPublishingOptions(), state.articles, now);
  const fallbackFailures: string[] = [];
  let fallback: {
    fallbackCategory: string;
    selected: NonNullable<ReturnType<typeof selectVerifiedProduct>>;
    industry: string;
    scenario: string;
    topicKey: string;
    internalLinks: string[];
    draft: ReturnType<typeof createTechnicalBriefDraft>["draft"];
    audit: ReturnType<typeof createTechnicalBriefDraft>["audit"];
    factDeltaDetected: boolean;
    body: string;
    titleSimilarity: number;
    bodySimilarity: number;
    checks: Array<{ name: string; passed: boolean; detail: string }>;
  } | undefined;

  for (const option of rankedOptions) {
    const { selected, industry, scenario } = option.payload;
    const internalLinks = [selected.path, "/solutions/" + (option.category === "magnetic-separators" ? "mineral-processing-recycling" : "construction-sites"), "/request-a-quote"];
    const { draft, audit, factDeltaDetected } = createTechnicalBriefDraft({
      productName: selected.product.name,
      productCategory: option.category,
      productModel: selected.canonical.model ?? undefined,
      productDescription: selected.product.description,
      industry,
      scenario,
      technicalCta: cta(option.category),
    });
    const body = formatTechnicalBriefBody({ body: draft.body, faq: draft.faq, internalLinks, technicalCta: cta(option.category) });
    const titleSimilarity = Math.max(0, ...fallbackRecent.map((article) => tokenSimilarity(draft.title, article.title)));
    const bodySimilarity = Math.max(0, ...fallbackRecent.map((article) => ngramSimilarity(body, article.body)));
    const topicRepeatedWithin180Days = state.articles.some((article) =>
      article.similarityKey === option.key && age(article.publishedAt ?? article.createdAt, now) <= 180,
    );
    const gate = evaluateFallbackPublication({ auditPassed: audit.passed, factDeltaDetected, titleSimilarity, bodySimilarity, topicRepeatedWithin180Days });
    if (!gate.passed) {
      fallbackFailures.push(`${selected.product.name}: ${gate.checks.filter((check) => !check.passed).map((check) => check.name).join(", ")}`);
      continue;
    }
    fallback = {
      fallbackCategory: option.category,
      selected,
      industry,
      scenario,
      topicKey: option.key,
      internalLinks,
      draft,
      audit,
      factDeltaDetected,
      body,
      titleSimilarity,
      bodySimilarity,
      checks: gate.checks,
    };
    break;
  }

  if (!fallback) {
    return finish({
      dryRun: options.dryRun,
      status: "blocked",
      reasons: [
        rankedOptions.length ? "Every verified product and editorial angle failed the technical-brief quality gate." : "No verified product with an authorized local image is available for the daily technical brief.",
        ...candidateRejections.slice(0, 2),
        ...fallbackFailures.slice(0, 2),
      ],
    });
  }

  const { fallbackCategory, selected, industry, scenario, topicKey, internalLinks, draft, audit, factDeltaDetected, body, titleSimilarity, bodySimilarity, checks } = fallback;
  if (options.dryRun) {
    return finish({ dryRun: true, status: "drafted", reasons: [`Audited technical brief selected: ${draft.title}`] });
  }

  const id = randomUUID();
  const canPublish = isAutoPublishEnabled();
  const passed = true;
  const article: ContentArticle = {
    id,
    slug: slugify(draft.title + "-" + shanghaiDay(now)),
    title: draft.title,
    summary: draft.summary,
    body,
    productFamily: fallbackCategory,
    productUrl: selected.path,
    industry,
    scenario,
    similarityKey: topicKey,
    sources: [],
    internalLinks,
    image: { src: selected.product.heroImage ?? "", alt: selected.product.name + " for " + scenario, source: "cowin-machine-authorized", licenseStatus: "authorized" },
    status: canPublish ? "published" : "pending-review",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    publishedAt: canPublish ? now.toISOString() : undefined,
    discoveryStatus: canPublish ? "included-in-sitemap" : "crawl-status-unknown",
    qualityReport: { passed, checks: [{ name: "technical-brief-fallback", passed: true, detail: "Published because no designated-source news passed the daily validation gates." }, ...checks], titleSimilarity, bodySimilarity, internalLinkCount: internalLinks.length },
  };
  const result: NewsPublishResult = {
    dryRun: false,
    status: canPublish ? "published" : "drafted",
    articleId: id,
    reasons: canPublish
      ? ["Published a labelled technical brief because no external News candidate passed validation."]
      : ["Technical brief generated successfully; publication is disabled by configuration."],
  };
  await finish(result, article);
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
  return result;
}
