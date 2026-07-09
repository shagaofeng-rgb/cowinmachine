import crypto from "node:crypto";
import { db, products, articles, audit } from "./db";
import { siteUrl } from "./seo";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters";
const INSPECTION_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type GoogleApiError = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

export type GoogleSeoSyncResult = {
  ok: boolean;
  configured: boolean;
  siteUrl: string;
  sitemapUrl: string;
  submittedSitemap: boolean;
  inspectedUrls: Array<{ url: string; verdict: string; coverageState: string }>;
  analyticsRows: number;
  message: string;
};

export function googleSeoConfig() {
  const clientEmail = process.env.GSC_CLIENT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || "";
  const privateKey = process.env.GSC_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || "";
  const configured = Boolean(clientEmail && privateKey);
  return {
    clientEmail,
    privateKey,
    siteUrl: normalizeSiteUrl(process.env.GSC_SITE_URL || process.env.SITE_URL || "https://cowinmachine.com/"),
    configured,
  };
}

export function sitemapUrl() {
  const propertyUrl = googleSeoConfig().siteUrl;
  if (propertyUrl.startsWith("sc-domain:")) return siteUrl("/sitemap.xml");
  return `${propertyUrl.replace(/\/$/, "")}/sitemap.xml`;
}

export function googleSeoCandidateUrls(limit = 10) {
  const urls = [
    siteUrl("/"),
    siteUrl("/products"),
    siteUrl("/news"),
    siteUrl("/blog"),
    siteUrl("/contact"),
    ...products().map((product) => siteUrl(`/products/${product.slug}`)),
    ...articles("news", 20).map((article) => siteUrl(`/news/${article.slug}`)),
    ...articles("blog", 20).map((article) => siteUrl(`/blog/${article.slug}`)),
  ];
  return Array.from(new Set(urls)).slice(0, limit);
}

export async function syncGoogleSeo(): Promise<GoogleSeoSyncResult> {
  const sqlite = db();
  const config = googleSeoConfig();
  const jobId = `gsc-${Date.now()}`;
  const startedAt = new Date().toISOString();
  const currentSitemapUrl = sitemapUrl();

  sqlite
    .prepare(
      `INSERT INTO sync_jobs(id, source_name, status, started_at)
       VALUES (?, ?, 'running', ?)
       ON CONFLICT(id) DO UPDATE SET status = excluded.status, started_at = excluded.started_at`,
    )
    .run(jobId, "Google Search Console", startedAt);

  try {
    if (!config.configured) {
      throw new Error("缺少 GSC_CLIENT_EMAIL 或 GSC_PRIVATE_KEY 环境变量。");
    }

    await updateSyncSource("连接中", 1);
    const token = await createAccessToken(config.clientEmail, config.privateKey, [WEBMASTERS_SCOPE, INSPECTION_SCOPE]);

    await submitSitemap(token, config.siteUrl, currentSitemapUrl);
    const inspectedUrls = await inspectUrls(token, config.siteUrl, googleSeoCandidateUrls(5));
    const analyticsRows = await querySearchAnalytics(token, config.siteUrl);

    const completedAt = new Date().toISOString();
    sqlite
      .prepare(
        `UPDATE sync_jobs
         SET status = 'success', completed_at = ?, success_count = ?, failure_count = 0, error_message = NULL
         WHERE id = ?`,
      )
      .run(completedAt, 1 + inspectedUrls.length + analyticsRows, jobId);
    await updateSyncSource("同步成功", 1, completedAt);
    audit("Google SEO 同步", "SEO", "success", jobId, `提交 sitemap，并检查 ${inspectedUrls.length} 个 URL`);

    return {
      ok: true,
      configured: true,
      siteUrl: config.siteUrl,
      sitemapUrl: currentSitemapUrl,
      submittedSitemap: true,
      inspectedUrls,
      analyticsRows,
      message: "Google Search Console 同步完成。",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google SEO 同步失败。";
    const completedAt = new Date().toISOString();
    sqlite
      .prepare(
        `UPDATE sync_jobs
         SET status = 'failed', completed_at = ?, failure_count = 1, error_message = ?
         WHERE id = ?`,
      )
      .run(completedAt, message, jobId);
    await updateSyncSource("同步失败", config.configured ? 1 : 0, undefined, message);
    sqlite
      .prepare("INSERT INTO seo_issues(issue_type, severity, page_url, suggestion, status) VALUES (?, ?, ?, ?, 'open')")
      .run("google_search_console_sync", "high", config.siteUrl, message);
    audit("Google SEO 同步", "SEO", "failed", jobId, message);

    return {
      ok: false,
      configured: config.configured,
      siteUrl: config.siteUrl,
      sitemapUrl: currentSitemapUrl,
      submittedSitemap: false,
      inspectedUrls: [],
      analyticsRows: 0,
      message,
    };
  }
}

async function updateSyncSource(status: string, configured: 0 | 1, lastSuccessAt?: string, recentError?: string) {
  db()
    .prepare(
      `INSERT INTO sync_sources(name, source_type, configured, connection_status, last_success_at, recent_error)
       VALUES ('Google Search Console', 'seo', ?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET
         configured = excluded.configured,
         connection_status = excluded.connection_status,
         last_success_at = COALESCE(excluded.last_success_at, sync_sources.last_success_at),
         recent_error = excluded.recent_error`,
    )
    .run(configured, status, lastSuccessAt || null, recentError || null);
}

async function createAccessToken(clientEmail: string, privateKey: string, scopes: string[]) {
  const now = Math.floor(Date.now() / 1000);
  const assertionHeader = { alg: "RS256", typ: "JWT" };
  const assertionBody = {
    iss: clientEmail,
    scope: scopes.join(" "),
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };
  const signingInput = `${base64Url(JSON.stringify(assertionHeader))}.${base64Url(JSON.stringify(assertionBody))}`;
  const signature = cryptoSign(signingInput, normalizePrivateKey(privateKey));
  const assertion = `${signingInput}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const payload = (await response.json()) as TokenResponse & GoogleApiError;
  if (!response.ok || !payload.access_token) {
    throw new Error(`Google OAuth 授权失败：${payload.error?.message || response.statusText}`);
  }
  return payload.access_token;
}

async function submitSitemap(token: string, propertyUrl: string, feedpath: string) {
  const response = await googleFetch(
    token,
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/sitemaps/${encodeURIComponent(feedpath)}`,
    { method: "PUT" },
  );
  if (!response.ok) throw new Error(await googleErrorMessage(response, "提交 sitemap 失败"));
}

async function inspectUrls(token: string, propertyUrl: string, urls: string[]) {
  const inspected: Array<{ url: string; verdict: string; coverageState: string }> = [];
  for (const url of urls) {
    const response = await googleFetch(token, "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: propertyUrl }),
    });
    if (!response.ok) throw new Error(await googleErrorMessage(response, `URL 检查失败：${url}`));
    const payload = await response.json();
    const indexStatus = payload.inspectionResult?.indexStatusResult || {};
    inspected.push({
      url,
      verdict: indexStatus.verdict || "UNKNOWN",
      coverageState: indexStatus.coverageState || "UNKNOWN",
    });
  }
  return inspected;
}

async function querySearchAnalytics(token: string, propertyUrl: string) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 28 * 24 * 60 * 60 * 1000);
  const response = await googleFetch(
    token,
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        startDate: toDateString(startDate),
        endDate: toDateString(endDate),
        dimensions: ["query", "page"],
        rowLimit: 10,
      }),
    },
  );
  if (!response.ok) throw new Error(await googleErrorMessage(response, "读取搜索表现失败"));
  const payload = await response.json();
  return Array.isArray(payload.rows) ? payload.rows.length : 0;
}

async function googleFetch(token: string, url: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
}

async function googleErrorMessage(response: Response, fallback: string) {
  let detail = "";
  try {
    const payload = (await response.json()) as GoogleApiError;
    detail = payload.error?.message || payload.error?.status || "";
  } catch {
    detail = await response.text().catch(() => "");
  }
  return `${fallback}：${detail || response.statusText}`;
}

function normalizeSiteUrl(value: string) {
  if (value.startsWith("sc-domain:")) return value;
  return `${value.replace(/\/$/, "")}/`;
}

function normalizePrivateKey(key: string) {
  return key.replace(/\\n/g, "\n");
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function cryptoSign(input: string, privateKey: string) {
  return crypto.sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url");
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}
