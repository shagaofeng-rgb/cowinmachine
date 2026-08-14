import type { Product, ProductCategorySlug } from "@/types/product";

export const productCategories: {
  slug: ProductCategorySlug;
  name: string;
  summary: string;
  subcategories: string[];
}[] = [{
  slug: "magnetic-separators",
  name: "Magnetic Separators",
  summary: "Independent magnetic separation configuration entries. Product facts are published only after verification.",
  subcategories: ["Conveyor separation", "Dry material separation", "Wet process separation", "Process filtration"],
}];

function reviewProduct(slug: string, name: string, focus: string): Product {
  return {
    id: slug,
    slug,
    name,
    category: "magnetic-separators",
    shortDescription: `A configuration review entry for ${focus}. No model, performance or material claim is published until approved evidence is received.`,
    description: "REVIEW REQUIRED: Verified specifications, images, handling information and technical documentation must be approved before publication.",
    applications: ["REVIEW REQUIRED: Confirm the process material and installation conditions before describing applicable use."],
    keySpecifications: [
      { label: "Configuration", value: "REVIEW REQUIRED" },
      { label: "Operating conditions", value: "REVIEW REQUIRED" },
      { label: "Technical data", value: "REVIEW REQUIRED" },
    ],
    technicalSpecifications: [{ label: "Verified specification record", value: "REVIEW REQUIRED" }],
    status: "Review required",
  };
}

export const products: Product[] = [
  reviewProduct("conveyor-separation-review", "Conveyor Separation Review", "conveyor-line magnetic separation"),
  reviewProduct("dry-material-separation-review", "Dry Material Separation Review", "dry bulk material separation"),
  reviewProduct("wet-process-separation-review", "Wet Process Separation Review", "wet-process magnetic separation"),
  reviewProduct("process-filtration-review", "Process Filtration Review", "process-line magnetic filtration"),
];

export function getCategory(slug: string) { return productCategories.find((category) => category.slug === slug); }
export function getProduct(category: string, slug: string) { return products.find((product) => product.category === category && product.slug === slug); }
