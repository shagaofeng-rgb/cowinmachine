import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceSitemap = path.resolve("docs/migration/source-products-sitemap.xml");
const output = path.resolve("docs/migration/product-master-audit.csv");
const sourceXml = await readFile(sourceSitemap, "utf8");
const urls = [...sourceXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const sourceHost = new URL(urls[0]).origin;

const rows = [];
for (const [index, sourceUrl] of urls.entries()) {
  let html = "";
  let status = "UNREACHABLE";
  try {
    const response = await fetch(sourceUrl, { headers: { "User-Agent": "cowinmachine-migration-audit/1.0" } });
    status = String(response.status);
    html = response.ok ? await response.text() : "";
  } catch {}
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s*\|.*$/, "").trim() ?? "";
  const description = html.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? "";
  const model = title.match(/\b(?:RCYD|RCDD|RCYB|RCDB|CTN|CTS|CTZ|CQZ|CGB|CBZ|CXJ|DCZ|GLS|CGT|RCDA|RCDC)\b/i)?.[0] ?? "REVIEW REQUIRED";
  const sourceSlug = sourceUrl.split("/").at(-1) ?? "";
  const targetSlug = `magnetic-system-${String(index + 1).padStart(3, "0")}`;
  const discoveredImages = [...html.matchAll(/\/assets\/products\/[^"'\\s?]+\.(?:jpg|jpeg|png|webp)/gi)].map((match) => `${sourceHost}${match[0]}`);
  rows.push({ sourceUrl, title, model, description, status, sourceSlug, targetSlug, imageCount: new Set(discoveredImages).size });
}

const headers = ["source_url_internal_only", "source_product_name", "source_model", "source_meta_description", "source_http_status", "source_slug_internal_only", "target_category", "proposed_target_slug", "image_candidates_found", "verified_specs", "material", "dimensions", "color", "packaging", "applications", "document_status", "image_rights_status", "verified_facts", "unverified_facts", "migration_status"];
const lines = [headers.map(escape).join(",")];
for (const row of rows) {
  lines.push([
    row.sourceUrl, row.title, row.model, row.description, row.status, row.sourceSlug,
    "magnetic-separators", row.targetSlug, row.imageCount,
    "REVIEW REQUIRED", "REVIEW REQUIRED", "REVIEW REQUIRED", "REVIEW REQUIRED", "REVIEW REQUIRED", "REVIEW REQUIRED",
    "REVIEW REQUIRED — do not publish source document", "REVIEW REQUIRED — authorization and watermark review required",
    "Source page title and public page status captured for verification only", "Specifications, application claims, media rights and documents are not verified", "BLOCKED_PENDING_VERIFICATION",
  ].map(escape).join(","));
}
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${lines.join("\n")}\n`, "utf8");
console.log(`Audited ${rows.length} source product URLs; all output is private and review-gated.`);
