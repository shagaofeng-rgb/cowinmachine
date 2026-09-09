import assert from "node:assert/strict";
import test from "node:test";

import { getContentArticleChannel, isThirdPartyBlogFamily } from "../../lib/content-automation/channel";

test("routes every third-party publication family to Blog", () => {
  for (const productFamily of ["external-blog", "external-news", "external-webhook"]) {
    assert.equal(isThirdPartyBlogFamily(productFamily), true);
    assert.equal(getContentArticleChannel({ productFamily }), "blog");
  }
});

test("does not move internal editorial articles out of News", () => {
  assert.equal(getContentArticleChannel({ productFamily: "magnetic-separators" }), "news");
  assert.equal(getContentArticleChannel({ channel: "news", productFamily: "external-webhook" }), "news");
  assert.equal(getContentArticleChannel({ channel: "blog", productFamily: "magnetic-separators" }), "blog");
});
