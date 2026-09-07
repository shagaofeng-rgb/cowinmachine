import assert from "node:assert/strict";
import test from "node:test";
import detailContent from "../../data/product-detail/product-detail-content.json";
import { getGoogleSearchConsoleConfig, isGoogleSearchConsoleConfigured } from "../../lib/content-automation/google-search-console-config";
import { blogPerPage, getPageCount, newsPerPage, paginateItems, productsPerPage, resolvePage } from "../../lib/pagination";
import { nestedProductSections, productPath, productSections } from "../../lib/product-sections";

test("Search Console accepts split Vercel service-account variables", () => {
  const env = {
    NODE_ENV: "test",
    GSC_SITE_URL: "sc-domain:cowinmachine.com",
    GSC_CLIENT_EMAIL: "service@example.iam.gserviceaccount.com",
    GSC_PRIVATE_KEY: "line-one\\nline-two",
  } as NodeJS.ProcessEnv;
  const config = getGoogleSearchConsoleConfig(env);

  assert.equal(config.property, "sc-domain:cowinmachine.com");
  assert.equal(config.serviceAccount?.private_key, "line-one\nline-two");
  assert.equal(isGoogleSearchConsoleConfigured(env), true);
});

test("Search Console accepts the JSON credential format", () => {
  const env = {
    NODE_ENV: "test",
    GOOGLE_SEARCH_CONSOLE_PROPERTY: "https://cowinmachine.com/",
    GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON: JSON.stringify({
      client_email: "service@example.iam.gserviceaccount.com",
      private_key: "line-one\\nline-two",
    }),
  } as NodeJS.ProcessEnv;

  assert.equal(isGoogleSearchConsoleConfigured(env), true);
  assert.equal(getGoogleSearchConsoleConfig(env).serviceAccount?.private_key, "line-one\nline-two");
});

test("all configuration-review product content is complete and spec-safe", () => {
  const profiles = detailContent.profiles.filter((profile) => profile.publicationState === "configuration-review");
  assert.equal(profiles.length, 134);
  assert.equal(profiles.every((profile) => profile.specifications.length === 0), true);
  assert.equal(profiles.every((profile) => !profile.content.overview.includes("undefined")), true);
  assert.equal(profiles.every((profile) => !profile.reviewReason?.includes("Audit status")), true);
});

test("public collection page sizes are bounded and pagination is stable", () => {
  assert.equal(productsPerPage, 12);
  assert.equal(newsPerPage, 9);
  assert.equal(blogPerPage, 9);
  assert.equal(getPageCount(25, productsPerPage), 3);
  assert.deepEqual(paginateItems(Array.from({ length: 25 }, (_, index) => index + 1), 3, productsPerPage), [25]);
  assert.equal(resolvePage("999", 3).valid, false);
  assert.equal(resolvePage("1", 3).shouldRedirect, true);
});

test("product details expose unique routed content sections", () => {
  assert.equal(productSections.length, 7);
  assert.equal(nestedProductSections.length, 6);
  assert.equal(new Set(productSections.map((section) => section.slug)).size, productSections.length);
  assert.equal(productPath({ category: "generator-systems", slug: "example" }), "/products/generator-systems/example");
  assert.equal(productPath({ category: "generator-systems", slug: "example" }, "specifications"), "/products/generator-systems/example/specifications");
});
