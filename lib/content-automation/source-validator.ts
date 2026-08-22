import "server-only";

import { isFormalNewsSource, type NewsSource } from "@/lib/content-automation/source-catalog";

const USER_AGENT = "COWIN-MACHINE-News-Research/1.0 (+https://cowinmachine.com)";
const TIMEOUT_MS = 8_000;
const MAX_BODY_LENGTH = 900_000;

type FetchResult = { ok: boolean; status: number; text: string; contentType: string };

export type SourceHealth = {
  sourceId: string;
  checkedAt: string;
  activeStatus: "active" | "inactive" | "blocked";
  robotsAllowed: boolean;
  feedUrl?: string;
  error?: string;
};

export type DiscoveredCandidate = {
  sourceId: string;
  sourceName: string;
  url: string;
  title: string;
  publishedAt: string;
  summary: string;
  sourceQuality: "primary" | "authoritative-media" | "secondary";
};

function sameHost(candidate: string, source: NewsSource) {
  try {
    const hostname = new URL(candidate).hostname.replace(/^www\./, "");
    return hostname === source.domain || hostname.endsWith("." + source.domain);
  } catch {
    return false;
  }
}

async function fetchText(url: string): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/atom+xml, application/ld+json, text/html;q=0.9, */*;q=0.1" },
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });
    const text = (await response.text()).slice(0, MAX_BODY_LENGTH);
    return { ok: response.ok, status: response.status, text, contentType: response.headers.get("content-type") ?? "" };
  } finally {
    clearTimeout(timer);
  }
}

function robotsAllows(robots: string) {
  const blocks = robots.split(/\n\s*\n/);
  const agentBlock = blocks.find((block) => /user-agent:\s*\*/i.test(block)) ?? "";
  return !/^\s*disallow:\s*\/\s*$/im.test(agentBlock);
}

function feedFromHtml(html: string, source: NewsSource) {
  const match = html.match(/<link[^>]+type=["'](?:application\/rss\+xml|application\/atom\+xml)["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+type=["'](?:application\/rss\+xml|application\/atom\+xml)["'][^>]*>/i);
  if (!match?.[1]) return undefined;
  const feed = new URL(match[1], source.homepage).toString();
  return sameHost(feed, source) ? feed : undefined;
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripMarkup(value: string) {
  return decodeEntities(value.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function tagValue(item: string, tags: string[]) {
  for (const tag of tags) {
    const match = item.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)<\\/" + tag + ">", "i"));
    if (match?.[1]) return stripMarkup(match[1]);
  }
  return "";
}

function linkValue(item: string) {
  const atom = item.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
  const rss = tagValue(item, ["link"]);
  return atom ?? rss;
}

function dateValue(value: string | undefined) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed.toISOString();
}

function qualityFor(source: NewsSource) {
  return source.trustTier === "A" ? "primary" as const : source.trustTier === "B" ? "authoritative-media" as const : "secondary" as const;
}

function candidate(source: NewsSource, value: { url?: string; title?: string; publishedAt?: string; summary?: string }) {
  if (!value.url || !value.title || !value.publishedAt || !sameHost(value.url, source)) return undefined;
  const publishedAt = dateValue(value.publishedAt);
  if (!publishedAt) return undefined;
  return {
    sourceId: source.id,
    sourceName: source.name,
    url: value.url,
    title: stripMarkup(value.title).slice(0, 320),
    publishedAt,
    summary: stripMarkup(value.summary ?? "").slice(0, 700),
    sourceQuality: qualityFor(source),
  } satisfies DiscoveredCandidate;
}

function parseFeed(xml: string, source: NewsSource): DiscoveredCandidate[] {
  const entries = xml.match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi) ?? [];
  return entries.slice(0, 30).flatMap((entry) => {
    const item = candidate(source, {
      url: linkValue(entry),
      title: tagValue(entry, ["title"]),
      publishedAt: tagValue(entry, ["pubDate", "published", "updated", "dc:date"]),
      summary: tagValue(entry, ["description", "summary", "content"]),
    });
    return item ? [item] : [];
  });
}

function allJsonLd(value: unknown, output: Record<string, unknown>[]) {
  if (Array.isArray(value)) value.forEach((entry) => allJsonLd(entry, output));
  else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record["@graph"]) allJsonLd(record["@graph"], output);
    const types = Array.isArray(record["@type"]) ? record["@type"] : [record["@type"]];
    if (types.some((type) => typeof type === "string" && /(?:news)?article/i.test(type))) output.push(record);
    Object.values(record).forEach((entry) => {
      if (entry && typeof entry === "object" && entry !== record["@graph"]) allJsonLd(entry, output);
    });
  }
}

function jsonLdCandidates(html: string, source: NewsSource): DiscoveredCandidate[] {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];
  const records: Record<string, unknown>[] = [];
  for (const script of scripts) {
    const raw = script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try { allJsonLd(JSON.parse(raw), records); } catch { /* Invalid structured data is ignored. */ }
  }
  return records.flatMap((record) => {
    const url = typeof record.url === "string" ? new URL(record.url, source.homepage).toString() : undefined;
    const title = typeof record.headline === "string" ? record.headline : typeof record.name === "string" ? record.name : undefined;
    const date = typeof record.datePublished === "string" ? record.datePublished : typeof record.dateModified === "string" ? record.dateModified : undefined;
    const summary = typeof record.description === "string" ? record.description : "";
    const item = candidate(source, { url, title, publishedAt: date, summary });
    return item ? [item] : [];
  });
}

function attribute(fragment: string, name: string) {
  return fragment.match(new RegExp(name + "\\s*=\\s*[\"']([^\"']+)[\"']", "i"))?.[1];
}

function homepageCandidates(html: string, source: NewsSource): DiscoveredCandidate[] {
  const articles = html.match(/<article\b[\s\S]{0,30000}?<\/article>/gi) ?? [];
  return articles.slice(0, 80).flatMap((article) => {
    const heading = article.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1];
    const link = article.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const url = link?.[1] ? new URL(link[1], source.homepage).toString() : undefined;
    const title = heading ? stripMarkup(heading) : link?.[2] ? stripMarkup(link[2]) : undefined;
    const timeTag = article.match(/<time\b[^>]*>([\s\S]*?)<\/time>/i);
    const date = timeTag ? attribute(timeTag[0], "datetime") ?? stripMarkup(timeTag[1]) : undefined;
    const summary = article.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "";
    const item = candidate(source, { url, title, publishedAt: date, summary });
    return item ? [item] : [];
  });
}

function dedupeCandidates(candidates: DiscoveredCandidate[]) {
  return [...new Map(candidates.map((item) => [item.url, item])).values()]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 30);
}

export async function inspectNewsSource(source: NewsSource): Promise<{ health: SourceHealth; candidates: DiscoveredCandidate[] }> {
  if (!isFormalNewsSource(source) || source.requiresLogin || source.paywalled) {
    return { health: { sourceId: source.id, checkedAt: new Date().toISOString(), activeStatus: "blocked", robotsAllowed: false, error: "Source is discovery-only, login-gated, or paywalled." }, candidates: [] };
  }

  try {
    const robotsUrl = new URL("/robots.txt", source.homepage).toString();
    const robots = await fetchText(robotsUrl);
    const allowed = !robots.ok || robotsAllows(robots.text);
    if (!allowed) return { health: { sourceId: source.id, checkedAt: new Date().toISOString(), activeStatus: "blocked", robotsAllowed: false, error: "robots.txt disallows the default crawler path." }, candidates: [] };

    const home = await fetchText(source.homepage);
    if (!home.ok) return { health: { sourceId: source.id, checkedAt: new Date().toISOString(), activeStatus: home.status === 401 || home.status === 403 ? "blocked" : "inactive", robotsAllowed: true, error: "Homepage returned HTTP " + home.status + "." }, candidates: [] };

    const feedUrl = feedFromHtml(home.text, source);
    const pageCandidates = dedupeCandidates([...jsonLdCandidates(home.text, source), ...homepageCandidates(home.text, source)]);
    if (!feedUrl) return { health: { sourceId: source.id, checkedAt: new Date().toISOString(), activeStatus: "active", robotsAllowed: true }, candidates: pageCandidates };

    const feed = await fetchText(feedUrl);
    if (!feed.ok) return { health: { sourceId: source.id, checkedAt: new Date().toISOString(), activeStatus: "active", robotsAllowed: true, feedUrl, error: "Feed returned HTTP " + feed.status + "." }, candidates: pageCandidates };
    return { health: { sourceId: source.id, checkedAt: new Date().toISOString(), activeStatus: "active", robotsAllowed: true, feedUrl }, candidates: dedupeCandidates([...parseFeed(feed.text, source), ...pageCandidates]) };
  } catch (error) {
    return { health: { sourceId: source.id, checkedAt: new Date().toISOString(), activeStatus: "inactive", robotsAllowed: false, error: error instanceof Error ? error.message.slice(0, 240) : "Unknown source inspection error." }, candidates: [] };
  }
}

function metaValue(html: string, property: string) {
  const expression = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  return html.match(expression)?.[1]?.replace(/&amp;/g, "&").trim();
}

function pageTitle(html: string) {
  return metaValue(html, "og:title") ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function validateDiscoveredArticle(input: { url: string; domain: string; expectedTitle: string; expectedPublishedAt: string }) {
  let parsed: URL;
  try { parsed = new URL(input.url); } catch { return { passed: false, reason: "Candidate URL is invalid." }; }
  const hostname = parsed.hostname.replace(/^www\./, "");
  if (parsed.protocol !== "https:" || (hostname !== input.domain && !hostname.endsWith(`.${input.domain}`))) {
    return { passed: false, reason: "Candidate URL is outside its approved source domain." };
  }
  try {
    const page = await fetchText(input.url);
    if (!page.ok || !/text\/html|application\/xhtml\+xml/i.test(page.contentType)) {
      return { passed: false, reason: `Candidate article returned HTTP ${page.status} or an unsupported content type.` };
    }
    const title = pageTitle(page.text) ?? "";
    if (!title || title.toLowerCase().slice(0, 36) !== input.expectedTitle.toLowerCase().slice(0, 36)) {
      return { passed: false, reason: "Candidate article title could not be confirmed on the original page." };
    }
    const date = metaValue(page.text, "article:published_time") ?? metaValue(page.text, "date") ?? "";
    if (date && Number.isNaN(new Date(date).valueOf())) {
      return { passed: false, reason: "Candidate article date metadata is invalid." };
    }
    return { passed: true, pageTitle: title, pageDate: date || input.expectedPublishedAt };
  } catch (error) {
    return { passed: false, reason: error instanceof Error ? error.message.slice(0, 180) : "Candidate article verification failed." };
  }
}
