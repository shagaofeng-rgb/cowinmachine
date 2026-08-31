import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { adminSql } from "@/lib/admin-operations/database";
import type { AdminDateRange, AdminLead, AnalyticsEventPayload, DeviceType, LeadStatus, PaginatedResult } from "@/types/admin-operations";

const allowedEvents = new Set(["page_view", "product_view", "category_view", "news_view", "quote_click", "whatsapp_click", "email_click", "inquiry_started", "inquiry_submitted", "filter_used"]);
const safeIdentifier = /^[A-Za-z0-9-]{12,100}$/;
let inquiryRateLimitTable: Promise<unknown> | null = null;

function text(value: unknown, maximum = 180) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function safePath(value: string) {
  try {
    const url = new URL(value, "https://cowinmachine.com");
    return url.pathname.slice(0, 500);
  } catch {
    return "/";
  }
}

function host(value: string | undefined) {
  if (!value) return null;
  try { return new URL(value).hostname.toLowerCase().slice(0, 180); } catch { return null; }
}

function detectDevice(userAgent: string): DeviceType {
  if (/bot|crawler|spider|slurp/i.test(userAgent)) return "bot";
  if (/ipad|tablet|kindle|silk/i.test(userAgent)) return "tablet";
  if (/mobi|android|iphone|ipod/i.test(userAgent)) return "mobile";
  return userAgent ? "desktop" : "unknown";
}

function browserName(userAgent: string) {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/chrome\//i.test(userAgent)) return "Chrome";
  if (/safari\//i.test(userAgent) && !/chrome/i.test(userAgent)) return "Safari";
  if (/firefox\//i.test(userAgent)) return "Firefox";
  return "Other";
}

function operatingSystem(userAgent: string) {
  if (/windows/i.test(userAgent)) return "Windows";
  if (/mac os|macintosh/i.test(userAgent)) return "macOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Other";
}

function sourceChannel(referrer: string | undefined, utm?: Record<string, string>) {
  const medium = text(utm?.utm_medium, 80).toLowerCase();
  if (medium) return medium.includes("email") ? "email" : medium.includes("paid") || medium.includes("cpc") ? "paid" : medium;
  const referrerHost = host(referrer);
  if (!referrerHost) return "direct";
  if (/google|bing|yahoo|duckduckgo|baidu|yandex/.test(referrerHost)) return "organic-search";
  if (/linkedin|facebook|instagram|youtube|x\.com|twitter/.test(referrerHost)) return "social";
  if (/chatgpt|perplexity|gemini|copilot/.test(referrerHost)) return "ai-referral";
  return "referral";
}

function ipHash(request: Request) {
  const secret = process.env.ANALYTICS_IP_HASH_SECRET;
  if (!secret) return null;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip");
  return ip ? createHash("sha256").update(secret).update(":").update(ip).digest("hex") : null;
}

export async function ensureInquiryRateLimitTable() {
  const sql = adminSql();
  inquiryRateLimitTable ??= sql.query(
    `CREATE TABLE IF NOT EXISTS inquiry_rate_limits (
      fingerprint text NOT NULL,
      bucket_start timestamptz NOT NULL,
      attempts integer NOT NULL DEFAULT 1,
      PRIMARY KEY (fingerprint, bucket_start)
    )`,
  );
  await inquiryRateLimitTable;
}

export async function checkInquiryRateLimit(request: Request) {
  const key = ipHash(request);
  if (!key) return true;

  await ensureInquiryRateLimitTable();
  const sql = adminSql();

  const rows = await sql.query(
    `WITH cleanup AS (
       DELETE FROM inquiry_rate_limits WHERE bucket_start < now() - interval '2 days'
     ), updated AS (
       INSERT INTO inquiry_rate_limits (fingerprint, bucket_start, attempts)
       VALUES ($1, date_trunc('hour', now()) + floor(date_part('minute', now()) / 15) * interval '15 minutes', 1)
       ON CONFLICT (fingerprint, bucket_start) DO UPDATE SET attempts = inquiry_rate_limits.attempts + 1
       RETURNING attempts
     )
     SELECT attempts FROM updated`,
    [key],
  );
  return Number(rows[0]?.attempts ?? 1) <= 5;
}

function asIso(value: unknown) {
  return value ? new Date(String(value)).toISOString() : new Date().toISOString();
}

export async function recordAnalyticsEvent(payload: AnalyticsEventPayload, request: Request) {
  if (!safeIdentifier.test(payload.eventId) || !safeIdentifier.test(payload.visitorId) || !safeIdentifier.test(payload.sessionId)) throw new Error("Invalid analytics identifier.");
  if (!allowedEvents.has(payload.eventName)) throw new Error("Unsupported analytics event.");

  const sql = adminSql();
  const userAgent = request.headers.get("user-agent") ?? "";
  const device = detectDevice(userAgent);
  const language = text(payload.language || request.headers.get("accept-language")?.split(",")[0], 24);
  const country = text(request.headers.get("x-vercel-ip-country"), 8).toUpperCase() || null;
  const region = text(request.headers.get("x-vercel-ip-country-region"), 12).toUpperCase() || null;
  const referrer = host(payload.referrer);
  const channel = sourceChannel(payload.referrer, payload.utm);
  const path = safePath(payload.pagePath);
  const metadata = Object.fromEntries(Object.entries(payload.metadata ?? {}).filter(([key, value]) => /^[a-zA-Z0-9_-]{1,50}$/.test(key) && ["string", "number", "boolean"].includes(typeof value)).slice(0, 20));

  await sql.query(
    `INSERT INTO analytics_visitors (visitor_id, first_seen_at, last_seen_at, country_code, region_code, preferred_language, first_channel, device_type, ip_hash)
     VALUES ($1, now(), now(), $2, $3, $4, $5, $6, $7)
     ON CONFLICT (visitor_id) DO UPDATE SET last_seen_at = now(), country_code = COALESCE(EXCLUDED.country_code, analytics_visitors.country_code), region_code = COALESCE(EXCLUDED.region_code, analytics_visitors.region_code), preferred_language = COALESCE(NULLIF(EXCLUDED.preferred_language, ''), analytics_visitors.preferred_language), device_type = EXCLUDED.device_type, ip_hash = COALESCE(EXCLUDED.ip_hash, analytics_visitors.ip_hash)`,
    [payload.visitorId, country, region, language || null, channel, device, ipHash(request)],
  );
  await sql.query(
    `INSERT INTO analytics_sessions (session_id, visitor_id, started_at, last_seen_at, channel, referrer_host, landing_path, utm, device_type, browser_name, os_name)
     VALUES ($1, $2, now(), now(), $3, $4, $5, $6::jsonb, $7, $8, $9)
     ON CONFLICT (session_id) DO UPDATE SET last_seen_at = now()`,
    [payload.sessionId, payload.visitorId, channel, referrer, path, JSON.stringify(payload.utm ?? {}), device, browserName(userAgent), operatingSystem(userAgent)],
  );
  await sql.query(
    `INSERT INTO analytics_events (event_id, visitor_id, session_id, event_name, page_path, page_title, product_category, product_slug, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
     ON CONFLICT (event_id) DO NOTHING`,
    [payload.eventId, payload.visitorId, payload.sessionId, payload.eventName, path, text(payload.pageTitle, 180) || null, text(payload.productCategory, 100) || null, text(payload.productSlug, 180) || null, JSON.stringify(metadata)],
  );
}

export type DashboardData = {
  visits: number;
  visitors: number;
  pageViews: number;
  inquiries: number;
  quoteClicks: number;
  whatsappClicks: number;
  topPages: Array<{ pagePath: string; views: number }>;
  sources: Array<{ channel: string; sessions: number }>;
  countries: Array<{ country: string; visitors: number }>;
  products: Array<{ category: string; slug: string; views: number }>;
};

const rangeParams = (range: AdminDateRange) => [range.start, range.end];

export async function getDashboardData(range: AdminDateRange): Promise<DashboardData> {
  const sql = adminSql();
  const [overview, topPages, sources, countries, products] = await Promise.all([
    sql.query(
      `SELECT
        COUNT(DISTINCT session_id) FILTER (WHERE event_name = 'page_view')::int AS visits,
        COUNT(DISTINCT visitor_id)::int AS visitors,
        COUNT(*) FILTER (WHERE event_name = 'page_view')::int AS page_views,
        COUNT(*) FILTER (WHERE event_name = 'inquiry_submitted')::int AS inquiries,
        COUNT(*) FILTER (WHERE event_name = 'quote_click')::int AS quote_clicks,
        COUNT(*) FILTER (WHERE event_name = 'whatsapp_click')::int AS whatsapp_clicks
       FROM analytics_events WHERE occurred_at >= $1 AND occurred_at < $2`,
      rangeParams(range),
    ),
    sql.query(`SELECT page_path, COUNT(*)::int AS views FROM analytics_events WHERE event_name IN ('page_view','product_view','news_view') AND occurred_at >= $1 AND occurred_at < $2 GROUP BY page_path ORDER BY views DESC, page_path ASC LIMIT 8`, rangeParams(range)),
    sql.query(`SELECT channel, COUNT(*)::int AS sessions FROM analytics_sessions WHERE started_at >= $1 AND started_at < $2 GROUP BY channel ORDER BY sessions DESC, channel ASC LIMIT 8`, rangeParams(range)),
    sql.query(`SELECT COALESCE(country_code, 'Unknown') AS country, COUNT(*)::int AS visitors FROM analytics_visitors WHERE last_seen_at >= $1 AND last_seen_at < $2 GROUP BY country ORDER BY visitors DESC, country ASC LIMIT 8`, rangeParams(range)),
    sql.query(`SELECT COALESCE(product_category, 'Unassigned') AS category, COALESCE(product_slug, '') AS slug, COUNT(*)::int AS views FROM analytics_events WHERE event_name = 'product_view' AND occurred_at >= $1 AND occurred_at < $2 GROUP BY category, slug ORDER BY views DESC, category ASC LIMIT 8`, rangeParams(range)),
  ]);
  const row = overview[0] as Record<string, unknown> | undefined;
  return {
    visits: Number(row?.visits ?? 0), visitors: Number(row?.visitors ?? 0), pageViews: Number(row?.page_views ?? 0), inquiries: Number(row?.inquiries ?? 0), quoteClicks: Number(row?.quote_clicks ?? 0), whatsappClicks: Number(row?.whatsapp_clicks ?? 0),
    topPages: topPages.map((item) => ({ pagePath: String(item.page_path), views: Number(item.views) })),
    sources: sources.map((item) => ({ channel: String(item.channel), sessions: Number(item.sessions) })),
    countries: countries.map((item) => ({ country: String(item.country), visitors: Number(item.visitors) })),
    products: products.map((item) => ({ category: String(item.category), slug: String(item.slug), views: Number(item.views) })),
  };
}

export async function createLead(input: {
  name: string; company: string; country: string; email: string; category: string; message: string; website: string;
  productModel?: string; productUrl?: string; application?: string; material?: string; quantity?: string; whatsapp?: string; projectRequirements?: string;
  visitorId?: string; sessionId?: string; landingPath?: string; sourceChannel?: string;
}) {
  const id = randomUUID();
  const sql = adminSql();
  await sql.query(
    `WITH inserted_lead AS (
      INSERT INTO b2b_leads (id,name,company,country,email,whatsapp,category,product_model,product_url,application,material,quantity,message,project_requirements,visitor_id,session_id,source_channel,landing_path)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING id
    )
    INSERT INTO b2b_lead_activities (id,lead_id,activity_type,note)
    SELECT $19,id,'created','Created from website inquiry form' FROM inserted_lead`,
    [id,input.name,input.company,input.country,input.email,input.whatsapp || null,input.category,input.productModel || null,input.productUrl || null,input.application || null,input.material || null,input.quantity || null,input.message,input.projectRequirements || null,safeIdentifier.test(input.visitorId ?? "") ? input.visitorId : null,safeIdentifier.test(input.sessionId ?? "") ? input.sessionId : null,input.sourceChannel || null,input.landingPath ? safePath(input.landingPath) : null,randomUUID()],
  );
  return id;
}

export async function listLeads(range: AdminDateRange, page = 1, pageSize = 25, status?: string): Promise<PaginatedResult<AdminLead>> {
  const sql = adminSql();
  const safePage = Math.max(1, Math.floor(page));
  const safeSize = [25, 50, 100].includes(pageSize) ? pageSize : 25;
  const filters = status && ["new","qualified","technical-review","quotation-sent","negotiation","won","lost","nurture"].includes(status) ? [range.start, range.end, status] : [range.start, range.end];
  const predicate = status && filters.length === 3 ? " AND status = $3" : "";
  const [countRows, rows] = await Promise.all([
    sql.query(`SELECT COUNT(*)::int AS total FROM b2b_leads WHERE created_at >= $1 AND created_at < $2${predicate}`, filters),
    sql.query(`SELECT id,created_at,status,name,company,country,email,whatsapp,category,product_model,application,quantity,source_channel,landing_path FROM b2b_leads WHERE created_at >= $1 AND created_at < $2${predicate} ORDER BY created_at DESC LIMIT $${filters.length + 1} OFFSET $${filters.length + 2}`, [...filters, safeSize, (safePage - 1) * safeSize]),
  ]);
  const total = Number((countRows[0] as Record<string, unknown> | undefined)?.total ?? 0);
  return {
    rows: rows.map((row) => ({ id: String(row.id), createdAt: asIso(row.created_at), status: String(row.status) as LeadStatus, name: String(row.name), company: String(row.company), country: String(row.country), email: String(row.email), whatsapp: row.whatsapp ? String(row.whatsapp) : null, category: String(row.category), productModel: row.product_model ? String(row.product_model) : null, application: row.application ? String(row.application) : null, quantity: row.quantity ? String(row.quantity) : null, sourceChannel: row.source_channel ? String(row.source_channel) : null, landingPath: row.landing_path ? String(row.landing_path) : null })),
    total, page: safePage, pageSize: safeSize, pageCount: Math.max(1, Math.ceil(total / safeSize)),
  };
}
