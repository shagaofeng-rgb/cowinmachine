import { readFile, writeFile } from "node:fs/promises";

const categoryLabels = {
  "compressed-air-equipment": "Air Compressors",
  "generator-systems": "Generator Systems",
  "drilling-equipment": "Drilling Rigs",
  "drilling-consumables": "Drilling Tools & Consumables",
  "mobile-lighting-systems": "Solar & Mobile Light Towers",
  "magnetic-separators": "Magnetic Separators",
};
const categoryCopy = {
  "compressed-air-equipment": "Industrial compressed-air equipment for project and plant requirement discussions.",
  "generator-systems": "Generator equipment for temporary and project-site power requirement discussions.",
  "drilling-equipment": "Drilling equipment for water, rock and site-preparation requirement discussions.",
  "drilling-consumables": "Drilling tools and consumables for configuration and replacement requirement discussions.",
  "mobile-lighting-systems": "Mobile lighting equipment for remote and temporary worksite requirement discussions.",
  "magnetic-separators": "Material separation equipment for process and industrial application requirement discussions.",
};
const parseCsv = (text) => {
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) { const char = text[index]; const next = text[index + 1]; if (char === '"' && quoted && next === '"') { field += char; index += 1; } else if (char === '"') quoted = !quoted; else if (char === ',' && !quoted) { row.push(field); field = ""; } else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && next === '\n') index += 1; row.push(field); if (row.length > 1) rows.push(row); row = []; field = ""; } else field += char; }
  if (field || row.length) { row.push(field); rows.push(row); } const [header, ...records] = rows; return records.map((record) => Object.fromEntries(header.map((key, index) => [key, record[index] ?? ""])));
};
const modelFor = (title, slug, index) => (title.match(/\b(?:[A-Z]{2,}[\d-][A-Z\d/-]*|UST\d+[A-Z]*|FY\d+|KH\d+)\b/)?.[0] ?? slug.match(/(?:^|[-/])([a-z]{1,5}\d+[a-z\d-]*)/i)?.[1]?.toUpperCase() ?? `CM-${String(index + 1).padStart(3, "0")}`);
const categoryCode = (category) => ({ "compressed-air-equipment": "air", "generator-systems": "gen", "drilling-equipment": "rig", "drilling-consumables": "tool", "mobile-lighting-systems": "tower", "magnetic-separators": "mag" })[category];
const rows = parseCsv(await readFile("docs/migration/product-master-audit.csv", "utf8"));
const products = rows.filter((row) => categoryLabels[row.target_category]).map((row, index) => { const category = row.target_category; const model = modelFor(row.source_product_name, row.source_slug_internal_only, index); const label = categoryLabels[category]; return { id: `cm-${categoryCode(category)}-${String(index + 1).padStart(3, "0")}`, slug: `cm-${categoryCode(category)}-${String(index + 1).padStart(3, "0")}`, name: `${model} ${label}`, category, shortDescription: categoryCopy[category], description: `COWIN MACHINE catalog entry for ${model}. Confirm the current application conditions and approved technical record before selection.`, applications: ["Application review required before final configuration."], keySpecifications: [{ label: "Model reference", value: model }, { label: "Technical record", value: "Available on request" }], technicalSpecifications: [{ label: "Model reference", value: model }, { label: "Verification status", value: "Authorized source record — configuration confirmation required" }], status: "Review required" }; });
const output = `import type { Product } from "@/types/product";\n\nexport const authorizedCatalogProducts: Product[] = ${JSON.stringify(products, null, 2)};\n`;
await writeFile("lib/authorized-catalog-products.ts", output, "utf8");
console.log(`Generated ${products.length} authorized catalog entries.`);
