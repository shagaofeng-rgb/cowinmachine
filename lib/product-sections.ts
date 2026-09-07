import type { Product, ProductDetailProfile } from "@/types/product";

export const productSections = [
  { slug: "overview", label: "Overview", heading: "Product Overview" },
  { slug: "applications", label: "Applications", heading: "Applications & Selection" },
  { slug: "specifications", label: "Specifications", heading: "Technical Specifications" },
  { slug: "configuration", label: "Configuration", heading: "Equipment Configuration" },
  { slug: "maintenance", label: "Maintenance", heading: "Operation, Maintenance & Safety" },
  { slug: "faq", label: "FAQ", heading: "Product FAQ" },
  { slug: "related-equipment", label: "Related Equipment", heading: "Related Products & Compatible Equipment" },
] as const;

export type ProductSectionSlug = typeof productSections[number]["slug"];

export const nestedProductSections = productSections.filter((section) => section.slug !== "overview");

export function isProductSectionSlug(value: string): value is ProductSectionSlug {
  return productSections.some((section) => section.slug === value);
}

export function getProductSection(slug: ProductSectionSlug) {
  return productSections.find((section) => section.slug === slug) ?? productSections[0];
}

export function productPath(product: Pick<Product, "category" | "slug">, section: ProductSectionSlug = "overview") {
  const basePath = `/products/${product.category}/${product.slug}`;
  return section === "overview" ? basePath : `${basePath}/${section}`;
}

export function productSectionDescription(product: Product, profile: ProductDetailProfile, section: ProductSectionSlug) {
  const model = profile.model ? `${product.name} (${profile.model})` : product.name;
  const descriptions: Record<ProductSectionSlug, string> = {
    overview: product.shortDescription,
    applications: `Review typical applications and the project inputs used to select ${model}.`,
    specifications: `Review published technical specifications for ${model}. Final configuration remains subject to application review.`,
    configuration: `Review the standard and optional configuration information available for ${model}.`,
    maintenance: `Review operation, maintenance and safety considerations for ${model}.`,
    faq: `Read answers to common technical and procurement questions about ${model}.`,
    "related-equipment": `Compare related and compatible equipment for projects considering ${model}.`,
  };
  return descriptions[section];
}
