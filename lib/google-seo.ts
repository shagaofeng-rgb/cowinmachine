import crypto from "node:crypto";
import fs from "node:fs";
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
  const credentials = readServiceAccountCredentials();
  const clientEmail = process.env.GSC_CLIENT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || credentials.clientEmail || "";
  const privateKey = process.env.GSC_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || credentials.privateKey || "";
  const configured = Boolean(clientEmail && privateKey);
  return {
    enabled: process.env.GOOGLE_SEARCH_CONSOLE_ENABLED === "true" || process.env.GSC_SUBMIT_ENABLED === "true",
    clientEmail,
    privateKey,
    siteUrl: normalizeSiteUrl(process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || process.env.GSC_SITE_URL || process.env.SITE_URL || "sc-domain:cowinmachine.com"),
    sitemapUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITEMAP_URL || siteUrl("/sitemap.xml"),
    configured,
  };
}

export function sitemapUrl() {
  const config = googleSeoConfig();
  if (config.sitemapUrl) return config.sitemapUrl;
  const propertyUrl = config.siteUrl;
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

export type GoogleSitemapSubmitResult = {
  ok: boolean;
  configured: boolean;
  enabled: boolean;
  siteUrl: string;
  sitemapUrl: string;
  submittedSitemap: boolean;
  message: string;
};

type GoogleSubmitOptions = {
  fetchImpl?: typeof fetch;
  tokenFactory?: (clientEmail: string, privateKey: string, scopes: string[]) => Promise<string>;
  retries?: number;
  timeoutMs?: number;
};

export async function submitGoogleSitemap(options: GoogleSubmitOptions = {}): Promise<GoogleSitemapSubmitResult> {
  const sqlite = db();
  const config = googleSeoConfig();
  const currentSitemapUrl = sitemapUrl();
  const jobId = `gsc-sitemap-${Date.now()}`;
  sqlite.prepare("INSERT INTO sync_jobs(id, source_name, status, started_at) VALUES (?, 'Google Search Console', 'running', ?)").run(jobId, new Date().toISOString());

  try {
    if (!config.enabled) {
      const message = "Google Search Console sitemap submission is disabled.";
      await updateSitemapSyncJob(jobId, "skipped", message);
      return { ok: true, configured: config.configured, enabled: false, siteUrl: config.siteUrl, sitemapUrl: currentSitemapUrl, submittedSitemap: false, message };
    }
    if (!config.configured) throw new Error("缺少 GSC_CLIENT_EMAIL/GSC_PRIVATE_KEY 或 GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_PATH。");

    await assertPublicSitemapReachable(currentSitemapUrl, options.fetchImpl || fetch, options.timeoutMs || 10_000);
    const token = await (options.tokenFactory || createAccessToken)(config.clientEmail, config.privateKey, [WEBMASTERS_SCOPE]);
    await retry(
      () => submitSitemap(token, config.siteUrl, currentSitemapUrl, options.fetchImpl),
      options.retries ?? 2,
    );

    const completedAt = new Date().toISOString();
    sqlite
      .prepare("UPDATE sync_jobs SET status = 'success', completed_at = ?, success_count = 1, failure_count = 0, error_message = NULL WHERE id = ?")
      .run(completedAt, jobId);
    await updateSyncSource("Sitemap 提交成功", 1, completedAt);
    audit("提交 Sitemap", "SEO", "success", jobId, currentSitemapUrl);
    return {
      ok: true,
      configured: true,
      enabled: true,
      siteUrl: config.siteUrl,
      sitemapUrl: currentSitemapUrl,
      submittedSitemap: true,
      message: "Google Search Console sitemap submitted successfully.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Search Console sitemap submission failed.";
    await updateSitemapSyncJob(jobId, "failed", message);
    await updateSyncSource("Sitemap 提交失败", config.configured ? 1 : 0, undefined, message);
    audit("提交 Sitemap", "SEO", "failed", jobId, message);
    return {
      ok: false,
      configured: config.configured,
      enabled: config.enabled,
      siteUrl: config.siteUrl,
      sitemapUrl: currentSitemapUrl,
      submittedSitemap: false,
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

async function updateSitemapSyncJob(jobId: string, status: "skipped" | "failed", message: string) {
  db()
    .prepare("UPDATE sync_jobs SET status = ?, completed_at = ?, failure_count = ?, error_message = ? WHERE id = ?")
    .run(status, new Date().toISOString(), status === "failed" ? 1 : 0, message, jobId);
}

async function submitSitemap(token: string, propertyUrl: string, feedpath: string, fetchImpl: typeof fetch = fetch) {
  const response = await googleFetch(
    token,
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/sitemaps/${encodeURIComponent(feedpath)}`,
    { method: "PUT" },
    fetchImpl,
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

async function googleFetch(token: string, url: string, init: RequestInit = {}, fetchImpl: typeof fetch = fetch) {
  return fetchImpl(url, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
}

async function assertPublicSitemapReachable(url: string, fetchImpl: typeof fetch, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { method: "GET", signal: controller.signal });
    if (!response.ok) throw new Error(`Sitemap URL is not reachable: HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("xml")) throw new Error(`Sitemap URL returned unexpected content-type: ${contentType || "unknown"}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function retry<T>(operation: () => Promise<T>, retries: number) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw lastError;
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

function readServiceAccountCredentials() {
  const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || "";
  if (!credentialsPath) return { clientEmail: "", privateKey: "" };
  try {
    const payload = JSON.parse(fs.readFileSync(credentialsPath, "utf8")) as { client_email?: string; private_key?: string };
    return { clientEmail: payload.client_email || "", privateKey: payload.private_key || "" };
  } catch {
    return { clientEmail: "", privateKey: "" };
  }
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
