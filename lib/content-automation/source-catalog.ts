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

export type OperationalNewsSource = NewsSource & {
  sourceSeedIds: string[];
  sourceNames: string[];
  sourceGroups: NewsSourceGroup[];
};

type SourceCatalogFile = { generatedAt: string; sourceOfTruth: string; records: NewsSource[] };

const sourceCatalog = catalog as SourceCatalogFile;

export const newsSources = sourceCatalog.records;
export const newsSourceById = new Map(newsSources.map((source) => [source.id, source]));

function mostRestrictiveTier(sources: NewsSource[]): NewsSource["trustTier"] {
  if (sources.some((source) => source.trustTier === "discovery-only")) return "discovery-only";
  if (sources.some((source) => source.trustTier === "C")) return "C";
  if (sources.some((source) => source.trustTier === "B")) return "B";
  return "A";
}

function operationalizeSources() {
  const grouped = new Map<string, NewsSource[]>();
  for (const source of newsSources) {
    const entries = grouped.get(source.domain) ?? [];
    entries.push(source);
    grouped.set(source.domain, entries);
  }

  return [...grouped.values()].map((entries) => {
    const primary = entries[0];
    return {
      ...primary,
      trustTier: mostRestrictiveTier(entries),
      sourceSeedIds: entries.map((entry) => entry.id),
      sourceNames: entries.map((entry) => entry.name),
      sourceGroups: [...new Set(entries.map((entry) => entry.sourceGroup))],
      notes: [primary.notes, entries.length > 1 ? `Merged ${entries.length} approved catalog entries for this domain.` : ""].filter(Boolean).join(" "),
    } satisfies OperationalNewsSource;
  });
}

/**
 * The user-provided file remains preserved in newsSources (all 500 entries).
 * Operational sources are domain-deduplicated only because source rotation,
 * health checks, and the database are intentionally domain-based.
 */
export const operationalNewsSources = operationalizeSources();
export const operationalNewsSourceById = new Map(operationalNewsSources.map((source) => [source.id, source]));

export function isFormalNewsSource(source: Pick<NewsSource, "trustTier" | "sourceGroup">) {
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
  return operationalNewsSources.filter((source) =>
    source.trustTier !== "discovery-only"
    && source.sourceGroups.some((group) => preferred.includes(group)),
  );
}
