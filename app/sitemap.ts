import type { MetadataRoute } from "next";
import { productCategories, products } from "@/lib/products";
import { siteConfig } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap { const staticRoutes = ["", "/products", "/solutions", "/about", "/factory-quality", "/cases", "/resources", "/contact", "/request-a-quote"]; return [...staticRoutes.map((path) => ({ url: `${siteConfig.siteUrl}${path}`, lastModified: new Date() })), ...productCategories.map((category) => ({ url: `${siteConfig.siteUrl}/products/${category.slug}`, lastModified: new Date() })), ...products.map((product) => ({ url: `${siteConfig.siteUrl}/products/${product.category}/${product.slug}`, lastModified: new Date() }))]; }
