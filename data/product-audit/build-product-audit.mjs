import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = "https://cowinmachine.com";
const outputDirectory = path.resolve("data/product-audit");
const accessedAt = new Date().toISOString();
const categories = {
  "compressed-air-equipment": {
    label: "Air Compressors",
    prefixes: ["ZD", "ZDCY", "ZDYL", "LB", "RM", "ZTV", "KYLC", "ZDY", "KSZJ", "LG"],
    primary: ["screw air compressor", "industrial air compressor"],
    secondary: ["electric screw air compressor", "variable-speed screw air compressor", "VSD air compressor", "stationary screw air compressor", "portable screw air compressor", "diesel portable screw air compressor", "diesel stationary screw air compressor", "high-pressure air compressor", "mining air compressor", "drilling air compressor", "piston air compressor", "diesel piston air compressor"],
    buyerIntent: ["free air delivery", "working pressure", "airend", "air compressor maintenance"],
  },
  "generator-systems": {
    label: "Generator Systems",
    prefixes: ["BF", "ZD", "UGT"],
    primary: ["diesel generator", "industrial generator"],
    secondary: ["silent diesel generator", "soundproof generator", "open-frame diesel generator", "mobile generator", "temporary power generator", "construction site generator"],
    buyerIntent: ["prime power generator", "standby power generator"],
  },
  "drilling-equipment": {
    label: "Drilling Rigs",
    prefixes: ["FY", "FYL", "HT", "KH", "ZDD", "CS"],
    primary: ["water well drilling rig", "DTH drilling rig"],
    secondary: ["crawler drilling rig", "down-the-hole drilling rig", "rock drilling rig", "anchoring drilling rig", "hydraulic drilling rig", "air drilling rig", "mud drilling rig", "borehole drilling rig", "geotechnical drilling rig"],
    buyerIntent: ["drilling depth", "hole diameter", "drilling method"],
  },
  "drilling-consumables": {
    label: "Drilling Tools & Consumables",
    prefixes: ["YT", "Y", "YO", "QL", "ZD"],
    primary: ["drilling tool", "DTH hammer", "DTH drill bit"],
    secondary: ["pneumatic rock drill", "button bit", "tapered button bit", "drill pipe", "rock drill accessories", "top hammer drilling tools", "down-the-hole consumables"],
    buyerIntent: ["tool compatibility", "replacement drilling tools", "drilling consumables"],
  },
  "mobile-lighting-systems": {
    label: "Solar & Mobile Light Towers",
    prefixes: ["UST", "ULT", "UGT", "GDQ", "X-CUBE", "UHT", "UNI", "GTS", "T-720AP"],
    primary: ["solar mobile light tower", "mobile lighting tower"],
    secondary: ["solar light tower", "diesel light tower", "hybrid light tower", "battery mobile light tower", "solar surveillance tower", "solar CCTV trailer", "temporary site lighting", "remote area lighting", "construction lighting tower", "mining light tower"],
    buyerIntent: ["mast height", "lighting output", "battery runtime"],
  },
  "magnetic-separators": {
    label: "Magnetic Separators",
    prefixes: ["RCYD", "RCDD", "RCYB", "RCDB", "RCDA", "RCDC", "RCDE", "RCDF", "RCDFJ", "RCPS", "RCYA", "RCYDII", "RCYE", "RCYF", "RCYG", "RCYP", "RCYZ"],
    primary: ["magnetic separator", "permanent magnetic separator"],
    secondary: ["electromagnetic separator", "suspended magnetic separator", "self-cleaning magnetic separator", "self-unloading magnetic separator", "overband magnetic separator", "cross belt magnetic separator", "dry drum magnetic separator", "wet drum magnetic separator", "wet magnetic separator", "dry magnetic separator", "magnetic pulley", "magnetic roller", "eddy current separator", "metal detector", "magnetic filter", "magnetic grid", "magnetic rod", "magnetic trap", "iron remover"],
    buyerIntent: ["tramp iron removal", "mineral processing magnetic separation", "recycling sorting equipment"],
  },
};

const compact = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const decode = (value) => compact(String(value ?? "").replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&nbsp;", " ").replaceAll("&le;", "≤").replaceAll("&ge;", "≥").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code))));
const stripHtml = (value) => decode(String(value ?? "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
const normalize = (value) => compact(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const slugify = (value) => normalize(value).replace(/\s+/g, "-").slice(0, 72) || "unnamed";
const unique = (values) => [...new Set(values.filter(Boolean))];
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function capture(html, expression) { return html.match(expression)?.[1] ?? ""; }
function extractHeading(html) { return stripHtml(capture(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i)); }
function extractParagraphAfter(html, headingTag) {
  const match = html.match(new RegExp(`<${headingTag}[^>]*>[\\s\\S]*?<\\/${headingTag}>\\s*<p[^>]*>([\\s\\S]*?)<\\/p>`, "i"));
  return match ? stripHtml(match[1]) : "";
}
function extractListAfter(html, heading) {
  const marker = html.search(new RegExp(`<h2[^>]*>\\s*${heading}\\s*<\\/h2>`, "i"));
  if (marker < 0) return [];
  const section = html.slice(marker, marker + 12000);
  const list = capture(section, /<ul[^>]*>([\s\S]*?)<\/ul>/i);
  return unique([...list.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((item) => stripHtml(item[1])));
}
function extractSpecifications(html) {
  const marker = html.search(/<h2[^>]*>\s*Technical Specifications\s*<\/h2>/i);
  const section = marker >= 0 ? html.slice(marker, marker + 18000) : html;
  const table = capture(section, /<table[^>]*>([\s\S]*?)<\/table>/i);
  const specifications = {};
  for (const row of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((cell) => stripHtml(cell[1]));
    if (cells.length >= 2 && cells[0] && cells[1]) specifications[cells[0].replace(/:$/, "")] = cells.slice(1).join(" ");
  }
  return specifications;
}
function extractModel(html, specifications, currentH1, category) {
  const fromTable = Object.entries(specifications).find(([label]) => /^(model|model reference|model designation)$/i.test(label))?.[1];
  if (fromTable && !/confirm|available on request/i.test(fromTable)) return fromTable;
  const keyList = extractListAfter(html, "Key Specifications");
  const modelLine = keyList.find((item) => /^model(?: reference)?\s*:/i.test(item));
  if (modelLine) return modelLine.replace(/^model(?: reference)?\s*:\s*/i, "");

  // This is only a current-page reference extraction: a code must be visibly present
  // in the H1, match the category's supplied series direction, and contain a digit.
  // Bare series labels (for example RCYD) intentionally remain unconfirmed families.
  const candidates = String(currentH1 ?? "").match(/\b[A-Z][A-Z0-9-]{1,}\b/g) ?? [];
  const prefixes = categories[category]?.prefixes ?? [];
  return candidates.find((candidate) => {
    const upper = candidate.toUpperCase();
    return /\d/.test(upper) && prefixes.some((prefix) => upper.startsWith(prefix));
  }) ?? null;
}
function extractImagePath(html) {
  const imageMatches = [...html.matchAll(/(?:src|srcSet)=["']([^"']+)["']/gi)].map((match) => decode(match[1]));
  for (const value of imageMatches) {
    const encodedPath = value.match(/[?&]url=([^&"'\s]+)/)?.[1];
    const candidate = encodedPath ? decodeURIComponent(encodedPath) : value;
    if (/^\/images\/products\//.test(candidate)) return candidate;
  }
  return null;
}
function extractRelatedLinks(html) {
  const marker = html.search(/<h2[^>]*>\s*Related Equipment\s*<\/h2>/i);
  const section = marker >= 0 ? html.slice(marker, marker + 15000) : "";
  return unique([...section.matchAll(/href=["'](\/products\/[^"'#?]+)["']/gi)].map((match) => match[1]));
}
function familyFor(record) {
  const model = record.modelReference;
  if (model && !/^series[-\s]/i.test(model)) return record.currentH1.replace(new RegExp(model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "").replace(/\s+/g, " ").trim() || categories[record.category].label;
  return record.currentH1 || categories[record.category].label;
}
function modelPrefix(model) { return model?.toUpperCase().match(/[A-Z]+(?:-[A-Z]+)?/)?.[0] ?? null; }
function mismatchedCategory(record) {
  const model = record.modelReference?.toUpperCase() ?? "";
  if (!model || /^series[-\s]/i.test(model)) return false;
  const matches = Object.entries(categories).filter(([, data]) => data.prefixes.some((prefix) => model.startsWith(prefix))).map(([slug]) => slug);
  return matches.length === 1 && matches[0] !== record.category;
}
function classifyRecord(record, duplicateKeys) {
  const statuses = [];
  const hasModel = Boolean(record.modelReference && !/^series[-\s]/i.test(record.modelReference));
  const hasTechnicalDetails = Object.keys(record.visibleSpecifications).length >= 3;
  if (hasModel && hasTechnicalDetails) statuses.push("verified-model");
  if (!hasModel) statuses.push("family-or-series", "generic-title-needs-identification");
  if (!hasTechnicalDetails) statuses.push("missing-specification");
  if (!record.imagePath) statuses.push("missing-image");
  if (!record.currentH1 || !record.modelReference) statuses.push("missing-source-evidence");
  if (duplicateKeys.has(record.duplicateKey)) statuses.push("duplicate-or-near-duplicate");
  if (mismatchedCategory(record)) statuses.push("possible-category-mismatch");
  return unique(statuses);
}
function keywordGroups(record) {
  const data = categories[record.category];
  const corpus = normalize(`${record.currentH1} ${record.modelReference ?? ""}`);
  const matchingSecondary = data.secondary.filter((term) => corpus.includes(normalize(term).split(" ")[0]));
  const primary = unique([...data.primary, ...matchingSecondary.slice(0, 2)]);
  const modelTerm = record.modelReference && !/^series[-\s]/i.test(record.modelReference) ? record.modelReference.toLowerCase() : null;
  return {
    primary,
    secondary: unique([...matchingSecondary, ...data.secondary.slice(0, 4)]),
    longTail: unique([modelTerm ? `${modelTerm} ${primary[0]}` : null, modelTerm ? `${modelTerm} specifications` : null, `${record.currentH1.toLowerCase()} for industrial projects`]),
    buyerIntent: data.buyerIntent,
  };
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "User-Agent": "COWIN-MACHINE-product-audit/1.0" }, signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

await mkdir(outputDirectory, { recursive: true });
const sitemap = await fetchText(`${siteUrl}/sitemap.xml`);
const sitemapEntries = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g)].map((match) => ({ url: match[1], lastModified: match[2] }));
const productEntries = sitemapEntries.filter(({ url }) => /^https:\/\/cowinmachine\.com\/products\/[^/]+\/[^/]+$/.test(url));
if (productEntries.length !== 202) throw new Error(`Expected 202 product-detail URLs in sitemap, found ${productEntries.length}.`);

const inventory = new Array(productEntries.length);
let cursor = 0;
async function worker() {
  while (cursor < productEntries.length) {
    const index = cursor; cursor += 1;
    const { url, lastModified } = productEntries[index];
    const [, category, slug] = new URL(url).pathname.match(/^\/products\/([^/]+)\/([^/]+)$/) ?? [];
    try {
      const html = await fetchText(url);
      const specifications = extractSpecifications(html);
      const currentH1 = extractHeading(html);
      const modelReference = extractModel(html, specifications, currentH1, category);
      const duplicateKey = normalize(modelReference && !/^series[-\s]/i.test(modelReference) ? `${category}:${modelReference}` : `${category}:${currentH1}`);
      inventory[index] = { rawRecordId: `raw-${String(index + 1).padStart(3, "0")}`, url, category, slug, currentH1, modelReference, currentProductDescription: extractParagraphAfter(html, "h1"), visibleSpecifications: specifications, imagePath: extractImagePath(html), relatedLinks: extractRelatedLinks(html), lastModified: lastModified || null, accessedAt, fetchStatus: "200", duplicateKey };
    } catch (error) {
      inventory[index] = { rawRecordId: `raw-${String(index + 1).padStart(3, "0")}`, url, category, slug, currentH1: null, modelReference: null, currentProductDescription: null, visibleSpecifications: {}, imagePath: null, relatedLinks: [], lastModified: lastModified || null, accessedAt, fetchStatus: String(error.message), duplicateKey: `${category}:${slug}` };
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

const keyCounts = inventory.reduce((counts, item) => { counts.set(item.duplicateKey, (counts.get(item.duplicateKey) ?? 0) + 1); return counts; }, new Map());
const duplicateKeys = new Set([...keyCounts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
for (const record of inventory) record.statuses = classifyRecord(record, duplicateKeys);

const groups = new Map();
for (const record of inventory) {
  const normalizedModel = record.modelReference && !/^series[-\s]/i.test(record.modelReference) ? normalize(record.modelReference) : null;
  const groupKey = `${record.category}:${normalizedModel ?? normalize(record.currentH1)}`;
  if (!groups.has(groupKey)) groups.set(groupKey, []);
  groups.get(groupKey).push(record);
}
const canonicalProducts = [...groups.entries()].map(([key, records], index) => {
  const first = records[0]; const hasSeries = records.some((record) => /^series[-\s]/i.test(record.modelReference ?? ""));
  const mismatch = records.some(mismatchedCategory);
  const hasExplicitModel = Boolean(first.modelReference && !/^series[-\s]/i.test(first.modelReference));
  const status = records.length > 1 ? "duplicate" : mismatch ? "possible-misclassification" : hasSeries || !hasExplicitModel ? "generic-series" : "verified-model";
  return {
    canonicalId: `cp-${String(index + 1).padStart(3, "0")}-${slugify(key)}`,
    category: first.category,
    family: familyFor(first),
    model: hasExplicitModel ? first.modelReference : null,
    variant: null,
    currentUrls: records.map((record) => record.url),
    aliases: unique(records.flatMap((record) => [record.currentH1, record.modelReference]).filter(Boolean)),
    rawRecordIds: records.map((record) => record.rawRecordId),
    productStatus: status === "verified-model" && records.some((record) => Object.keys(record.visibleSpecifications).length < 3) ? "requires-owner-confirmation" : status,
    verifiedSpecifications: Object.fromEntries(Object.entries(first.visibleSpecifications).filter(([, value]) => value && !/confirm|available on request/i.test(value))),
    missingSpecifications: Object.keys(first.visibleSpecifications).length >= 3 ? [] : ["Technical specification table or model-specific values"],
    keywordGroups: keywordGroups(first),
    evidence: [{ sourceType: "current-site", url: first.url, accessedAt, note: `Current page captured during the public-site audit; sitemap last modified value: ${first.lastModified ?? "not available"}.` }],
  };
});

const issues = inventory.flatMap((record) => record.statuses.filter((status) => status !== "verified-model").map((status) => ({ issueId: `${record.rawRecordId}-${status}`, severity: /duplicate|mismatch/.test(status) ? "high" : /missing/.test(status) ? "medium" : "low", status, category: record.category, rawRecordId: record.rawRecordId, url: record.url, currentH1: record.currentH1 ?? "", modelReference: record.modelReference ?? "", recommendation: status === "duplicate-or-near-duplicate" ? "Confirm whether this URL is a distinct SKU or consolidate it under a canonical family." : status === "possible-category-mismatch" ? "Owner review required before taxonomy changes." : status === "generic-title-needs-identification" ? "Request a manufacturer model or approved family designation." : status === "missing-specification" ? "Obtain approved model-specific specification data before a technical rewrite." : status === "missing-image" ? "Provide an authorized product image or keep the image placeholder." : "Confirm page evidence and product identity with the owner." })));
const keywordRows = canonicalProducts.map((product) => ({ canonicalId: product.canonicalId, category: product.category, family: product.family, model: product.model ?? "", currentUrls: product.currentUrls.join(" | "), primary: product.keywordGroups.primary.join(" | "), secondary: product.keywordGroups.secondary.join(" | "), longTail: product.keywordGroups.longTail.join(" | "), buyerIntent: product.keywordGroups.buyerIntent.join(" | ") }));

const summary = {
  auditedAt: accessedAt,
  source: siteUrl,
  totalRawRecords: inventory.length,
  categoryCounts: Object.fromEntries(Object.keys(categories).map((category) => [category, inventory.filter((record) => record.category === category).length])),
  canonicalProductFamilies: canonicalProducts.length,
  duplicateRawRecords: inventory.filter((record) => record.statuses.includes("duplicate-or-near-duplicate")).length,
  modelsNeedingOwnerConfirmation: canonicalProducts.filter((product) => product.productStatus !== "verified-model").length,
};

await writeFile(path.join(outputDirectory, "raw-product-inventory.json"), JSON.stringify({ summary, records: inventory }, null, 2));
await writeFile(path.join(outputDirectory, "canonical-product-master.json"), JSON.stringify({ summary, products: canonicalProducts }, null, 2));
const csv = (rows) => { const header = Object.keys(rows[0] ?? {}); return [header.map(csvCell).join(","), ...rows.map((row) => header.map((column) => csvCell(row[column])).join(","))].join("\n") + "\n"; };
await writeFile(path.join(outputDirectory, "product-keywords.csv"), csv(keywordRows));
await writeFile(path.join(outputDirectory, "product-data-quality-issues.csv"), csv(issues));
console.log(JSON.stringify({ ...summary, issueCount: issues.length }, null, 2));
