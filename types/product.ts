export type ProductCategorySlug =
  | "compressed-air-equipment"
  | "generator-systems"
  | "drilling-equipment"
  | "drilling-consumables"
  | "mobile-lighting-systems"
  | "magnetic-separators";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategorySlug;
  shortDescription: string;
  description: string;
  applications: string[];
  keySpecifications: { label: string; value: string }[];
  technicalSpecifications: { label: string; value: string }[];
  heroImage?: string;
  gallery: { src: string; alt: string }[];
  status: "Configuration required";
};

export type ProductEvidence = {
  field: string;
  sourceUrl: string;
  sourceName: string;
  accessedAt: string;
  confidence: "high" | "medium" | "needs-owner-confirmation";
};

export type ProductContent = {
  overview: string;
  workingPrinciple: string;
  applications: string[];
  selectionGuide: string[];
  benefits: string[];
  maintenanceAndSafety: string[];
  faqs: Array<{ question: string; answer: string }>;
  citationsInternalOnly: ProductEvidence[];
};

export type ProductDetailProfile = {
  canonicalId: string | null;
  model: string | null;
  publicationState: "full-technical-content" | "configuration-review";
  reviewReason: string | null;
  imageStatus: "Authorized project image available" | "Image requires owner confirmation" | "Approved product image pending";
  content: ProductContent;
  specifications: { label: string; value: string }[];
  standardConfiguration: string[];
  optionalConfiguration: string[];
  relatedProductSlugs: string[];
};
