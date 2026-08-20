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
      headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/atom+xml, text/html;q=0.9, */*;q=0.1" },
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

function stripMarkup(value: string) {
  return value.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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

function dateValue(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed.toISOString();
}

function parseFeed(xml: string, source: NewsSource): DiscoveredCandidate[] {
  const entries = xml.match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi) ?? [];
  const quality = source.trustTier === "A" ? "primary" : source.trustTier === "B" ? "authoritative-media" : "secondary";
  return entries.slice(0, 30).flatMap((entry) => {
    const url = linkValue(entry);
    const title = tagValue(entry, ["title"]);
    const publishedAt = dateValue(tagValue(entry, ["pubDate", "published", "updated", "dc:date"]));
    if (!url || !title || !publishedAt || !sameHost(url, source)) return [];
    return [{ sourceId: source.id, sourceName: source.name, url, title, publishedAt, summary: tagValue(entry, ["description", "summary", "content"]).slice(0, 700), sourceQuality: quality }];
  });
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
    if (!feedUrl) return { health: { sourceId: source.id, checkedAt: new Date().toISOString(), activeStatus: "active", robotsAllowed: true }, candidates: [] };

    const feed = await fetchText(feedUrl);
    if (!feed.ok) return { health: { sourceId: source.id, checkedAt: new Date().toISOString(), activeStatus: "active", robotsAllowed: true, feedUrl, error: "Feed returned HTTP " + feed.status + "." }, candidates: [] };
    return { health: { sourceId: source.id, checkedAt: new Date().toISOString(), activeStatus: "active", robotsAllowed: true, feedUrl }, candidates: parseFeed(feed.text, source) };
  } catch (error) {
    return { health: { sourceId: source.id, checkedAt: new Date().toISOString(), activeStatus: "inactive", robotsAllowed: false, error: error instanceof Error ? error.message.slice(0, 240) : "Unknown source inspection error." }, candidates: [] };
  }
}
