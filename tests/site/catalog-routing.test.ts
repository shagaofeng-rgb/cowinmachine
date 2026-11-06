import assert from "node:assert/strict";
import test from "node:test";
import { catalogResultsDestination, isCatalogResultsPath } from "@/lib/catalog-routing";

const url = (path: string) => new URL(path, "https://cowinmachine.com");

test("only catalog searches and paginated listings go to the results renderer", () => {
  for (const path of ["/products", "/products?utm_source=search", "/products/compressed-air-equipment", "/products/compressed-air-equipment/air-zd10lg-8-122?page=2", "/blog?page=2", "/request-a-quote?q=compressor"]) {
    assert.equal(catalogResultsDestination("GET", url(path)), undefined, path);
  }
  for (const [path, destination] of [
    ["/products?page=2&_rsc=flight", "/catalog-results"],
    ["/products?q=&page=1", "/catalog-results"],
    ["/products/compressed-air-equipment?q=ZD10LG-8", "/catalog-results/compressed-air-equipment"],
  ]) {
    for (const method of ["GET", "HEAD"]) {
      assert.equal(catalogResultsDestination(method, url(path)), destination);
    }
  }
});

test("the results renderer has a private path and catalog routing leaves POST requests alone", () => {
  assert.equal(isCatalogResultsPath("/catalog-results"), true);
  assert.equal(isCatalogResultsPath("/catalog-results/compressed-air-equipment"), true);
  assert.equal(isCatalogResultsPath("/catalog-results-guide"), false);
  assert.equal(catalogResultsDestination("POST", url("/products?page=2")), undefined);
  assert.equal(catalogResultsDestination("POST", url("/")), undefined);
});
