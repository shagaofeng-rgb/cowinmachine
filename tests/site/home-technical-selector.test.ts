import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeTechnicalSelector } from "@/components/sections/HomeTechnicalSelector";

test("the homepage selection form can prefill the quote page without client scripts", () => {
  const markup = renderToStaticMarkup(createElement(HomeTechnicalSelector));
  assert.match(markup, /<form\b[^>]*action="\/request-a-quote"[^>]*method="get"/);
  for (const name of ["category", "application", "requirements"]) {
    assert.match(markup, new RegExp(`<select\\b[^>]*name="${name}"[^>]*required`));
  }
  assert.match(markup, /<option value="Working conditions: Remote or mobile operation\.">Remote or mobile operation<\/option>/);
});
