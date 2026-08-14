import type { Product, ProductCategorySlug } from "@/types/product";

export const productCategories: {
  slug: ProductCategorySlug;
  name: string;
  summary: string;
  subcategories: string[];
}[] = [
  {
    slug: "compressed-air-equipment",
    name: "Compressed-Air Equipment",
    summary: "Independent product entries for compressed-air equipment discussions. Technical and media information is published only after verification.",
    subcategories: ["Stationary equipment", "Portable equipment"],
  },
  {
    slug: "generator-systems",
    name: "Generator Systems",
    summary: "Independent product entries for on-site power discussions. Product capabilities require verified documentation before publication.",
    subcategories: ["Portable power", "Project-site power"],
  },
  {
    slug: "drilling-equipment",
    name: "Drilling Equipment",
    summary: "Independent product entries for drilling equipment discussions. No model, performance or availability claim is published before review.",
    subcategories: ["Water well work", "Surface drilling"],
  },
  {
    slug: "drilling-consumables",
    name: "Drilling Consumables",
    summary: "Independent product entries for drilling consumable discussions. Configuration information remains review-gated until verified.",
    subcategories: ["Tooling", "Wear components"],
  },
  {
    slug: "mobile-lighting-systems",
    name: "Mobile Lighting Systems",
    summary: "Independent product entries for temporary site lighting discussions. Deployment information remains review-gated until verified.",
    subcategories: ["Towable lighting", "Site monitoring"],
  },
];

function reviewProduct(slug: string, name: string, category: ProductCategorySlug, focus: string): Product {
  return {
    id: slug,
    slug,
    name,
    category,
    shortDescription: `A cowinmachine configuration review entry for ${focus}. No model, output, runtime or component claim is published until approved evidence is received.`,
    description: "REVIEW REQUIRED: Verified specifications, authorized images, handling information and technical documentation must be approved before publication.",
    applications: ["REVIEW REQUIRED: Confirm site conditions and the project requirement before describing applicable use."],
    keySpecifications: [
      { label: "Configuration", value: "REVIEW REQUIRED" },
      { label: "Project conditions", value: "REVIEW REQUIRED" },
      { label: "Technical data", value: "REVIEW REQUIRED" },
    ],
    technicalSpecifications: [{ label: "Verified specification record", value: "REVIEW REQUIRED" }],
    status: "Review required",
  };
}

export const products: Product[] = [
  reviewProduct("compressed-air-review", "Compressed-Air Equipment Review", "compressed-air-equipment", "compressed-air equipment"),
  reviewProduct("generator-system-review", "Generator System Review", "generator-systems", "project-site power equipment"),
  reviewProduct("drilling-equipment-review", "Drilling Equipment Review", "drilling-equipment", "drilling equipment"),
  reviewProduct("drilling-consumables-review", "Drilling Consumables Review", "drilling-consumables", "drilling consumables"),
  reviewProduct("mobile-lighting-review", "Mobile Lighting Review", "mobile-lighting-systems", "temporary site lighting"),
];

export function getCategory(slug: string) {
  return productCategories.find((category) => category.slug === slug);
}

export function getProduct(category: string, slug: string) {
  return products.find((product) => product.category === category && product.slug === slug);
}
