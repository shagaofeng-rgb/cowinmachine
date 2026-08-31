import { authorizedCatalogProducts } from "@/lib/authorized-catalog-products";
import type { ProductCategorySlug } from "@/types/product";

export const migrationPublishingEnabled = true;

export const productCategories: { slug: ProductCategorySlug; name: string; summary: string; subcategories: string[] }[] = [
  { slug: "compressed-air-equipment", name: "Air Compressors", summary: "Catalog entries for compressed-air equipment requirements.", subcategories: ["Electric screw air compressors", "Diesel screw air compressors"] },
  { slug: "generator-systems", name: "Generator Systems", summary: "Catalog entries for temporary and project-site power requirements.", subcategories: ["Silent diesel generators", "Open-frame diesel generators"] },
  { slug: "drilling-equipment", name: "Drilling Rigs", summary: "Catalog entries for water, rock and site-preparation drilling requirements.", subcategories: ["Water well drilling rigs", "DTH drilling rigs"] },
  { slug: "drilling-consumables", name: "Drilling Tools & Consumables", summary: "Catalog entries for drilling tooling and replacement requirements.", subcategories: ["Drill bits", "Drill pipes and hammers"] },
  { slug: "mobile-lighting-systems", name: "Solar & Mobile Light Towers", summary: "Catalog entries for remote and temporary worksite lighting requirements.", subcategories: ["Solar light towers", "Hybrid and diesel light towers"] },
  { slug: "magnetic-separators", name: "Magnetic Separators", summary: "Catalog entries for material separation and industrial processing requirements.", subcategories: ["Permanent magnetic separators", "Electromagnetic separators"] },
];

export const products = authorizedCatalogProducts;
export function getCategory(slug: string) { return productCategories.find((category) => category.slug === slug); }
export function getProduct(category: string, slug: string) { return products.find((product) => product.category === category && product.slug === slug); }
