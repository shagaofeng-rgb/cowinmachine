import assert from "node:assert/strict";
import test from "node:test";
import detailContent from "../../data/product-detail/product-detail-content.json";
import { getGoogleSearchConsoleConfig, isGoogleSearchConsoleConfigured } from "../../lib/content-automation/google-search-console-config";

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
