export type ProductCategorySlug =
  | "solar-light-towers"
  | "site-monitoring-trailers"
  | "diesel-light-towers";

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
  status: "Review required";
};
