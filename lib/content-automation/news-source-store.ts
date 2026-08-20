import "server-only";

import { newsSql } from "@/lib/content-automation/database";
import { operationalNewsSources, type OperationalNewsSource } from "@/lib/content-automation/source-catalog";

export type StoredNewsSource = OperationalNewsSource & {
  feedUrl?: string;
};

export type CandidateInsert = {
  sourceId: string;
  url: string;
  title: string;
  publishedAt: string;
  productCategories: string[];
  industries: string[];
  summary: string;
  primaryFacts: string[];
  sourceQuality: "primary" | "authoritative-media" | "secondary";
  imageLicenseStatus: "not-usable" | "unknown" | "licensed";
  originalityRisk: "low" | "medium" | "high";
  status: "discovered" | "rejected" | "queued";
  rejectionReason?: string;
};

const asSource = (row: Record<string, unknown>): StoredNewsSource => ({
  id: String(row.id),
  name: String(row.name),
  domain: String(row.domain),
  homepage: String(row.homepage_url ?? ""),
  sourceGroup: String(row.source_group) as StoredNewsSource["sourceGroup"],
  geography: Array.isArray(row.geography) ? row.geography.map(String) : [],
  languages: Array.isArray(row.languages) ? row.languages.map(String) : ["en"],
  sourceType: String(row.source_type) as StoredNewsSource["sourceType"],
  trustTier: String(row.trust_tier) as StoredNewsSource["trustTier"],
  supportsRss: Boolean(row.supports_rss),
  robotsAllowed: typeof row.robots_allowed === "boolean" ? row.robots_allowed : null,
  requiresLogin: Boolean(row.requires_login),
  paywalled: Boolean(row.paywalled),
  activeStatus: String(row.active_status) as StoredNewsSource["activeStatus"],
  lastCheckedAt: row.last_checked_at ? new Date(String(row.last_checked_at)).toISOString() : null,
  lastUsedAt: row.last_used_at ? new Date(String(row.last_used_at)).toISOString() : null,
  usageCount: Number(row.usage_count ?? 0),
  notes: String(row.notes ?? ""),
  seedReference: String(row.source_seed_ids?.[0] ?? ""),
  sourceSeedIds: Array.isArray(row.source_seed_ids) ? row.source_seed_ids.map(String) : [],
  sourceNames: [],
  sourceGroups: [String(row.source_group) as StoredNewsSource["sourceGroup"]],
  feedUrl: row.feed_url ? String(row.feed_url) : undefined,
});

export async function seedApprovedNewsSources() {
  const sql = newsSql();
  for (const source of operationalNewsSources) {
    await sql.query(
      `INSERT INTO news_sources (
        id, source_seed_ids, name, domain, homepage_url, source_group, geography,
        languages, source_type, trust_tier, supports_rss, robots_allowed,
        requires_login, paywalled, active_status, notes
      ) VALUES (
        $1, $2::text[], $3, $4, $5, $6, $7::text[], $8::text[], $9, $10, $11, $12,
        $13, $14, $15, $16
      )
      ON CONFLICT (domain) DO UPDATE SET
        source_seed_ids = EXCLUDED.source_seed_ids,
        name = EXCLUDED.name,
        homepage_url = EXCLUDED.homepage_url,
        source_group = EXCLUDED.source_group,
        geography = EXCLUDED.geography,
        languages = EXCLUDED.languages,
        source_type = EXCLUDED.source_type,
        trust_tier = EXCLUDED.trust_tier,
        supports_rss = EXCLUDED.supports_rss,
        robots_allowed = EXCLUDED.robots_allowed,
        requires_login = EXCLUDED.requires_login,
        paywalled = EXCLUDED.paywalled,
        notes = EXCLUDED.notes,
        updated_at = NOW()`,
      [
        source.id, source.sourceSeedIds, source.name, source.domain, source.homepage,
        source.sourceGroup, source.geography, source.languages, source.sourceType,
        source.trustTier, source.supportsRss, source.robotsAllowed, source.requiresLogin,
        source.paywalled, source.activeStatus, source.notes,
      ],
    );
  }
  return { rawCatalogCount: operationalNewsSources.reduce((total, source) => total + source.sourceSeedIds.length, 0), operationalSourceCount: operationalNewsSources.length };
}

export async function listStoredNewsSources() {
  const sql = newsSql();
  const rows = await sql.query("SELECT * FROM news_sources ORDER BY usage_count ASC, last_used_at NULLS FIRST, name ASC");
  return rows.map((row) => asSource(row as Record<string, unknown>));
}

export async function updateSourceHealth(input: {
  id: string;
  activeStatus: "active" | "inactive" | "blocked";
  robotsAllowed: boolean;
  feedUrl?: string;
  supportsRss: boolean;
  notes?: string;
}) {
  const sql = newsSql();
  await sql.query(
    `UPDATE news_sources
      SET active_status=$2, robots_allowed=$3, feed_url=$4, supports_rss=$5,
          notes=COALESCE($6, notes), last_checked_at=NOW(), updated_at=NOW()
      WHERE id=$1`,
    [input.id, input.activeStatus, input.robotsAllowed, input.feedUrl ?? null, input.supportsRss, input.notes ?? null],
  );
}

export async function saveNewsCandidate(candidate: CandidateInsert) {
  const sql = newsSql();
  await sql.query(
    `INSERT INTO news_candidates (
      source_id, source_url, title, published_at, product_categories, industries, summary,
      primary_facts, source_quality, image_license_status, originality_risk, status, rejection_reason
    ) VALUES ($1,$2,$3,$4,$5::text[],$6::text[],$7,$8::jsonb,$9,$10,$11,$12,$13)
    ON CONFLICT (source_url) DO UPDATE SET
      title=EXCLUDED.title, published_at=EXCLUDED.published_at,
      product_categories=EXCLUDED.product_categories, industries=EXCLUDED.industries,
      summary=EXCLUDED.summary, primary_facts=EXCLUDED.primary_facts,
      source_quality=EXCLUDED.source_quality, image_license_status=EXCLUDED.image_license_status,
      originality_risk=EXCLUDED.originality_risk, status=EXCLUDED.status,
      rejection_reason=EXCLUDED.rejection_reason`,
    [
      candidate.sourceId, candidate.url, candidate.title, candidate.publishedAt,
      candidate.productCategories, candidate.industries, candidate.summary,
      JSON.stringify(candidate.primaryFacts), candidate.sourceQuality,
      candidate.imageLicenseStatus, candidate.originalityRisk, candidate.status,
      candidate.rejectionReason ?? null,
    ],
  );
}

export async function markSourceUsed(sourceId: string) {
  const sql = newsSql();
  await sql.query(
    "UPDATE news_sources SET usage_count=usage_count+1, last_used_at=NOW(), updated_at=NOW() WHERE id=$1",
    [sourceId],
  );
}
