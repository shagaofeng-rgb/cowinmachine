import "server-only";

import { inspectNewsSource, type DiscoveredCandidate } from "@/lib/content-automation/source-validator";
import { selectRotatingSources } from "@/lib/content-automation/source-rotation";
import { seedApprovedNewsSources, saveNewsCandidate, updateSourceHealth } from "@/lib/content-automation/news-source-store";
import { contentStore } from "@/lib/content-automation/storage";
import type { ContentArticle } from "@/types/content-automation";

const DAY = 86_400_000;
const categories = [
  "compressed-air-equipment",
  "generator-systems",
  "drilling-equipment",
  "drilling-consumables",
  "mobile-lighting-systems",
  "magnetic-separators",
] as const;

const categoryTerms: Record<(typeof categories)[number], string[]> = {
  "compressed-air-equipment": ["compressor", "compressed air", "pneumatic", "air supply"],
  "generator-systems": ["generator", "power", "diesel", "temporary power"],
  "drilling-equipment": ["drilling", "drill rig", "borehole", "water well", "dth"],
  "drilling-consumables": ["drilling", "dth", "hammer", "drill bit", "rock drill"],
  "mobile-lighting-systems": ["light tower", "lighting", "mobile light", "solar", "hybrid"],
  "magnetic-separators": ["magnetic", "magnet", "separation", "sorting", "recycling", "mineral processing", "iron removal"],
};

const industries: Record<(typeof categories)[number], string[]> = {
  "compressed-air-equipment": ["mining", "quarrying", "construction", "water well drilling"],
  "generator-systems": ["remote construction", "temporary site power", "mining", "industrial facilities"],
  "drilling-equipment": ["water wells", "agricultural irrigation", "mining", "geotechnical works"],
  "drilling-consumables": ["hard-rock drilling", "quarrying", "mining maintenance", "water-well drilling"],
  "mobile-lighting-systems": ["construction sites", "roadworks", "mining sites", "remote camps"],
  "magnetic-separators": ["mineral processing", "recycling", "aggregates", "bulk material handling"],
};

const daysOld = (value: string, now: Date) => (now.valueOf() - new Date(value).valueOf()) / DAY;
const quality = (tier: "A" | "B" | "C") => tier === "A" ? "primary" as const : tier === "B" ? "authoritative-media" as const : "secondary" as const;

function categoryForToday(history: ContentArticle[], now: Date) {
  const recent = history
    .filter((article) => daysOld(article.publishedAt ?? article.createdAt, now) <= 30)
    .map((article) => article.productFamily);
  const ordered = [...categories].sort((a, b) => recent.filter((entry) => entry === a).length - recent.filter((entry) => entry === b).length);
  return ordered[0];
}

function matchesCategory(candidate: DiscoveredCandidate, category: (typeof categories)[number]) {
  const value = `${candidate.title} ${candidate.summary}`.toLowerCase();
  return categoryTerms[category].some((term) => value.includes(term));
}

async function inBatches<T, R>(items: T[], size: number, task: (item: T) => Promise<R>) {
  const output: PromiseSettledResult<R>[] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(...await Promise.allSettled(items.slice(index, index + size).map(task)));
  }
  return output;
}

export type NewsDiscoveryResult = {
  dryRun: boolean;
  category: string;
  operationalSources: number;
  sourcesChecked: number;
  activeSources: number;
  candidatesDiscovered: number;
  candidatesQueued: number;
  rejected: number;
  reasons: string[];
};

export async function discoverApprovedNews(options: { dryRun: boolean }) : Promise<NewsDiscoveryResult> {
  const now = new Date();
  const state = await contentStore().read();
  const category = categoryForToday(state.articles, now);
  const sources = selectRotatingSources(category, state.articles, 12, now);
  const inspections = await inBatches(sources, 4, (source) => inspectNewsSource(source));

  let activeSources = 0;
  let candidatesDiscovered = 0;
  let candidatesQueued = 0;
  let rejected = 0;
  const reasons: string[] = [];

  if (!options.dryRun) await seedApprovedNewsSources();

  for (let index = 0; index < inspections.length; index += 1) {
    const source = sources[index];
    const inspection = inspections[index];
    if (inspection.status === "rejected") {
      rejected += 1;
      reasons.push(`${source.name}: source validation failed.`);
      continue;
    }
    const { health, candidates } = inspection.value;
    if (health.activeStatus === "active") activeSources += 1;
    if (!options.dryRun) {
      await updateSourceHealth({
        id: health.sourceId,
        activeStatus: health.activeStatus,
        robotsAllowed: health.robotsAllowed,
        feedUrl: health.feedUrl,
        supportsRss: Boolean(health.feedUrl),
        notes: health.error,
      });
    }

    for (const candidate of candidates) {
      if (daysOld(candidate.publishedAt, now) > 90 || !matchesCategory(candidate, category)) {
        rejected += 1;
        continue;
      }
      candidatesDiscovered += 1;
      if (!options.dryRun) {
        await saveNewsCandidate({
          sourceId: candidate.sourceId,
          url: candidate.url,
          title: candidate.title,
          publishedAt: candidate.publishedAt,
          productCategories: [category],
          industries: industries[category],
          summary: candidate.summary,
          primaryFacts: [candidate.summary || "Article title and date require full-page verification before publication."],
          sourceQuality: quality(source.trustTier === "discovery-only" ? "C" : source.trustTier),
          imageLicenseStatus: "unknown",
          originalityRisk: "medium",
          status: "discovered",
        });
      }
      candidatesQueued += 1;
    }
  }

  if (candidatesQueued === 0) {
    reasons.push("No dated, category-relevant RSS candidate passed the initial source gate. The daily publishing step must remain blocked until a candidate is verified.");
  }

  return {
    dryRun: options.dryRun,
    category,
    operationalSources: sources.length,
    sourcesChecked: sources.length,
    activeSources,
    candidatesDiscovered,
    candidatesQueued,
    rejected,
    reasons,
  };
}
