export type PublishingHistoryEntry = {
  productUrl: string;
  productFamily: string;
  similarityKey: string;
  title: string;
  publishedAt?: string;
  createdAt: string;
};

export type FallbackPublishingOption<T> = {
  key: string;
  category: string;
  productUrl: string;
  payload: T;
};

const DAY = 86_400_000;

function timestamp(value: string | undefined) {
  const parsed = value ? new Date(value).valueOf() : Number.NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function publishedAt(entry: PublishingHistoryEntry) {
  return timestamp(entry.publishedAt ?? entry.createdAt);
}

function withinDays(entry: PublishingHistoryEntry, now: Date, days: number) {
  return now.valueOf() - publishedAt(entry) <= days * DAY;
}

export function rankFallbackPublishingOptions<T>(
  options: FallbackPublishingOption<T>[],
  history: PublishingHistoryEntry[],
  now = new Date(),
) {
  const recentCategoryCounts = new Map<string, number>();
  const recentProductCounts = new Map<string, number>();
  const lastTopicUse = new Map<string, number>();

  for (const entry of history) {
    if (withinDays(entry, now, 30)) {
      recentCategoryCounts.set(entry.productFamily, (recentCategoryCounts.get(entry.productFamily) ?? 0) + 1);
    }
    if (withinDays(entry, now, 60)) {
      recentProductCounts.set(entry.productUrl, (recentProductCounts.get(entry.productUrl) ?? 0) + 1);
    }
    lastTopicUse.set(entry.similarityKey, Math.max(lastTopicUse.get(entry.similarityKey) ?? 0, publishedAt(entry)));
  }

  return [...options].sort((first, second) => {
    const firstTopicUse = lastTopicUse.get(first.key) ?? 0;
    const secondTopicUse = lastTopicUse.get(second.key) ?? 0;
    if (firstTopicUse !== secondTopicUse) return firstTopicUse - secondTopicUse;

    const firstProductUses = recentProductCounts.get(first.productUrl) ?? 0;
    const secondProductUses = recentProductCounts.get(second.productUrl) ?? 0;
    if (firstProductUses !== secondProductUses) return firstProductUses - secondProductUses;

    const firstCategoryUses = recentCategoryCounts.get(first.category) ?? 0;
    const secondCategoryUses = recentCategoryCounts.get(second.category) ?? 0;
    if (firstCategoryUses !== secondCategoryUses) return firstCategoryUses - secondCategoryUses;

    return first.key.localeCompare(second.key);
  });
}

export function evaluateFallbackPublication(input: {
  auditPassed: boolean;
  factDeltaDetected: boolean;
  titleSimilarity: number;
  bodySimilarity: number;
  topicRepeatedWithin180Days: boolean;
}) {
  const checks = [
    {
      name: "language-quality",
      passed: input.auditPassed,
      detail: input.auditPassed ? "Language and structure audit passed." : "Language or structure audit failed.",
    },
    {
      name: "fact-lock",
      passed: !input.factDeltaDetected,
      detail: input.factDeltaDetected ? "A locked product fact changed or disappeared." : "Locked product facts were preserved.",
    },
    {
      name: "unique-title",
      passed: input.titleSimilarity < 0.85,
      detail: `Title similarity ${input.titleSimilarity.toFixed(2)}; maximum is 0.85.`,
    },
    {
      name: "topic-rotation",
      passed: !input.topicRepeatedWithin180Days,
      detail: input.topicRepeatedWithin180Days ? "The same product and editorial angle was used within 180 days." : "Product and editorial angle are clear for 180 days.",
    },
    {
      name: "shared-template-monitor",
      passed: true,
      detail: `Body similarity ${input.bodySimilarity.toFixed(2)} is monitored; shared compliance sections do not block a unique product topic.`,
    },
  ];

  return { passed: checks.every((check) => check.passed), checks };
}
