import test from "node:test";
import assert from "node:assert/strict";
import { canonicalizeUrl, fingerprint, sanitizeHtml, scoreRelevance, slugify, withinLookback } from "../lib/core.mjs";

test("canonicalizeUrl removes tracking parameters", () => {
  assert.equal(canonicalizeUrl("https://Example.com/a?utm_source=x&b=1#top"), "https://example.com/a?b=1");
});

test("withinLookback validates 72 hour rule", () => {
  const now = new Date("2026-07-08T00:00:00Z");
  assert.equal(withinLookback("2026-07-06T00:00:00Z", now, 72), true);
  assert.equal(withinLookback("2026-07-01T00:00:00Z", now, 72), false);
});

test("fingerprint is stable", () => {
  assert.equal(fingerprint(["A", "B"]), fingerprint(["a", "b"]));
});

test("slugify produces URL safe slugs", () => {
  assert.equal(slugify("Fiber Laser Coding Machine!"), "fiber-laser-coding-machine");
});

test("relevance scoring links content to real products", () => {
  const product = { name: "颗粒包装机", english_name: "Granule Packing Machine", sku: "LT-320K", tags: "granule,packing,food", category_name: "Packaging equipment" };
  const result = scoreRelevance("Food granule packing demand is growing", [product]);
  assert.ok(result.score > 0);
  assert.equal(result.product, product);
});

test("sanitizeHtml strips scripts and inline handlers", () => {
  assert.equal(sanitizeHtml('<p onclick="x">ok</p><script>alert(1)</script>').includes("script"), false);
});
