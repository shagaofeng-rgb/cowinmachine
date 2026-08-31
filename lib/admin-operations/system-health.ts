import "server-only";

import { randomUUID } from "node:crypto";
import { createLead, ensureInquiryRateLimitTable } from "@/lib/admin-operations/analytics";
import { adminSql } from "@/lib/admin-operations/database";

export async function runDatabaseWriteHealthCheck() {
  const marker = `CODEX-AUDIT-${randomUUID()}`;
  const email = `${marker.toLowerCase()}@example.invalid`;
  let leadId: string | null = null;
  const sql = adminSql();

  await ensureInquiryRateLimitTable();

  try {
    leadId = await createLead({
      name: marker,
      company: marker,
      country: "System health check",
      email,
      category: "system-health-check",
      message: "Marked transactional health-check record. This record is deleted before the check completes.",
      website: "",
      sourceChannel: "system-health-check",
      landingPath: "/api/cron/system-health",
    });

    const rows = await sql.query(
      `SELECT COUNT(*)::int AS activity_count
       FROM b2b_lead_activities
       WHERE lead_id = $1 AND activity_type = 'created'`,
      [leadId],
    );
    if (Number(rows[0]?.activity_count ?? 0) !== 1) {
      throw new Error("The inquiry activity record was not persisted.");
    }
  } finally {
    if (leadId) await sql.query(`DELETE FROM b2b_leads WHERE id = $1`, [leadId]);
    await sql.query(`DELETE FROM b2b_leads WHERE email = $1 OR name = $2`, [email, marker]);
  }

  const remaining = await sql.query(
    `SELECT COUNT(*)::int AS remaining FROM b2b_leads WHERE email = $1 OR name = $2`,
    [email, marker],
  );
  if (Number(remaining[0]?.remaining ?? 0) !== 0) {
    throw new Error("The marked health-check record was not cleaned up.");
  }
  if (leadId) {
    const remainingActivities = await sql.query(
      `SELECT COUNT(*)::int AS remaining FROM b2b_lead_activities WHERE lead_id = $1`,
      [leadId],
    );
    if (Number(remainingActivities[0]?.remaining ?? 0) !== 0) {
      throw new Error("The marked inquiry activity was not cleaned up.");
    }
  }

  return { databaseWrite: "passed", inquiryActivity: "passed", cleanup: "passed", rateLimitSchema: "ready" } as const;
}
