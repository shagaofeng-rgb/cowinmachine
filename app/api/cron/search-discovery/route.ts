import { createSign } from "node:crypto";
import { isAdminRequest, isSchedulerRequest } from "@/lib/content-automation/auth";
import { getGoogleSearchConsoleConfig, type GoogleServiceAccount } from "@/lib/content-automation/google-search-console-config";
import { recordSearchDiscovery, type SearchDiscoveryRecord } from "@/lib/content-automation/search-discovery-log";
import { getPublishedArticles } from "@/lib/content-automation/storage";
import { productCategories } from "@/lib/products";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 60;

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

async function getGoogleAccessToken(serviceAccount: GoogleServiceAccount) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const unsignedToken = [
    base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" })),
    base64Url(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/webmasters",
      aud: serviceAccount.token_uri ?? "https://oauth2.googleapis.com/token",
      iat: issuedAt,
      exp: issuedAt + 3600,
    })),
  ].join(".");

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const assertion = `${unsignedToken}.${signer.sign(serviceAccount.private_key).toString("base64url")}`;
  const response = await fetch(serviceAccount.token_uri ?? "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) throw new Error(`Google OAuth returned ${response.status}`);
  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) throw new Error("Google OAuth did not return an access token.");
  return payload.access_token;
}

type GoogleSitemapStatus = {
  path?: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  warnings?: string;
  errors?: string;
};

async function submitAndReadSitemap(property: string, sitemapUrl: string, serviceAccount: GoogleServiceAccount) {
  const accessToken = await getGoogleAccessToken(serviceAccount);
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  const headers = { Authorization: `Bearer ${accessToken}` };

  const submitResponse = await fetch(endpoint, { method: "PUT", headers });
  if (!submitResponse.ok) {
    throw new Error(`Search Console sitemap submission returned ${submitResponse.status}`);
  }

  const readbackResponse = await fetch(endpoint, { method: "GET", headers });
  const readback = readbackResponse.ok
    ? await readbackResponse.json() as GoogleSitemapStatus
    : null;

  return {
    submitHttpStatus: submitResponse.status,
    readbackHttpStatus: readbackResponse.status,
    lastSubmitted: readback?.lastSubmitted,
    lastDownloaded: readback?.lastDownloaded,
    pending: readback?.isPending,
    warnings: Number(readback?.warnings ?? 0),
    errors: Number(readback?.errors ?? 0),
  };
}

type UrlInspectionSummary = NonNullable<SearchDiscoveryRecord["inspections"]>[number];

function priorityInspectionUrls() {
  return [
    siteConfig.siteUrl,
    `${siteConfig.siteUrl}/products`,
    ...productCategories.map((category) => `${siteConfig.siteUrl}/products/${category.slug}`),
    `${siteConfig.siteUrl}/news`,
    `${siteConfig.siteUrl}/blog`,
  ];
}

async function inspectUrl(property: string, inspectionUrl: string, accessToken: string): Promise<UrlInspectionSummary> {
  try {
    const response = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inspectionUrl, siteUrl: property }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { url: inspectionUrl, error: `URL Inspection returned ${response.status}` };

    const payload = await response.json() as {
      inspectionResult?: {
        indexStatusResult?: {
          verdict?: string;
          coverageState?: string;
          indexingState?: string;
          pageFetchState?: string;
          robotsTxtState?: string;
          lastCrawlTime?: string;
          googleCanonical?: string;
          userCanonical?: string;
        };
      };
    };
    const status = payload.inspectionResult?.indexStatusResult;
    return {
      url: inspectionUrl,
      verdict: status?.verdict,
      coverageState: status?.coverageState,
      indexingState: status?.indexingState,
      pageFetchState: status?.pageFetchState,
      robotsTxtState: status?.robotsTxtState,
      lastCrawlTime: status?.lastCrawlTime,
      googleCanonical: status?.googleCanonical,
      userCanonical: status?.userCanonical,
    };
  } catch (error) {
    return { url: inspectionUrl, error: error instanceof Error ? error.message : "URL Inspection failed." };
  }
}

async function inspectPriorityUrls(property: string, serviceAccount: GoogleServiceAccount) {
  const urls = priorityInspectionUrls();
  try {
    const accessToken = await getGoogleAccessToken(serviceAccount);
    const results: UrlInspectionSummary[] = [];
    for (let index = 0; index < urls.length; index += 3) {
      results.push(...await Promise.all(urls.slice(index, index + 3).map((url) => inspectUrl(property, url, accessToken))));
    }
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : "URL Inspection authentication failed.";
    return urls.map((url) => ({ url, error: message }));
  }
}

async function persist(result: Omit<SearchDiscoveryRecord, "recordedAt">) {
  try {
    const persisted = await recordSearchDiscovery(result);
    if (!persisted) console.warn("search.discovery.persistence", { status: "database-not-configured" });
  } catch (error) {
    console.error("search.discovery.persistence", {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown persistence error.",
    });
  }
}

async function execute(request: Request) {
  if (!isSchedulerRequest(request) && !isAdminRequest(request)) {
    return Response.json({ error: "Scheduler or administrator authorization is required." }, { status: 401 });
  }

  const articles = await getPublishedArticles();
  const config = getGoogleSearchConsoleConfig();
  const sitemapUrl = config.sitemapUrl ?? `${siteConfig.siteUrl}/sitemap.xml`;

  if (!config.property || !config.serviceAccount) {
    const result = {
      status: "search-console-not-configured" as const,
      sitemapUrl,
      detail: "Search Console property or service-account credentials are missing.",
    };
    await persist(result);
    console.error("search.discovery.result", result);
    return Response.json({
      status: result.status,
      sitemap: sitemapUrl,
      rss: `${siteConfig.siteUrl}/feed.xml`,
      publishedNewsCount: articles.length,
      note: "Configure the exact Search Console property and service-account credentials before submission can run.",
    }, { status: 424 });
  }

  try {
    const verification = await submitAndReadSitemap(config.property, sitemapUrl, config.serviceAccount);
    const inspections = await inspectPriorityUrls(config.property, config.serviceAccount);
    const result = {
      status: "sitemap-submitted" as const,
      property: config.property,
      sitemapUrl,
      ...verification,
      inspections,
      detail: verification.readbackHttpStatus >= 200 && verification.readbackHttpStatus < 300
        ? "Google accepted the sitemap submission and the sitemap resource was read back."
        : "Google accepted the submission, but the sitemap resource could not yet be read back.",
    };
    await persist(result);
    console.log("search.discovery.result", result);

    return Response.json({
      status: result.status,
      property: result.property,
      sitemap: result.sitemapUrl,
      rss: `${siteConfig.siteUrl}/feed.xml`,
      publishedNewsCount: articles.length,
      verification: {
        submitHttpStatus: result.submitHttpStatus,
        readbackHttpStatus: result.readbackHttpStatus,
        lastSubmitted: result.lastSubmitted ?? null,
        lastDownloaded: result.lastDownloaded ?? null,
        pending: result.pending ?? null,
        warnings: result.warnings,
        errors: result.errors,
        inspections: result.inspections,
      },
      note: "The sitemap was submitted for discovery. Indexing and crawl timing remain Google-controlled.",
    });
  } catch (error) {
    const result = {
      status: "sitemap-submission-failed" as const,
      property: config.property,
      sitemapUrl,
      detail: error instanceof Error ? error.message : "Unknown Search Console submission error.",
    };
    await persist(result);
    console.error("search.discovery.result", result);
    return Response.json({
      status: result.status,
      sitemap: sitemapUrl,
      rss: `${siteConfig.siteUrl}/feed.xml`,
      publishedNewsCount: articles.length,
      error: result.detail,
    }, { status: 502 });
  }
}

export const GET = execute;
export const POST = execute;
