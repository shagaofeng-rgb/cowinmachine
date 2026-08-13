export type ProductCategorySlug =
  | "air-compressors"
  | "drilling-rigs"
  | "solar-light-towers"
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
  status: "Replaceable placeholder";
};
