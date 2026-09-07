import "server-only";

import { randomUUID } from "node:crypto";
import { isNewsDatabaseConfigured, newsSql } from "@/lib/content-automation/database";

export type SearchDiscoveryRecord = {
  status:
    | "search-console-not-configured"
    | "sitemap-submitted"
    | "sitemap-submission-failed";
  property?: string;
  sitemapUrl: string;
  submitHttpStatus?: number;
  readbackHttpStatus?: number;
  lastSubmitted?: string;
  lastDownloaded?: string;
  pending?: boolean;
  warnings?: number;
  errors?: number;
  detail?: string;
  recordedAt: string;
};

export async function recordSearchDiscovery(result: Omit<SearchDiscoveryRecord, "recordedAt">) {
  if (!isNewsDatabaseConfigured()) return false;

  const recordedAt = new Date().toISOString();
  await newsSql().query(
    `INSERT INTO seo_search_snapshots (id, observed_at, source, payload)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [
      `gsc-sitemap-${randomUUID()}`,
      recordedAt,
      "google-search-console-sitemap",
      JSON.stringify({ ...result, recordedAt }),
    ],
  );
  return true;
}

export async function getLatestSearchDiscovery(): Promise<SearchDiscoveryRecord | null> {
  if (!isNewsDatabaseConfigured()) return null;

  const rows = await newsSql().query(
    `SELECT payload
     FROM seo_search_snapshots
     WHERE source = $1
     ORDER BY observed_at DESC
     LIMIT 1`,
    ["google-search-console-sitemap"],
  );
  if (!rows.length || !rows[0].payload || typeof rows[0].payload !== "object") return null;
  return rows[0].payload as SearchDiscoveryRecord;
}
