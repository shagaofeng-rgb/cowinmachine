import type { MetadataRoute } from "next";
import {
  getPublishedBlogArticles,
  getPublishedNewsArticles,
} from "@/lib/content-automation/storage";
import { getProductDetailProfile } from "@/lib/product-detail-profiles";
import { productCategories, products } from "@/lib/products";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/products",
    "/solutions",
    "/solutions/construction-sites",
    "/solutions/mineral-processing-recycling",
    "/about",
    "/contact",
    "/request-a-quote",
    "/news",
    "/blog",
  ];
  const [newsArticles, blogArticles] = await Promise.all([
    getPublishedNewsArticles(),
    getPublishedBlogArticles(),
  ]);
  const indexableProducts = products.filter(
    (product) => getProductDetailProfile(product).publicationState === "full-technical-content",
  );

  return [
    ...staticRoutes.map((path) => ({ url: siteConfig.siteUrl + path })),
    ...productCategories.map((category) => ({
      url: siteConfig.siteUrl + "/products/" + category.slug,
    })),
    ...indexableProducts.map((product) => ({
      url: siteConfig.siteUrl + "/products/" + product.category + "/" + product.slug,
    })),
    ...newsArticles.map((article) => ({
      url: siteConfig.siteUrl + "/news/" + article.slug,
      lastModified: new Date(article.updatedAt),
    })),
    ...blogArticles.map((article) => ({
      url: siteConfig.siteUrl + "/blog/" + article.slug,
      lastModified: new Date(article.updatedAt),
    })),
  ];
}
