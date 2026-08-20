import "server-only";

import catalog from "@/data/news/source-catalog.json";

export type NewsSourceGroup =
  | "magnetics"
  | "mining"
  | "mineral-processing"
  | "recycling"
  | "bulk-materials"
  | "cement-aggregates"
  | "coal"
  | "food-grain"
  | "chemicals-plastics"
  | "industrial-engineering"
  | "trade-show-association"
  | "forum-community";

export type NewsSource = {
  id: string;
  name: string;
  domain: string;
  homepage: string;
  sourceGroup: NewsSourceGroup;
  geography: string[];
  languages: string[];
  sourceType: "official-organization" | "industry-publication" | "manufacturer-newsroom" | "research-publication" | "trade-show" | "forum-community" | "unknown";
  trustTier: "A" | "B" | "C" | "discovery-only";
  supportsRss: boolean;
  robotsAllowed: boolean | null;
  requiresLogin: boolean;
  paywalled: boolean;
  activeStatus: "unknown" | "active" | "inactive" | "blocked";
  lastCheckedAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  notes: string;
  seedReference: string;
};

type SourceCatalogFile = { generatedAt: string; sourceOfTruth: string; records: NewsSource[] };

const sourceCatalog = catalog as SourceCatalogFile;

export const newsSources = sourceCatalog.records;
export const newsSourceById = new Map(newsSources.map((source) => [source.id, source]));

export function isFormalNewsSource(source: NewsSource) {
  return source.trustTier !== "discovery-only" && source.sourceGroup !== "forum-community";
}

export function sourceForCategory(category: string) {
  const groups: Partial<Record<string, NewsSourceGroup[]>> = {
    "compressed-air-equipment": ["mining", "industrial-engineering", "trade-show-association"],
    "generator-systems": ["industrial-engineering", "mining", "trade-show-association"],
    "drilling-equipment": ["mining", "industrial-engineering", "trade-show-association"],
    "drilling-consumables": ["mining", "industrial-engineering"],
    "mobile-lighting-systems": ["industrial-engineering", "mining", "trade-show-association"],
    "magnetic-separators": ["magnetics", "mining", "recycling", "bulk-materials", "cement-aggregates", "food-grain", "chemicals-plastics"],
  };
  const preferred = groups[category] ?? [];
  return newsSources.filter((source) => isFormalNewsSource(source) && preferred.includes(source.sourceGroup));
}
