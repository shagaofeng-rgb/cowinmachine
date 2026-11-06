import "server-only";

import { adminSql } from "@/lib/admin-operations/database";
import type { AdminDateRange } from "@/types/admin-operations";

const bounds = ({ start, end }: AdminDateRange) => [start, end];
const eventsInRange = "occurred_at >= $1 AND occurred_at < $2";

export async function getEquipmentInsights(range: AdminDateRange) {
  const [totals, equipment, families] = await adminSql().transaction((tx) => [
    tx.query(`SELECT COUNT(*)::int AS views, COUNT(DISTINCT product_slug)::int AS models,
      (SELECT COUNT(*)::int FROM b2b_leads WHERE created_at >= $1 AND created_at < $2 AND product_model IS NOT NULL) AS inquiries
      FROM analytics_events WHERE ${eventsInRange} AND event_name = 'product_view'`, bounds(range)),
    tx.query(`SELECT product_category, product_slug, COUNT(*)::int AS views FROM analytics_events
      WHERE ${eventsInRange} AND event_name = 'product_view' AND product_slug IS NOT NULL
      GROUP BY product_category, product_slug ORDER BY views DESC, product_slug LIMIT 10`, bounds(range)),
    tx.query(`SELECT product_category, COUNT(*)::int AS views FROM analytics_events
      WHERE ${eventsInRange} AND event_name = 'product_view' AND product_category IS NOT NULL
      GROUP BY product_category ORDER BY views DESC, product_category LIMIT 10`, bounds(range)),
  ], { readOnly: true });
  return {
    views: Number(totals[0]?.views ?? 0), models: Number(totals[0]?.models ?? 0), inquiries: Number(totals[0]?.inquiries ?? 0),
    equipment: equipment.map((row) => ({ category: String(row.product_category), slug: String(row.product_slug), value: Number(row.views) })),
    families: families.map((row) => ({ name: String(row.product_category), value: Number(row.views) })),
  };
}

export async function getEditorialTraffic(range: AdminDateRange) {
  const [row] = await adminSql().query(
    `SELECT
      COUNT(*) FILTER (WHERE event_name='page_view' AND (page_path='/news' OR page_path LIKE '/news/%'))::int AS news,
      COUNT(*) FILTER (WHERE event_name='page_view' AND (page_path='/blog' OR page_path LIKE '/blog/%'))::int AS blog,
      COUNT(*) FILTER (WHERE event_name='quote_click' AND (page_path LIKE '/news/%' OR page_path LIKE '/blog/%'))::int AS quote_clicks
     FROM analytics_events WHERE ${eventsInRange}`, bounds(range),
  );
  return { news: Number(row?.news ?? 0), blog: Number(row?.blog ?? 0), quoteClicks: Number(row?.quote_clicks ?? 0) };
}

export async function getMarketInsights(range: AdminDateRange) {
  const active = `FROM analytics_visitors v WHERE EXISTS (
    SELECT 1 FROM analytics_events e WHERE e.visitor_id=v.visitor_id AND e.event_name='page_view' AND ${eventsInRange}
  )`;
  const reports = [
    ["国家 / 地区", "NULLIF(concat_ws(' / ', v.country_code, v.region_code), '')"],
    ["浏览器语言", "v.preferred_language"],
    ["设备类型", "v.device_type"],
    ["首次访问渠道", "v.first_channel"],
  ] as const;
  const results = await adminSql().transaction((tx) => reports.map(([, expression]) => tx.query(
    `SELECT COALESCE(${expression}, 'Unknown') AS name, COUNT(*)::int AS total ${active}
      GROUP BY 1 ORDER BY total DESC, name ASC LIMIT 10`, bounds(range),
  )), { readOnly: true });
  return results.map((rows, index) => ({
    title: reports[index][0],
    rows: rows.map((row) => ({ name: String(row.name), value: Number(row.total) })),
  }));
}

export async function getOperationsHealth() {
  const [row] = await adminSql().query(
    `SELECT
      (SELECT max(occurred_at) FROM analytics_events) AS last_event,
      (SELECT max(created_at) FROM b2b_leads) AS last_inquiry,
      (SELECT COUNT(*)::int FROM b2b_leads WHERE customer_id IS NULL) AS unlinked,
      (SELECT COUNT(*)::int FROM b2b_leads l WHERE NOT EXISTS (
        SELECT 1 FROM b2b_lead_activities a WHERE a.lead_id=l.id AND a.activity_type='created'
      )) AS missing_activity`,
  );
  return {
    lastEvent: row?.last_event ? new Date(String(row.last_event)) : null,
    lastInquiry: row?.last_inquiry ? new Date(String(row.last_inquiry)) : null,
    unlinked: Number(row?.unlinked ?? 0),
    missingActivity: Number(row?.missing_activity ?? 0),
  };
}
