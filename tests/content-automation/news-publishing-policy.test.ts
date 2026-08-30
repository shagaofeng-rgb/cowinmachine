import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateFallbackPublication,
  rankFallbackPublishingOptions,
  type FallbackPublishingOption,
  type PublishingHistoryEntry,
} from "../../lib/content-automation/publishing-policy";

const now = new Date("2026-08-30T02:00:00.000Z");
const options: FallbackPublishingOption<string>[] = [
  { key: "brief:compressor:air-supply", category: "compressors", productUrl: "/products/compressor-a", payload: "A" },
  { key: "brief:generator:load-planning", category: "generators", productUrl: "/products/generator-a", payload: "B" },
  { key: "brief:drill:site-review", category: "drilling", productUrl: "/products/drill-a", payload: "C" },
];

function history(overrides: Partial<PublishingHistoryEntry>): PublishingHistoryEntry {
  return {
    productUrl: "/products/compressor-a",
    productFamily: "compressors",
    similarityKey: "brief:compressor:air-supply",
    title: "Compressor planning brief",
    createdAt: "2026-08-29T02:00:00.000Z",
    publishedAt: "2026-08-29T02:00:00.000Z",
    ...overrides,
  };
}

test("rotates away from recently used products and topics", () => {
  const ranked = rankFallbackPublishingOptions(options, [history({})], now);
  assert.equal(ranked.at(-1)?.key, "brief:compressor:air-supply");
  assert.notEqual(ranked[0]?.productUrl, "/products/compressor-a");
});

test("selects the oldest topic when every option has history", () => {
  const ranked = rankFallbackPublishingOptions(options, [
    history({ similarityKey: options[0].key, productUrl: options[0].productUrl, productFamily: options[0].category, publishedAt: "2026-08-20T02:00:00.000Z" }),
    history({ similarityKey: options[1].key, productUrl: options[1].productUrl, productFamily: options[1].category, publishedAt: "2026-08-10T02:00:00.000Z" }),
    history({ similarityKey: options[2].key, productUrl: options[2].productUrl, productFamily: options[2].category, publishedAt: "2026-08-25T02:00:00.000Z" }),
  ], now);
  assert.equal(ranked[0]?.key, "brief:generator:load-planning");
});

test("shared template similarity is observed without blocking a unique topic", () => {
  const result = evaluateFallbackPublication({
    auditPassed: true,
    factDeltaDetected: false,
    titleSimilarity: 0.32,
    bodySimilarity: 0.91,
    topicRepeatedWithin180Days: false,
  });
  assert.equal(result.passed, true);
  assert.equal(result.checks.find((check) => check.name === "shared-template-monitor")?.passed, true);
});

test("keeps selecting a fresh product angle for 30 consecutive publishing days", () => {
  const calendarOptions = Array.from({ length: 6 }, (_, categoryIndex) =>
    Array.from({ length: 5 }, (_, productIndex) =>
      Array.from({ length: 4 }, (_, angleIndex) => ({
        key: `brief:category-${categoryIndex}:product-${productIndex}:angle-${angleIndex}`,
        category: `category-${categoryIndex}`,
        productUrl: `/products/category-${categoryIndex}/product-${productIndex}`,
        payload: `${categoryIndex}-${productIndex}-${angleIndex}`,
      })),
    ).flat(),
  ).flat();
  const publishingHistory: PublishingHistoryEntry[] = [];
  const selectedKeys = new Set<string>();

  for (let offset = 0; offset < 30; offset += 1) {
    const publishingDay = new Date(now.valueOf() + offset * 86_400_000);
    const selected = rankFallbackPublishingOptions(calendarOptions, publishingHistory, publishingDay)[0];
    assert.ok(selected);
    assert.equal(selectedKeys.has(selected.key), false);
    selectedKeys.add(selected.key);
    publishingHistory.push(history({
      similarityKey: selected.key,
      productUrl: selected.productUrl,
      productFamily: selected.category,
      title: `Technical brief ${selected.payload}`,
      createdAt: publishingDay.toISOString(),
      publishedAt: publishingDay.toISOString(),
    }));
  }

  assert.equal(selectedKeys.size, 30);
});

test("still blocks duplicate titles, repeated topics, and fact failures", () => {
  assert.equal(evaluateFallbackPublication({ auditPassed: true, factDeltaDetected: false, titleSimilarity: 0.9, bodySimilarity: 0.2, topicRepeatedWithin180Days: false }).passed, false);
  assert.equal(evaluateFallbackPublication({ auditPassed: true, factDeltaDetected: false, titleSimilarity: 0.2, bodySimilarity: 0.2, topicRepeatedWithin180Days: true }).passed, false);
  assert.equal(evaluateFallbackPublication({ auditPassed: true, factDeltaDetected: true, titleSimilarity: 0.2, bodySimilarity: 0.2, topicRepeatedWithin180Days: false }).passed, false);
});
