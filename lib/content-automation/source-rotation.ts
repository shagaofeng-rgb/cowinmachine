import "server-only";

import { isFormalNewsSource, sourceForCategory, type NewsSource } from "@/lib/content-automation/source-catalog";
import type { ContentArticle } from "@/types/content-automation";

const DAY = 86_400_000;

const ageInDays = (value: string, now: Date) => (now.valueOf() - new Date(value).valueOf()) / DAY;

function sourceIdsUsedWithin(history: ContentArticle[], now: Date, days: number) {
  return new Map(history
    .filter((article) => ageInDays(article.publishedAt ?? article.createdAt, now) <= days)
    .flatMap((article) => article.sources)
    .map((source) => [source.id, source] as const));
}

export function selectRotatingSources(category: string, history: ContentArticle[], limit = 12, now = new Date()) {
  const recent14 = sourceIdsUsedWithin(history, now, 14);
  const recent30 = history.filter((article) => ageInDays(article.publishedAt ?? article.createdAt, now) <= 30);
  const lastArticle = recent30[0];
  const priorGroups = recent30.slice(0, 2).map((article) => article.sources[0]?.id).filter(Boolean);
  const candidates = sourceForCategory(category).filter((source) => {
    if (!isFormalNewsSource(source) || recent14.has(source.id)) return false;
    const uses = recent30.flatMap((article) => article.sources).filter((used) => used.id === source.id).length;
    if (uses >= 2) return false;
    if (lastArticle?.sources.some((used) => used.id === source.id)) return false;
    return true;
  });

  const selected: NewsSource[] = [];
  const groups: string[] = [];
  for (const source of candidates) {
    if (selected.length >= limit) break;
    if (groups.filter((group) => group === source.sourceGroup).length >= 2) continue;
    if (priorGroups.includes(source.id)) continue;
    selected.push(source);
    groups.push(source.sourceGroup);
  }
  return selected;
}
