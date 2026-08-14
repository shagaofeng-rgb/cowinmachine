import type { MetadataRoute } from "next";
import { getPublishedArticles } from "@/lib/content-automation/storage";
import { productCategories, products } from "@/lib/products";
import { siteConfig } from "@/lib/site";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { const staticRoutes = ["", "/products", "/about", "/factory-quality", "/cases", "/contact", "/request-a-quote", "/news"]; const articles = await getPublishedArticles(); return [...staticRoutes.map((path) => ({ url: `${siteConfig.siteUrl}${path}`, lastModified: new Date() })), ...productCategories.map((category) => ({ url: `${siteConfig.siteUrl}/products/${category.slug}`, lastModified: new Date() })), ...products.map((product) => ({ url: `${siteConfig.siteUrl}/products/${product.category}/${product.slug}`, lastModified: new Date() })), ...articles.map((article) => ({ url: `${siteConfig.siteUrl}/news/${article.slug}`, lastModified: new Date(article.updatedAt) }))]; }
