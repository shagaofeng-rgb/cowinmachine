import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const reportDirectory = path.resolve("docs/migration");
const productSitemap = process.env.MIGRATION_PRODUCT_SITEMAP
  ? path.resolve(process.env.MIGRATION_PRODUCT_SITEMAP)
  : path.join(reportDirectory, "source-products-sitemap.xml");
const categorySitemap = process.env.MIGRATION_CATEGORY_SITEMAP
  ? path.resolve(process.env.MIGRATION_CATEGORY_SITEMAP)
  : path.join(reportDirectory, "source-categories-sitemap.xml");
const auditOutput = path.join(reportDirectory, "product-master-audit.csv");
const fingerprintOutput = path.join(reportDirectory, "source-content-fingerprints.json");
const scopeOutput = path.join(reportDirectory, "audit-scope.md");
const categoryMap = [
  [/(surveillance|cctv|monitor)/i, "site-monitoring-trailers"],
  [/(diesel|engine)/i, "diesel-light-towers"],
  [/(hybrid|battery)/i, "hybrid-light-towers"],
  [/(solar|light|led)/i, "solar-light-towers"],
];

const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const compact = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const decode = (value) => compact(value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'"));
const getMeta = (html, key) => {
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${key}["']`, "i"),
  ];
  return decode(patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean) ?? "");
};
const getTitle = (html) => decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
const stripHtml = (html) => compact(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
const classify = (value) => categoryMap.find(([pattern]) => pattern.test(value))?.[1] ?? "REVIEW REQUIRED";
const slugFor = (category, index) => `${category.replace(/s$/, "")}-review-${String(index + 1).padStart(3, "0")}`;
const targetNameFor = (category, index) => {
  const labels = {
    "solar-light-towers": "Solar lighting review record",
    "site-monitoring-trailers": "Site monitoring review record",
    "diesel-light-towers": "Diesel lighting review record",
  };
  return `${labels[category] ?? "Product review record"} ${String(index + 1).padStart(3, "0")}`;
};

const sourceXml = await readFile(productSitemap, "utf8");
const urls = [...sourceXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
const categoryXml = await readFile(categorySitemap, "utf8").catch(() => "");
const categoryUrls = [...categoryXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
const records = [];
const fingerprints = [];

for (const [index, sourceUrl] of urls.entries()) {
  let html = "";
  let status = "UNREACHABLE";
  try {
    const response = await fetch(sourceUrl, { headers: { "User-Agent": "private-product-audit/1.0" } });
    status = String(response.status);
    html = response.ok ? await response.text() : "";
  } catch {}
  const sourceTitle = getTitle(html);
  const sourceDescription = getMeta(html, "description");
  const sourceSlug = new URL(sourceUrl).pathname.replace(/^\//, "");
  const targetCategory = classify(`${sourceSlug} ${sourceTitle}`);
  const images = [...html.matchAll(/(?:src|data-src)=["']([^"']+\.(?:jpg|jpeg|png|webp|avif)(?:\?[^"']*)?)["']/gi)].map((match) => match[1]);
  const downloads = [...html.matchAll(/href=["']([^"']+\.(?:pdf|docx?|xlsx?)(?:\?[^"']*)?)["']/gi)].map((match) => match[1]);
  const sourceBody = stripHtml(html);
  records.push({
    sourceUrl,
    sourceTitle,
    sourceDescription,
    status,
    sourceSlug,
    targetCategory,
    targetSlug: targetCategory === "REVIEW REQUIRED" ? "REVIEW REQUIRED" : slugFor(targetCategory, index),
    targetName: targetCategory === "REVIEW REQUIRED" ? "REVIEW REQUIRED" : targetNameFor(targetCategory, index),
    imageCount: new Set(images).size,
    downloadCount: new Set(downloads).size,
  });
  fingerprints.push({ sourceTitle, sourceDescription, sourceBody, sourceSlug });
}

const headers = ["source_url_internal_only", "source_product_name", "source_model", "source_meta_description", "source_http_status", "source_slug_internal_only", "target_product_name", "target_category", "proposed_target_slug", "target_url_internal_only", "image_candidates_found", "image_status", "document_candidates_found", "verified_specs", "material", "dimensions", "color", "packaging", "applications", "document_status", "image_rights_status", "verified_facts", "unverified_facts", "migration_status"];
const lines = [headers.map(escapeCsv).join(",")];
for (const record of records) {
  lines.push([
    record.sourceUrl, record.sourceTitle, "REVIEW REQUIRED", record.sourceDescription, record.status, record.sourceSlug,
    record.targetName, record.targetCategory, record.targetSlug, record.targetCategory === "REVIEW REQUIRED" ? "REVIEW REQUIRED" : `/products/${record.targetCategory}/${record.targetSlug}`,
    record.imageCount, "REVIEW REQUIRED: no source image is published", record.downloadCount,
    "REVIEW REQUIRED", "REVIEW REQUIRED", "REVIEW REQUIRED", "REVIEW REQUIRED", "REVIEW REQUIRED", "REVIEW REQUIRED",
    "REVIEW REQUIRED: do not publish source document", "REVIEW REQUIRED: authorization, watermark and contact review required",
    "Public page title and status captured for private verification only", "Specifications, application claims, media rights and documents are not verified", "BLOCKED_PENDING_VERIFICATION",
  ].map(escapeCsv).join(","));
}

const scope = `# Private source audit scope\n\n- Public product URLs inventoried: ${records.length}\n- Public category URLs inventoried: ${categoryUrls.length}\n- Public product pages reachable during audit: ${records.filter((record) => record.status.startsWith("2")).length}\n- Candidate image references: ${records.reduce((total, record) => total + record.imageCount, 0)}\n- Candidate download references: ${records.reduce((total, record) => total + record.downloadCount, 0)}\n\n## REVIEW REQUIRED\n\n- Hidden products, backend/CMS records, private filters and unpublished pagination require an authorized CMS export.\n- Image and document rights require written authorization plus watermark, contact detail and QR-code review.\n- Product specifications, technical applications, model names, packaging, certifications and performance claims remain blocked until evidence is approved.\n- The source references in this directory are private audit material and are ignored by version control.\n`;

await mkdir(reportDirectory, { recursive: true });
await writeFile(auditOutput, `${lines.join("\n")}\n`, "utf8");
await writeFile(fingerprintOutput, JSON.stringify(fingerprints), "utf8");
await writeFile(scopeOutput, scope, "utf8");
console.log(`Audited ${records.length} public product URLs; every record remains private and review-gated.`);
