import assert from "node:assert/strict";
import test from "node:test";
import { readAdminDateRange } from "@/lib/admin-operations/date-range";
import { specificationEquivalent, trimRepeatedReviewNote } from "@/lib/catalog-presentation";
import { resolveInquirySelection } from "@/lib/inquiry-context";
import { resolvePage } from "@/lib/pagination";

test("the catalog, not caller-supplied fields, determines the selected model and category", () => {
  const selection = resolveInquirySelection("https://www.cowinmachine.com/products/compressed-air-equipment/air-zd10lg-8-122?utm_source=example", "generator-systems");
  assert.equal(selection.model, "ZD10LG-8");
  assert.equal(selection.category?.slug, "compressed-air-equipment");
  assert.equal(selection.productUrl, "https://cowinmachine.com/products/compressed-air-equipment/air-zd10lg-8-122");
});

test("invalid sources and category references cannot be stored as product detail URLs", () => {
  for (const value of ["https://example.com/products/drilling-equipment/rig-fy300-150", "/products/drilling-equipment/unknown-model", "/products/drilling-equipment"]) {
    const selection = resolveInquirySelection(value, "drilling-equipment");
    assert.equal(selection.model, "");
    assert.equal(selection.productUrl, "");
    assert.equal(selection.category?.slug, "drilling-equipment");
  }
  assert.equal(resolveInquirySelection("", "unrecognized").category, undefined);
});

test("repeated pagination parameters and impossible admin dates fail safely", () => {
  assert.equal(resolvePage(["2", "3"], 5).valid, false);
  assert.equal(readAdminDateRange({ preset: "custom", start: "2026-99-99", end: "2026-11-05" }).preset, "today");
  const range = readAdminDateRange({ preset: "last-90" });
  assert.equal(Date.parse(range.end) - Date.parse(range.start), 90 * 86400000);
});

test("dual units are calculated only for unambiguous catalog values", () => {
  assert.equal(specificationEquivalent("Working pressure", "0.8 MPa"), "Approx. 116 psi");
  assert.equal(specificationEquivalent("Air delivery / FAD", "1 m3/min"), "Approx. 35.3 cfm");
  assert.equal(specificationEquivalent("Power source", "380V/50HZ"), null);
  assert.equal(specificationEquivalent("Working pressure", "0.8 to 1 MPa"), null);
  assert.equal(trimRepeatedReviewNote("A verified model. For the Example record, the review should document the actual application, site interfaces and operating sequence before any configuration is confirmed."), "A verified model.");
});
