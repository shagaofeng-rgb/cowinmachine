import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { adminSql } from "@/lib/admin-operations/database";
import type { AdminDateRange, AdminLead, AnalyticsEventPayload, CustomerRecord, DeviceType, JourneyEvent, LeadStatus, PaginatedResult, VisitorRecord } from "@/types/admin-operations";

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

function safePageSize(value: number) {
  return [10, 25, 50, 100].includes(value) ? value : 25;
}

function normalEmail(value: string) { return value.trim().toLowerCase(); }
function normalPhone(value: string | undefined) {
  const result = (value ?? "").replace(/[^0-9+]/g, "");
  return result.length >= 6 ? result : null;
}

async function upsertCustomer(input: { name: string; company: string; country: string; email: string; whatsapp?: string; visitorId?: string; sourceChannel?: string }) {
  const sql = adminSql();
  const id = randomUUID();
  const rows = await sql.query(
    `INSERT INTO b2b_customers (id, first_seen_at, last_seen_at, name, company, country, email_normalized, whatsapp_normalized, source_channel)
     VALUES ($1, now(), now(), $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email_normalized) WHERE email_normalized IS NOT NULL
     DO UPDATE SET last_seen_at = now(), name = EXCLUDED.name, company = EXCLUDED.company, country = EXCLUDED.country, whatsapp_normalized = COALESCE(EXCLUDED.whatsapp_normalized, b2b_customers.whatsapp_normalized), source_channel = COALESCE(b2b_customers.source_channel, EXCLUDED.source_channel)
     RETURNING id`,
    [id, input.name, input.company, input.country, normalEmail(input.email), normalPhone(input.whatsapp), input.sourceChannel ?? null],
  );
  const customerId = String(rows[0]?.id ?? id);
  if (safeIdentifier.test(input.visitorId ?? "")) await sql.query("UPDATE analytics_visitors SET customer_id = $2 WHERE visitor_id = $1", [input.visitorId, customerId]);
  return customerId;
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
  const customerId = await upsertCustomer(input);
  await sql.query("UPDATE b2b_leads SET customer_id = $2 WHERE id = $1", [id, customerId]);
  return id;
}

export async function listLeads(range: AdminDateRange, page = 1, pageSize = 25, status?: string): Promise<PaginatedResult<AdminLead>> {
  const sql = adminSql();
  const safePage = Math.max(1, Math.floor(page));
  const safeSize = safePageSize(pageSize);
  const filters = status && ["new","qualified","technical-review","quotation-sent","negotiation","won","lost","nurture"].includes(status) ? [range.start, range.end, status] : [range.start, range.end];
  const predicate = status && filters.length === 3 ? " AND status = $3" : "";
  const [countRows, rows] = await Promise.all([
    sql.query(`SELECT COUNT(*)::int AS total FROM b2b_leads WHERE created_at >= $1 AND created_at < $2${predicate}`, filters),
    sql.query(`SELECT id,created_at,status,name,company,country,email,whatsapp,category,product_model,application,quantity,source_channel,landing_path,customer_id,visitor_id FROM b2b_leads WHERE created_at >= $1 AND created_at < $2${predicate} ORDER BY created_at DESC LIMIT $${filters.length + 1} OFFSET $${filters.length + 2}`, [...filters, safeSize, (safePage - 1) * safeSize]),
  ]);
  const total = Number((countRows[0] as Record<string, unknown> | undefined)?.total ?? 0);
  return {
    rows: rows.map((row) => ({ id: String(row.id), createdAt: asIso(row.created_at), status: String(row.status) as LeadStatus, name: String(row.name), company: String(row.company), country: String(row.country), email: String(row.email), whatsapp: row.whatsapp ? String(row.whatsapp) : null, category: String(row.category), productModel: row.product_model ? String(row.product_model) : null, application: row.application ? String(row.application) : null, quantity: row.quantity ? String(row.quantity) : null, sourceChannel: row.source_channel ? String(row.source_channel) : null, landingPath: row.landing_path ? String(row.landing_path) : null, customerId: row.customer_id ? String(row.customer_id) : null, visitorId: row.visitor_id ? String(row.visitor_id) : null })),
    total, page: safePage, pageSize: safeSize, pageCount: Math.max(1, Math.ceil(total / safeSize)),
  };
}


export type VisitorFilters = { search?: string; country?: string; channel?: string; device?: string };

function visitorPredicate(range: AdminDateRange, filters: VisitorFilters) {
  const params: unknown[] = [range.start, range.end];
  const clauses = ["EXISTS (SELECT 1 FROM analytics_sessions rs WHERE rs.visitor_id = v.visitor_id AND rs.started_at >= $1 AND rs.started_at < $2)"];
  if (filters.country) { params.push(text(filters.country, 8).toUpperCase()); clauses.push(`v.country_code = $${params.length}`); }
  if (filters.channel) { params.push(text(filters.channel, 80)); clauses.push(`EXISTS (SELECT 1 FROM analytics_sessions cs WHERE cs.visitor_id = v.visitor_id AND cs.channel = $${params.length} AND cs.started_at >= $1 AND cs.started_at < $2)`); }
  if (filters.device) { params.push(text(filters.device, 24)); clauses.push(`v.device_type = $${params.length}`); }
  if (filters.search) { params.push(`%${text(filters.search, 120)}%`); clauses.push(`(v.visitor_id ILIKE $${params.length} OR c.email_normalized ILIKE $${params.length} OR c.company ILIKE $${params.length})`); }
  return { params, where: clauses.join(" AND ") };
}

export async function listVisitors(range: AdminDateRange, page = 1, pageSize = 25, filters: VisitorFilters = {}): Promise<PaginatedResult<VisitorRecord>> {
  const sql = adminSql(); const safePage = Math.max(1, Math.floor(page)); const safeSize = safePageSize(pageSize); const predicate = visitorPredicate(range, filters);
  const [countRows, rows] = await Promise.all([
    sql.query(`SELECT COUNT(*)::int AS total FROM analytics_visitors v LEFT JOIN b2b_customers c ON c.id = v.customer_id WHERE ${predicate.where}`, predicate.params),
    sql.query(`SELECT v.visitor_id,v.first_seen_at,v.last_seen_at,v.country_code,v.region_code,v.preferred_language,v.device_type,v.first_channel,v.customer_id,c.name AS customer_name,c.company AS customer_company,
      (SELECT COUNT(*)::int FROM analytics_sessions s WHERE s.visitor_id=v.visitor_id AND s.started_at >= $1 AND s.started_at < $2) AS session_count,
      (SELECT COUNT(*)::int FROM analytics_events e WHERE e.visitor_id=v.visitor_id AND e.occurred_at >= $1 AND e.occurred_at < $2 AND e.event_name='page_view') AS page_views
      FROM analytics_visitors v LEFT JOIN b2b_customers c ON c.id = v.customer_id WHERE ${predicate.where} ORDER BY v.last_seen_at DESC LIMIT $${predicate.params.length + 1} OFFSET $${predicate.params.length + 2}`, [...predicate.params, safeSize, (safePage - 1) * safeSize]),
  ]);
  const total = Number((countRows[0] as Record<string, unknown> | undefined)?.total ?? 0);
  return { rows: rows.map((row) => ({ visitorId: String(row.visitor_id), firstSeenAt: asIso(row.first_seen_at), lastSeenAt: asIso(row.last_seen_at), country: row.country_code ? String(row.country_code) : null, region: row.region_code ? String(row.region_code) : null, language: row.preferred_language ? String(row.preferred_language) : null, device: String(row.device_type ?? "unknown") as DeviceType, firstChannel: row.first_channel ? String(row.first_channel) : null, customerId: row.customer_id ? String(row.customer_id) : null, customerName: row.customer_name ? String(row.customer_name) : null, customerCompany: row.customer_company ? String(row.customer_company) : null, sessionCount: Number(row.session_count ?? 0), pageViews: Number(row.page_views ?? 0) })), total, page: safePage, pageSize: safeSize, pageCount: Math.max(1, Math.ceil(total / safeSize)) };
}

export async function listCustomers(range: AdminDateRange, page = 1, pageSize = 25, search = ""): Promise<PaginatedResult<CustomerRecord>> {
  const sql = adminSql(); const safePage = Math.max(1, Math.floor(page)); const safeSize = safePageSize(pageSize); const term = text(search, 120); const params = term ? [range.start, range.end, `%${term}%`] : [range.start, range.end]; const predicate = term ? "AND (c.email_normalized ILIKE $3 OR c.company ILIKE $3 OR c.name ILIKE $3)" : "";
  const [countRows, rows] = await Promise.all([
    sql.query(`SELECT COUNT(*)::int AS total FROM b2b_customers c WHERE c.last_seen_at >= $1 AND c.last_seen_at < $2 ${predicate}`, params),
    sql.query(`SELECT c.id,c.name,c.company,c.email_normalized,c.whatsapp_normalized,c.country,c.first_seen_at,c.last_seen_at,c.source_channel,(SELECT COUNT(*)::int FROM analytics_visitors v WHERE v.customer_id=c.id) AS visitor_count,(SELECT COUNT(*)::int FROM b2b_leads l WHERE l.customer_id=c.id) AS lead_count,(SELECT COUNT(*)::int FROM analytics_events e JOIN analytics_visitors v ON v.visitor_id=e.visitor_id WHERE v.customer_id=c.id AND e.event_name='page_view' AND e.occurred_at >= $1 AND e.occurred_at < $2) AS page_views FROM b2b_customers c WHERE c.last_seen_at >= $1 AND c.last_seen_at < $2 ${predicate} ORDER BY c.last_seen_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, safeSize, (safePage - 1) * safeSize]),
  ]);
  const total = Number((countRows[0] as Record<string, unknown> | undefined)?.total ?? 0);
  return { rows: rows.map((row) => ({ id: String(row.id), name: String(row.name), company: String(row.company), email: String(row.email_normalized), whatsapp: row.whatsapp_normalized ? String(row.whatsapp_normalized) : null, country: String(row.country), firstSeenAt: asIso(row.first_seen_at), lastSeenAt: asIso(row.last_seen_at), sourceChannel: row.source_channel ? String(row.source_channel) : null, visitorCount: Number(row.visitor_count ?? 0), leadCount: Number(row.lead_count ?? 0), pageViews: Number(row.page_views ?? 0) })), total, page: safePage, pageSize: safeSize, pageCount: Math.max(1, Math.ceil(total / safeSize)) };
}

export async function getVisitorJourney(visitorId: string, range: AdminDateRange) {
  if (!safeIdentifier.test(visitorId)) return null;
  const sql = adminSql();
  const [visitorRows, sessionRows, eventRows, leadRows] = await Promise.all([
    sql.query("SELECT v.*, c.name AS customer_name, c.company AS customer_company, c.id AS customer_id FROM analytics_visitors v LEFT JOIN b2b_customers c ON c.id=v.customer_id WHERE v.visitor_id=$1 LIMIT 1", [visitorId]),
    sql.query("SELECT session_id,started_at,last_seen_at,channel,referrer_host,landing_path,device_type,browser_name,os_name FROM analytics_sessions WHERE visitor_id=$1 AND started_at >= $2 AND started_at < $3 ORDER BY started_at DESC", [visitorId, range.start, range.end]),
    sql.query("SELECT event_id,occurred_at,event_name,page_path,page_title,product_category,product_slug,session_id FROM analytics_events WHERE visitor_id=$1 AND occurred_at >= $2 AND occurred_at < $3 ORDER BY occurred_at DESC LIMIT 500", [visitorId, range.start, range.end]),
    sql.query("SELECT id,created_at,status,company,category,product_model FROM b2b_leads WHERE visitor_id=$1 ORDER BY created_at DESC LIMIT 100", [visitorId]),
  ]);
  const visitor = visitorRows[0] as Record<string, unknown> | undefined; if (!visitor) return null;
  return { visitor: { id: String(visitor.visitor_id), firstSeenAt: asIso(visitor.first_seen_at), lastSeenAt: asIso(visitor.last_seen_at), country: visitor.country_code ? String(visitor.country_code) : null, region: visitor.region_code ? String(visitor.region_code) : null, language: visitor.preferred_language ? String(visitor.preferred_language) : null, device: String(visitor.device_type ?? "unknown"), channel: visitor.first_channel ? String(visitor.first_channel) : null, customerId: visitor.customer_id ? String(visitor.customer_id) : null, customerName: visitor.customer_name ? String(visitor.customer_name) : null, customerCompany: visitor.customer_company ? String(visitor.customer_company) : null }, sessions: sessionRows.map((row) => ({ id: String(row.session_id), startedAt: asIso(row.started_at), lastSeenAt: asIso(row.last_seen_at), channel: String(row.channel), referrer: row.referrer_host ? String(row.referrer_host) : null, landingPath: row.landing_path ? String(row.landing_path) : null, device: row.device_type ? String(row.device_type) : null, browser: row.browser_name ? String(row.browser_name) : null, os: row.os_name ? String(row.os_name) : null })), events: eventRows.map((row) => ({ id: String(row.event_id), occurredAt: asIso(row.occurred_at), eventName: String(row.event_name), pagePath: String(row.page_path), pageTitle: row.page_title ? String(row.page_title) : null, productCategory: row.product_category ? String(row.product_category) : null, productSlug: row.product_slug ? String(row.product_slug) : null, sessionId: String(row.session_id) })) as JourneyEvent[], leads: leadRows.map((row) => ({ id: String(row.id), createdAt: asIso(row.created_at), status: String(row.status), company: String(row.company), category: String(row.category), productModel: row.product_model ? String(row.product_model) : null })) };
}

export async function getCustomerJourney(customerId: string, range: AdminDateRange) {
  if (!safeIdentifier.test(customerId)) return null;
  const sql = adminSql();
  const [customerRows, visitorRows, events, leads] = await Promise.all([
    sql.query("SELECT * FROM b2b_customers WHERE id=$1 LIMIT 1", [customerId]),
    sql.query("SELECT visitor_id,first_seen_at,last_seen_at,country_code,preferred_language,device_type,first_channel FROM analytics_visitors WHERE customer_id=$1 ORDER BY last_seen_at DESC", [customerId]),
    sql.query("SELECT e.event_id,e.occurred_at,e.event_name,e.page_path,e.page_title,e.product_category,e.product_slug,e.session_id FROM analytics_events e JOIN analytics_visitors v ON v.visitor_id=e.visitor_id WHERE v.customer_id=$1 AND e.occurred_at >= $2 AND e.occurred_at < $3 ORDER BY e.occurred_at DESC LIMIT 1000", [customerId, range.start, range.end]),
    sql.query("SELECT id,created_at,status,category,product_model,application,quantity FROM b2b_leads WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 100", [customerId]),
  ]);
  const customer = customerRows[0] as Record<string, unknown> | undefined; if (!customer) return null;
  return { customer: { id: String(customer.id), name: String(customer.name), company: String(customer.company), email: String(customer.email_normalized), whatsapp: customer.whatsapp_normalized ? String(customer.whatsapp_normalized) : null, country: String(customer.country), firstSeenAt: asIso(customer.first_seen_at), lastSeenAt: asIso(customer.last_seen_at), sourceChannel: customer.source_channel ? String(customer.source_channel) : null }, visitors: visitorRows.map((row) => ({ id: String(row.visitor_id), firstSeenAt: asIso(row.first_seen_at), lastSeenAt: asIso(row.last_seen_at), country: row.country_code ? String(row.country_code) : null, language: row.preferred_language ? String(row.preferred_language) : null, device: row.device_type ? String(row.device_type) : null, sourceChannel: row.first_channel ? String(row.first_channel) : null })), events: events.map((row) => ({ id: String(row.event_id), occurredAt: asIso(row.occurred_at), eventName: String(row.event_name), pagePath: String(row.page_path), pageTitle: row.page_title ? String(row.page_title) : null, productCategory: row.product_category ? String(row.product_category) : null, productSlug: row.product_slug ? String(row.product_slug) : null, sessionId: String(row.session_id) })) as JourneyEvent[], leads: leads.map((row) => ({ id: String(row.id), createdAt: asIso(row.created_at), status: String(row.status), category: String(row.category), productModel: row.product_model ? String(row.product_model) : null, application: row.application ? String(row.application) : null, quantity: row.quantity ? String(row.quantity) : null })) };
}


export type AnalyticsEventRecord = {
  id: string; occurredAt: string; eventName: string; pagePath: string; pageTitle: string | null; product: string | null;
  visitorId: string; channel: string; country: string | null; language: string | null; device: string | null; browser: string | null;
};

export async function listAnalyticsEvents(range: AdminDateRange, page = 1, pageSize = 25, filters: { source?: string; country?: string; device?: string; language?: string; event?: string; search?: string } = {}): Promise<PaginatedResult<AnalyticsEventRecord>> {
  const sql = adminSql(); const safePage = Math.max(1, Math.floor(page)); const safeSize = safePageSize(pageSize);
  const params: unknown[] = [range.start, range.end]; const clauses = ["e.occurred_at >= $1", "e.occurred_at < $2"];
  const add = (condition: string, value: string) => { params.push(value); clauses.push(condition.replace("?", String(params.length))); };
  if (filters.source) add("s.channel = $?", text(filters.source, 80));
  if (filters.country) add("v.country_code = $?", text(filters.country, 8).toUpperCase());
  if (filters.device) add("v.device_type = $?", text(filters.device, 24));
  if (filters.language) add("v.preferred_language ILIKE $?", `%${text(filters.language, 24)}%`);
  if (filters.event) add("e.event_name = $?", text(filters.event, 80));
  if (filters.search) { params.push(`%${text(filters.search, 120)}%`); const position = params.length; clauses.push("(e.page_path ILIKE $" + position + " OR e.product_slug ILIKE $" + position + " OR e.page_title ILIKE $" + position + ")"); }
  const where = clauses.join(" AND ");
  const count = await sql.query(`SELECT COUNT(*)::int AS total FROM analytics_events e JOIN analytics_sessions s ON s.session_id=e.session_id JOIN analytics_visitors v ON v.visitor_id=e.visitor_id WHERE ${where}`, params);
  const rows = await sql.query(`SELECT e.event_id,e.occurred_at,e.event_name,e.page_path,e.page_title,e.product_category,e.product_slug,e.visitor_id,s.channel,v.country_code,v.preferred_language,v.device_type,s.browser_name FROM analytics_events e JOIN analytics_sessions s ON s.session_id=e.session_id JOIN analytics_visitors v ON v.visitor_id=e.visitor_id WHERE ${where} ORDER BY e.occurred_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, safeSize, (safePage - 1) * safeSize]);
  const total = Number((count[0] as Record<string, unknown> | undefined)?.total ?? 0);
  return { rows: rows.map((row) => ({ id: String(row.event_id), occurredAt: asIso(row.occurred_at), eventName: String(row.event_name), pagePath: String(row.page_path), pageTitle: row.page_title ? String(row.page_title) : null, product: row.product_slug ? String(row.product_slug) : row.product_category ? String(row.product_category) : null, visitorId: String(row.visitor_id), channel: String(row.channel), country: row.country_code ? String(row.country_code) : null, language: row.preferred_language ? String(row.preferred_language) : null, device: row.device_type ? String(row.device_type) : null, browser: row.browser_name ? String(row.browser_name) : null })), total, page: safePage, pageSize: safeSize, pageCount: Math.max(1, Math.ceil(total / safeSize)) };
}
