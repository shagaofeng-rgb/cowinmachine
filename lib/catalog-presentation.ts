import { getProductDetailProfile } from "@/lib/product-detail-profiles";
import { getPageCount, paginateItems, resolvePage } from "@/lib/pagination";
import { isCanonicalProductRoute } from "@/lib/product-canonical";
import { products } from "@/lib/products";
import type { Product, ProductCategorySlug, ProductDetailProfile } from "@/types/product";

export const catalogProducts = products.filter(isCanonicalProductRoute);

const familyPresentation = {
  "compressed-air-equipment": {
    summary: "Electric and diesel screw compressors for industrial air supply, field work and drilling support.",
    selection: "Start with pressure at the point of use, air demand and available power.",
    fields: ["Working pressure", "Air delivery / FAD", "Power source"],
  },
  "generator-systems": {
    summary: "Silent and open-frame generator systems for temporary power and project-site loads.",
    selection: "Review the load schedule, operating duty, voltage and frequency together.",
    fields: ["Rated power", "Frequency", "Voltage", "Standby power"],
  },
  "drilling-equipment": {
    summary: "Water well and down-the-hole drilling rigs for ground and access conditions that vary by site.",
    selection: "Start with the formation, hole diameter, target depth and drilling method.",
    fields: ["Hole diameter", "Drilling depth", "Drilling method"],
  },
  "drilling-consumables": {
    summary: "Drill bits, pipes, hammers and tooling for project-specific drilling assemblies.",
    selection: "Confirm the hammer or rock drill interface, diameter and thread before selecting tooling.",
    fields: ["Bit diameter", "Thread", "Shank type", "Compatible hammer or rock drill"],
  },
  "mobile-lighting-systems": {
    summary: "Solar, hybrid and diesel light towers for temporary lighting and remote operations.",
    selection: "Share the hours of use, coverage area and energy source for the jobsite.",
    fields: ["Mast height", "Autonomy", "Lighting power", "Light type"],
  },
  "magnetic-separators": {
    summary: "Permanent and electromagnetic separators for conveyor protection and material processing.",
    selection: "Review the feed material, belt width, burden depth and suspension height.",
    fields: ["Suitable belt width", "Suspension height", "Magnet type"],
  },
} satisfies Record<ProductCategorySlug, { summary: string; selection: string; fields: string[] }>;

export function getFamilyPresentation(family: ProductCategorySlug) {
  return familyPresentation[family];
}

const textEntities: Record<string, string> = {
  "&#x27;": "'",
  "&Prime;": "\u2033",
  "&sup3;": "\u00b3",
  "&plusmn;": "\u00b1",
  "&phi;": "\u03c6",
  "&Phi;": "\u03a6",
};

export function publishedSpecifications(profile: ProductDetailProfile) {
  if (profile.publicationState !== "full-technical-content") return [];
  return profile.specifications.flatMap(({ label, value }) => {
    const display = value.trim();
    if (!display || /^(?:configuration subject to application review\.?|can be as local demand)$/i.test(display)) return [];
    // Some catalog imports omit all dimension separators; do not infer the individual values.
    if (label === "Dimensions" && /^\d{6,}\s*(?:mm|cm|m)?$/i.test(display)) return [];
    return [{ label, value: display.replace(/&#x27;|&(?:Prime|sup3|plusmn|phi|Phi);/g, (entity) => textEntities[entity]) }];
  });
}

export function quickSpecifications(family: ProductCategorySlug, profile: ProductDetailProfile, limit: number) {
  const values = new Map(publishedSpecifications(profile).map((item) => [item.label, item.value]));
  return familyPresentation[family].fields.flatMap((label) => {
    const value = values.get(label);
    return value ? [{ label, value }] : [];
  }).slice(0, limit);
}

export function specificationEquivalent(label: string, value: string) {
  const simple = /^(\d+(?:\.\d+)?)\s*(MPa|bar|m(?:\u00b3|3)\/min|mm|m)$/i.exec(value);
  if (!simple) return null;
  const amount = Number(simple[1]);
  const unit = simple[2].toLowerCase();
  const format = (number: number) => new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(number);
  if (/pressure/i.test(label) && (unit === "mpa" || unit === "bar")) return `Approx. ${format(amount * (unit === "mpa" ? 145.0377 : 14.50377))} psi`;
  if (/air delivery|fad/i.test(label) && /\/min$/.test(unit)) return `Approx. ${format(amount * 35.3147)} cfm`;
  if (/diameter|belt width/i.test(label) && unit === "mm") return `Approx. ${format(amount / 25.4)} in`;
  if (/depth|mast height/i.test(label) && unit === "m") return `Approx. ${format(amount / 0.3048)} ft`;
  return null;
}

export function trimRepeatedReviewNote(value: string) {
  return value.replace(/\s+For the [^.]+ record, the review should document the actual application, site interfaces and operating sequence before any configuration is confirmed\.$/, "");
}

export function readCatalogSearch(value: string | string[] | undefined) {
  return (typeof value === "string" ? value : "").slice(0, 100).trim().replace(/\s+/g, " ");
}

function searchWords(value: string) {
  return value.normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

export function filterCatalogProducts(entries: Product[], search: string) {
  if (!search) return entries;
  const words = searchWords(search);
  if (!words.length) return [];
  const compact = words.join("");
  return entries.filter((product) => {
    const model = getProductDetailProfile(product).model ?? "";
    const fields = searchWords(`${product.name} ${model} ${product.slug}`);
    return fields.join("").includes(compact) || words.every((word) => fields.some((field) => field.includes(word)));
  });
}

export type CatalogParams = { page?: string | string[]; q?: string | string[] };

export function catalogHref(basePath: string, page: number, search: string) {
  const query = new URLSearchParams();
  if (search) query.set("q", search);
  if (page > 1) query.set("page", String(page));
  return query.size ? `${basePath}?${query}` : basePath;
}

export function resolveCatalog(entries: Product[], params: CatalogParams) {
  const search = readCatalogSearch(params.q);
  const results = filterCatalogProducts(entries, search);
  const pageCount = getPageCount(results.length);
  const resolution = resolvePage(typeof params.page === "string" ? params.page : undefined, pageCount);
  return {
    search,
    pageCount,
    resolution,
    total: results.length,
    products: paginateItems(results, resolution.page),
  };
}
