import "server-only";

import { legacyThirdPartyBlogFamilies } from "@/lib/content-automation/channel";
import { isNewsDatabaseConfigured, newsSql } from "@/lib/content-automation/database";
import { siteConfig } from "@/lib/site";

export type BlogReconciliationResult = {
  eligible: number;
  migrated: number;
  migratedSlugs: string[];
};

export async function reconcileLegacyThirdPartyBlogArticles(): Promise<BlogReconciliationResult> {
  if (!isNewsDatabaseConfigured()) {
    throw new Error("Content database is not configured.");
  }

  const sql = newsSql();
  const existing = await sql.query(
    `SELECT slug
       FROM news_articles
      WHERE product_category = ANY($1::text[])
      ORDER BY COALESCE(published_at, created_at) DESC`,
    [[...legacyThirdPartyBlogFamilies]],
  );
  const needsMigration = await sql.query(
    `UPDATE news_articles
        SET product_category = 'external-blog',
            canonical_url = $1 || '/blog/' || slug,
            updated_at = NOW()
      WHERE product_category = ANY($2::text[])
        AND product_category <> 'external-blog'
      RETURNING slug`,
    [siteConfig.siteUrl, [...legacyThirdPartyBlogFamilies]],
  );

  return {
    eligible: existing.length,
    migrated: needsMigration.length,
    migratedSlugs: needsMigration.map((row) => String(row.slug)),
  };
}
