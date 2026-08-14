import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const auditFile = path.resolve("docs/migration/product-master-audit.csv");
const outputFile = path.resolve("lib/authorized-catalog-products.ts");
const imageRoot = path.resolve("public/images/products");
const concurrency = 6;
const nonProductValue = /(?:@|https?:\/\/|www\.|\b(?:manufacturer|supplier|factory)\b)/i;
const categoryLabels = {
  "compressed-air-equipment": "Air Compressor",
  "generator-systems": "Generator System",
  "drilling-equipment": "Drilling Rig",
  "drilling-consumables": "Drilling Tool",
  "mobile-lighting-systems": "Mobile Light Tower",
  "magnetic-separators": "Magnetic Separator",
};
const categoryCodes = {
  "compressed-air-equipment": "air",
  "generator-systems": "gen",
  "drilling-equipment": "rig",
  "drilling-consumables": "tool",
  "mobile-lighting-systems": "tower",
  "magnetic-separators": "mag",
};
const categoryApplications = {
  "compressed-air-equipment": ["Industrial compressed-air supply", "Workshop and jobsite pneumatic equipment"],
  "generator-systems": ["Temporary power for worksites", "Backup and project power planning"],
  "drilling-equipment": ["Water, rock and site-preparation drilling", "Project-specific drilling operations"],
  "drilling-consumables": ["Drilling tool replacement planning", "Compatible drilling system configuration"],
  "mobile-lighting-systems": ["Remote and temporary worksite lighting", "Construction, roadwork and project support"],
  "magnetic-separators": ["Bulk-material handling and equipment protection", "Process-line magnetic separation"],
};
const descriptorRules = {
  "compressed-air-equipment": [[/diesel/i, "Diesel"], [/electric/i, "Electric"], [/portable|mobile/i, "Portable"], [/stationary|fixed/i, "Stationary"], [/variable frequency|vsd|frequency conversion/i, "Variable-Speed"], [/screw/i, "Screw"], [/piston/i, "Piston"]],
  "generator-systems": [[/silent|soundproof/i, "Silent"], [/open frame/i, "Open-Frame"], [/diesel/i, "Diesel"], [/trailer|mobile/i, "Mobile"]],
  "drilling-equipment": [[/water well/i, "Water-Well"], [/dth|down the hole/i, "DTH"], [/crawler/i, "Crawler"], [/rock/i, "Rock"], [/anchor/i, "Anchoring"], [/hydraulic/i, "Hydraulic"]],
  "drilling-consumables": [[/dth hammer/i, "DTH Hammer"], [/drill bit/i, "Drill Bit"], [/drill pipe/i, "Drill Pipe"], [/button bit/i, "Button Bit"], [/thread/i, "Threaded"], [/coupling/i, "Coupling"]],
  "mobile-lighting-systems": [[/solar/i, "Solar"], [/hybrid/i, "Hybrid"], [/diesel/i, "Diesel"], [/battery/i, "Battery"], [/surveillance|cctv|camera/i, "Surveillance"], [/plug-in|plug in/i, "Plug-In"]],
  "magnetic-separators": [[/self.cleaning|self dumping/i, "Automatic-Discharge"], [/manual/i, "Manual-Clean"], [/electromagnetic/i, "Electromagnetic"], [/permanent/i, "Permanent"], [/dry/i, "Dry"], [/wet/i, "Wet"], [/overband/i, "Overband"], [/suspended/i, "Suspended"], [/inline/i, "Inline"], [/drum/i, "Drum"], [/roller/i, "Roller"], [/grate/i, "Grate"], [/plate/i, "Plate"], [/eddy current/i, "Eddy-Current"], [/metal detector/i, "Metal-Detection"]],
};

const compact = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const decode = (value) => compact(String(value ?? "").replaceAll("&nbsp;", " ").replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&le;", "≤").replaceAll("&ge;", "≥").replaceAll("&times;", "×").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code))).replaceAll("脳", "×").replaceAll("掳", "°").replaceAll("鈩?", "°C").replaceAll("鈮?", "≤"));
const textOnly = (value) => decode(String(value ?? "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function parseCsv(text) {
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]; const next = text[index + 1];
    if (char === '"' && quoted && next === '"') { field += char; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") index += 1; row.push(field); if (row.length > 1) rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...records] = rows;
  return records.map((record) => Object.fromEntries(header.map((key, index) => [key, record[index] ?? ""])));
}

function firstMatch(html, pattern) { return html.match(pattern)?.[1] ?? ""; }
function attribute(tag, name) { return firstMatch(tag, new RegExp(`\\b${name}=["']([^"']+)["']`, "i")); }
function extractTables(html) {
  const tables = [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map((match) => match[0]);
  return tables.map((table) => {
    const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) => {
      const cells = [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => textOnly(cell[1]));
      return cells.filter(Boolean);
    }).filter((row) => row.length);
    const specs = [];
    for (const row of rows) {
      if (row.length >= 2) {
        const label = compact(row[0]).replace(/:$/, ""); const value = compact(row.slice(1).join(" "));
        if (label && value && label.length < 80 && value.length < 180) specs.push({ label, value });
      } else if (row.length === 1 && /^model\s*:/i.test(row[0])) {
        specs.push({ label: "Model", value: row[0].replace(/^model\s*:\s*/i, "") });
      }
    }
    const score = specs.reduce((total, spec) => total + (/(model|power|voltage|pressure|weight|dimension|battery|panel|mast|diameter|depth|capacity|flow|engine|speed)/i.test(spec.label) ? 3 : 1), 0);
    return { specs, score };
  }).filter((table) => table.specs.length >= 2).sort((left, right) => right.score - left.score)[0]?.specs ?? [];
}
function extractModel(specifications, title, heading, index) {
  const modelField = specifications.find((item) => /^model(?:\s*(number|designation))?$/i.test(item.label));
  const fromTable = compact(modelField?.value).replace(/^(model|no\.)\s*[:#-]?\s*/i, "");
  if (fromTable && !nonProductValue.test(fromTable) && fromTable.length <= 64) return fromTable;
  const candidate = `${heading} ${title}`.match(/\b(?:RC[A-Z]{2,}|[A-Z]{2,}[A-Z\d/-]*\d[A-Z\d/-]*|UST[-\s]?\d+[A-Z]*|FY[L]?[-\s]?\d+[A-Z]*)\b/i)?.[0];
  return candidate ? candidate.replace(/\s+/g, "-").toUpperCase() : `Series-${String(index + 1).padStart(3, "0")}`;
}
function filterSpecifications(specifications) {
  const result = []; const seen = new Set();
  for (const spec of specifications) {
    const label = compact(spec.label).replace(/\*+/g, ""); const value = compact(spec.value).replace(/\*+/g, "");
    if (!label || !value || nonProductValue.test(label) || nonProductValue.test(value) || /^(place of origin|brand name|certification|minimum order|delivery time|payment terms|supply ability|competitive advantage)$/i.test(label)) continue;
    const key = label.toLowerCase(); if (seen.has(key)) continue; seen.add(key);
    result.push({ label, value });
    if (result.length === 18) break;
  }
  return result;
}
function extractImages(html, sourceUrl) {
  const source = new URL(sourceUrl);
  const unwrap = (src) => {
    const resolved = new URL(src, source);
    if (/\/_next\/image$/i.test(resolved.pathname) && resolved.searchParams.get("url")) return new URL(resolved.searchParams.get("url"), source).href;
    return resolved.href;
  };
  const candidates = [...html.matchAll(/<img\b[^>]*>/gi)].flatMap((match) => {
    const tag = match[0]; const alt = textOnly(attribute(tag, "alt")); const src = attribute(tag, "src"); const srcSet = attribute(tag, "srcSet") || attribute(tag, "srcset");
    const setSources = srcSet.split(",").map((item) => item.trim().split(/\s+/)[0]).filter(Boolean);
    return [...new Set([src, ...setSources].filter(Boolean))].map((candidate) => ({ alt, url: unwrap(candidate) }));
  }).filter(({ url }) => /\.(jpe?g|png|webp|avif)(?:\?|$)/i.test(url));
  return candidates.filter(({ url }) => !/(logo|icon|language|flag|qr|wechat|whatsapp|facebook|youtube|instagram|linkedin|small\/|loading|bofang)/i.test(url)).sort((left, right) => {
    const score = (image) => (/\/page\//i.test(image.url) ? 5 : 0) + (/\/products?\//i.test(image.url) ? 3 : 0) + (/logo|brand/i.test(image.alt) ? -10 : 0);
    return score(right) - score(left);
  });
}
async function fetchText(url) {
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; COWIN-MACHINE-authorized-catalog/1.0)" }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}
async function downloadImage(image, target) {
  const response = await fetch(image.url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; COWIN-MACHINE-authorized-catalog/1.0)" }, signal: AbortSignal.timeout(30000) });
  const type = response.headers.get("content-type") ?? "";
  const size = Number(response.headers.get("content-length") ?? 0);
  if (!response.ok || !type.startsWith("image/") || size > 8_000_000) throw new Error(`Image unavailable or too large (${response.status})`);
  const data = Buffer.from(await response.arrayBuffer());
  if (data.byteLength < 8_000 || data.byteLength > 8_000_000) throw new Error("Image size failed validation");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}
function slugify(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72); }
function productName(category, model, heading, title) {
  const descriptors = (descriptorRules[category] ?? []).filter(([pattern]) => pattern.test(`${heading} ${title}`)).map(([, label]) => label);
  const descriptor = [...new Set(descriptors)].slice(0, 3).join(" ");
  const categoryName = categoryLabels[category];
  const typeName = descriptor ? `${descriptor} ${categoryName}` : categoryName;
  return model.startsWith("Series-") ? typeName : `${model} ${typeName}`;
}
function independentSummary(category, model) { return `${categoryLabels[category]} configuration based on the ${model} reference. Confirm operating conditions before final selection.`; }
function independentDescription(category, model) { return `This ${categoryLabels[category].toLowerCase()} entry uses the ${model} model reference from the authorized product record. The published configuration should be matched to the installation, material or duty requirements supplied with your inquiry.`; }

const rows = parseCsv(await readFile(auditFile, "utf8")).filter((row) => categoryLabels[row.target_category] && row.source_http_status.startsWith("2"));
await rm(imageRoot, { recursive: true, force: true });
const results = new Array(rows.length);
let cursor = 0;
async function worker() {
  while (cursor < rows.length) {
    const index = cursor; cursor += 1; const row = rows[index]; const category = row.target_category;
    const code = categoryCodes[category]; const sourceUrl = row.source_url_internal_only;
    try {
      const html = await fetchText(sourceUrl);
      const heading = textOnly(firstMatch(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i));
      const title = textOnly(firstMatch(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i)) || row.source_product_name;
      const specifications = filterSpecifications(extractTables(html));
      const model = extractModel(specifications, title, heading, index);
      const slug = `${code}-${slugify(model) || String(index + 1).padStart(3, "0")}-${String(index + 1).padStart(3, "0")}`;
      const image = extractImages(html, sourceUrl).find((candidate) => !/logo|brand/i.test(candidate.alt));
      let heroImage;
      if (image) {
        const extension = (new URL(image.url).pathname.match(/\.(jpe?g|png|webp|avif)$/i)?.[1] ?? "jpg").toLowerCase().replace("jpeg", "jpg");
        const relative = `/images/products/${category}/${slug}.${extension}`;
        try { await downloadImage(image, path.resolve(`public${relative}`)); heroImage = relative; } catch {}
      }
      const cleanedSpecifications = specifications.length ? specifications : [{ label: "Model reference", value: model }, { label: "Configuration", value: "Confirm with your application requirements" }];
      results[index] = {
        id: `cm-${code}-${String(index + 1).padStart(3, "0")}`, slug, name: productName(category, model, heading, title), category,
        shortDescription: independentSummary(category, model), description: independentDescription(category, model), applications: categoryApplications[category],
        keySpecifications: cleanedSpecifications.slice(0, 4), technicalSpecifications: cleanedSpecifications, heroImage, gallery: heroImage ? [{ src: heroImage, alt: `${model} ${categoryLabels[category]} product view` }] : [], status: "Configuration required",
      };
    } catch (error) {
      const model = extractModel([], row.source_product_name, "", index); const slug = `${code}-${slugify(model) || String(index + 1).padStart(3, "0")}-${String(index + 1).padStart(3, "0")}`;
      results[index] = { id: `cm-${code}-${String(index + 1).padStart(3, "0")}`, slug, name: productName(category, model, "", row.source_product_name), category, shortDescription: independentSummary(category, model), description: independentDescription(category, model), applications: categoryApplications[category], keySpecifications: [{ label: "Model reference", value: model }, { label: "Configuration", value: "Confirm with your application requirements" }], technicalSpecifications: [{ label: "Model reference", value: model }, { label: "Technical data", value: "Available on request" }], heroImage: undefined, gallery: [], status: "Configuration required" };
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));
const catalog = results.filter(Boolean);
await writeFile(outputFile, `import type { Product } from "@/types/product";\n\nexport const authorizedCatalogProducts: Product[] = ${JSON.stringify(catalog, null, 2)};\n`, "utf8");
const summary = catalog.reduce((counts, product) => { counts[product.category] = (counts[product.category] ?? 0) + 1; return counts; }, {});
console.log(JSON.stringify({ products: catalog.length, categories: summary, images: catalog.filter((product) => product.heroImage).length }, null, 2));
