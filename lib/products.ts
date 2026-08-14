import type { Product, ProductCategorySlug } from "@/types/product";

export const productCategories: {
  slug: ProductCategorySlug;
  name: string;
  summary: string;
  subcategories: string[];
}[] = [
  {
    slug: "solar-light-towers",
    name: "Solar Light Towers",
    summary: "Independent product entries for off-grid lighting discussions. Technical and media information is published only after verification.",
    subcategories: ["Towable lighting", "Fixed-site lighting"],
  },
  {
    slug: "site-monitoring-trailers",
    name: "Site Monitoring Trailers",
    summary: "Independent product entries for temporary site monitoring discussions. Product capabilities require verified documentation before publication.",
    subcategories: ["Towable monitoring", "Fixed-site monitoring"],
  },
  {
    slug: "diesel-light-towers",
    name: "Diesel Light Towers",
    summary: "Independent product entries for engine-powered lighting discussions. No performance, model or availability claim is published before review.",
    subcategories: ["Towable lighting", "Industrial lighting"],
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
    applications: ["REVIEW REQUIRED: Confirm the site conditions and deployment requirement before describing applicable use."],
    keySpecifications: [
      { label: "Configuration", value: "REVIEW REQUIRED" },
      { label: "Site conditions", value: "REVIEW REQUIRED" },
      { label: "Technical data", value: "REVIEW REQUIRED" },
    ],
    technicalSpecifications: [{ label: "Verified specification record", value: "REVIEW REQUIRED" }],
    status: "Review required",
  };
}

export const products: Product[] = [
  reviewProduct("solar-lighting-review", "Solar Lighting Review", "solar-light-towers", "temporary or off-grid lighting"),
  reviewProduct("site-monitoring-review", "Site Monitoring Review", "site-monitoring-trailers", "temporary site monitoring"),
  reviewProduct("diesel-lighting-review", "Diesel Lighting Review", "diesel-light-towers", "engine-powered site lighting"),
];

export function getCategory(slug: string) {
  return productCategories.find((category) => category.slug === slug);
}

export function getProduct(category: string, slug: string) {
  return products.find((product) => product.category === category && product.slug === slug);
}
