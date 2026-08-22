import type { MetadataRoute } from "next";
import { getPublishedArticles } from "@/lib/content-automation/storage";
import { getProductDetailProfile } from "@/lib/product-detail-profiles";
import { productCategories, products } from "@/lib/products";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/products",
    "/about",
    "/factory-quality",
    "/cases",
    "/contact",
    "/request-a-quote",
    "/news",
    "/blog",
  ];
  const articles = await getPublishedArticles();
  const indexableProducts = products.filter(
    (product) => getProductDetailProfile(product).publicationState === "full-technical-content",
  );

  return [
    ...staticRoutes.map((path) => ({ url: `${siteConfig.siteUrl}${path}` })),
    ...productCategories.map((category) => ({
      url: `${siteConfig.siteUrl}/products/${category.slug}`,
    })),
    ...indexableProducts.map((product) => ({
      url: `${siteConfig.siteUrl}/products/${product.category}/${product.slug}`,
    })),
    ...articles.map((article) => ({
      url: `${siteConfig.siteUrl}/news/${article.slug}`,
      lastModified: new Date(article.updatedAt),
    })),
  ];
}
