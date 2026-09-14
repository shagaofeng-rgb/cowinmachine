import assert from "node:assert/strict";
import test from "node:test";
import {
  externalBlogImageExtension,
  normalizeExternalBlogImageMimeType,
  validateExternalBlogImageUrl,
} from "../../lib/content-automation/external-blog-image-policy";

test("only permits public HTTPS image source URLs", () => {
  assert.equal(validateExternalBlogImageUrl("https://cdn.example.com/cover.webp")?.hostname, "cdn.example.com");
  assert.equal(validateExternalBlogImageUrl("http://cdn.example.com/cover.webp"), undefined);
  assert.equal(validateExternalBlogImageUrl("https://127.0.0.1/cover.webp"), undefined);
  assert.equal(validateExternalBlogImageUrl("https://192.168.0.10/cover.webp"), undefined);
  assert.equal(validateExternalBlogImageUrl("https://localhost/cover.webp"), undefined);
  assert.equal(validateExternalBlogImageUrl("https://user:pass@cdn.example.com/cover.webp"), undefined);
});

test("only permits supported raster image MIME types", () => {
  assert.equal(normalizeExternalBlogImageMimeType("image/webp; charset=binary"), "image/webp");
  assert.equal(externalBlogImageExtension("image/jpeg"), "jpg");
  assert.equal(normalizeExternalBlogImageMimeType("image/svg+xml"), undefined);
  assert.equal(normalizeExternalBlogImageMimeType("text/html"), undefined);
});
