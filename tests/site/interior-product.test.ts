import assert from "node:assert/strict";
import test from "node:test";
import { catalogHref, catalogProducts, filterCatalogProducts, publishedSpecifications, quickSpecifications, readCatalogSearch, resolveCatalog } from "../../lib/catalog-presentation";
import { normalizeInquiryProductUrl, productQuoteHref } from "../../lib/inquiry-context";
import { getProductDetailProfile } from "../../lib/product-detail-profiles";
import { getGalleryPhotos, isZoomablePhoto } from "../../lib/product-gallery";
import { getProduct } from "../../lib/products";
import { siteConfig } from "../../lib/site";

const compressor = getProduct("compressed-air-equipment", "air-kszj18-17-183")!;
const drill = getProduct("drilling-equipment", "rig-cs110-189")!;

test("model search matches the whole catalog and ignores case and model punctuation", () => {
  const search = readCatalogSearch("  kszj18 17  ");
  const results = filterCatalogProducts(catalogProducts, search);
  assert.ok(results.some((product) => product.id === compressor.id));
  assert.ok(results.every((product) => product.category === "compressed-air-equipment"));
  assert.deepEqual(filterCatalogProducts(catalogProducts, "no-such-equipment-000000"), []);
  assert.equal(readCatalogSearch(["first", "second"]), "");
  assert.equal(readCatalogSearch("a".repeat(110)).length, 100);
});

test("catalog pagination keeps the twelve-item limit and normalized search URLs", () => {
  const catalog = resolveCatalog(catalogProducts, { page: "2" });
  assert.equal(catalog.products.length, 12);
  assert.equal(catalog.resolution.page, 2);
  assert.equal(resolveCatalog(catalogProducts, { q: "nothing found 00000" }).total, 0);
  assert.equal(catalogHref("/products", 2, "solar tower"), "/products?q=solar+tower&page=2");
  assert.equal(catalogHref("/products", 1, ""), "/products");
});

test("product specifications use published fields and omit review placeholders", () => {
  const profile = getProductDetailProfile(compressor);
  const specs = quickSpecifications(compressor.category, profile, 2);
  assert.deepEqual(specs.map((item) => item.label), ["Working pressure", "Air delivery / FAD"]);
  assert.ok(specs.every(({ value }) => !value.includes("application review")));
  const review = catalogProducts.find((item) => getProductDetailProfile(item).publicationState === "configuration-review")!;
  assert.deepEqual(publishedSpecifications(getProductDetailProfile(review)), []);
  assert.ok(catalogProducts.every((item) => publishedSpecifications(getProductDetailProfile(item)).every(({ value }) => !/subject to application review|local demand/i.test(value))));
});

test("gallery uses real photo dimensions and only enlarges sufficiently detailed originals", () => {
  const small = getGalleryPhotos(compressor);
  assert.equal(small.length, 1);
  assert.equal(small[0].width, 540);
  assert.equal(isZoomablePhoto(small[0]), false);
  const large = getGalleryPhotos(drill);
  assert.equal(isZoomablePhoto(large[0]), true);
  assert.deepEqual(getGalleryPhotos({ name: "No photo", gallery: [] }), []);
});

test("product quotation preserves the selected category and accepts safe relative product links", () => {
  const href = new URL(productQuoteHref(compressor, "KSZJ18-17"), siteConfig.siteUrl);
  const productUrl = "/products/compressed-air-equipment/air-kszj18-17-183";
  assert.equal(href.searchParams.get("category"), compressor.category);
  assert.equal(href.searchParams.get("productModel"), "KSZJ18-17");
  assert.equal(href.searchParams.get("productUrl"), productUrl);
  assert.equal(normalizeInquiryProductUrl(productUrl + "#specifications"), new URL(productUrl, siteConfig.siteUrl).href);
  assert.equal(normalizeInquiryProductUrl("https://other.example/products/test"), "");
  assert.equal(normalizeInquiryProductUrl("//other.example/products/test"), "");
  assert.equal(normalizeInquiryProductUrl("/internal/admin"), "");
});
