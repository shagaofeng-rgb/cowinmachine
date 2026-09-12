import assert from "node:assert/strict";
import test from "node:test";

import { normalizeExternalBlogWebhookInput } from "../../lib/content-automation/external-blog-webhook-input";

test("accepts the third-party plugin API key and pass field conventions", () => {
  const input = normalizeExternalBlogWebhookInput({
    API_KEY: "plugin-key",
    api_pass: "plugin-pass",
    article_title: "Equipment planning guide",
    article_content: "<p>Practical content that is long enough to be stored by the publisher.</p>",
    category_id: "31",
    cover_url: "https://cowinmachine.com/images/cover.jpg",
  }, new Headers());

  assert.deepEqual(input.secretCandidates, ["plugin-key", "plugin-pass"]);
  assert.equal(input.title, "Equipment planning guide");
  assert.equal(input.content.startsWith("<p>Practical content"), true);
  assert.equal(input.classId, "31");
  assert.equal(input.imageUrl, "https://cowinmachine.com/images/cover.jpg");
});

test("accepts header credentials without exposing them in the normalized fields", () => {
  const input = normalizeExternalBlogWebhookInput({ title: "A title", content: "A body" }, new Headers({
    "x-api-key": "header-key",
    authorization: `Basic ${Buffer.from("user:basic-pass").toString("base64")}`,
  }));

  assert.deepEqual(input.secretCandidates, ["header-key", "user", "basic-pass"]);
});
