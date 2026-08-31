import { createSign } from "node:crypto";
import { isSchedulerRequest } from "@/lib/content-automation/auth";
import { getGoogleSearchConsoleConfig, type GoogleServiceAccount } from "@/lib/content-automation/google-search-console-config";
import { getPublishedArticles } from "@/lib/content-automation/storage";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";

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

async function submitSitemap(property: string, sitemapUrl: string, serviceAccount: GoogleServiceAccount) {
  const accessToken = await getGoogleAccessToken(serviceAccount);
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
    { method: "PUT", headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) throw new Error(`Search Console sitemap submission returned ${response.status}`);
  return sitemapUrl;
}

async function execute(request: Request) {
  if (!isSchedulerRequest(request)) return Response.json({ error: "Scheduler authorization is required." }, { status: 401 });

  const articles = await getPublishedArticles();
  const config = getGoogleSearchConsoleConfig();
  const sitemapUrl = config.sitemapUrl ?? `${siteConfig.siteUrl}/sitemap.xml`;

  if (!config.property || !config.serviceAccount) {
    return Response.json({
      status: "search-console-not-configured",
      sitemap: "/sitemap.xml",
      rss: "/feed.xml",
      publishedNewsCount: articles.length,
      note: "Add a Search Console property and service-account credentials to enable sitemap submission.",
    });
  }

  try {
    const sitemap = await submitSitemap(config.property, sitemapUrl, config.serviceAccount);
    return Response.json({
      status: "sitemap-submitted",
      sitemap,
      rss: "/feed.xml",
      publishedNewsCount: articles.length,
      note: "The sitemap was submitted for discovery. Indexing and crawl timing remain Google-controlled.",
    });
  } catch (error) {
    return Response.json({
      status: "sitemap-submission-failed",
      sitemap: "/sitemap.xml",
      rss: "/feed.xml",
      publishedNewsCount: articles.length,
      error: error instanceof Error ? error.message : "Unknown Search Console submission error.",
    }, { status: 502 });
  }
}

export const GET = execute;
export const POST = execute;
