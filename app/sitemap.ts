import type { MetadataRoute } from "next";
import { getPublishedBlogArticles, getPublishedNewsArticles } from "@/lib/content-automation/storage";
import { blogPerPage, getPageCount, newsPerPage, productsPerPage } from "@/lib/pagination";
import { isCanonicalProductRoute } from "@/lib/product-canonical";
import { getProductDetailProfile } from "@/lib/product-detail-profiles";
import { nestedProductSections, productPath } from "@/lib/product-sections";
import { productCategories, products } from "@/lib/products";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

function paginatedPaths(basePath: string, itemCount: number, pageSize: number) {
  const totalPages = getPageCount(itemCount, pageSize);
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => `${basePath}?page=${index + 2}`);
}

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
  const canonicalProducts = products.filter(isCanonicalProductRoute);
  const indexableProducts = canonicalProducts.filter(
    (product) => getProductDetailProfile(product).publicationState === "full-technical-content",
  );
  const catalogPagination = paginatedPaths("/products", canonicalProducts.length, productsPerPage);
  const categoryPagination = productCategories.flatMap((category) => {
    const itemCount = canonicalProducts.filter((product) => product.category === category.slug).length;
    return paginatedPaths(`/products/${category.slug}`, itemCount, productsPerPage);
  });
  const newsPagination = paginatedPaths("/news", newsArticles.length, newsPerPage);
  const blogPagination = paginatedPaths("/blog", blogArticles.length, blogPerPage);

  return [
    ...staticRoutes.map((path) => ({ url: siteConfig.siteUrl + path })),
    ...productCategories.map((category) => ({ url: `${siteConfig.siteUrl}/products/${category.slug}` })),
    ...[...catalogPagination, ...categoryPagination, ...newsPagination, ...blogPagination].map((path) => ({ url: siteConfig.siteUrl + path })),
    ...indexableProducts.map((product) => ({ url: `${siteConfig.siteUrl}${productPath(product)}` })),
    ...indexableProducts.flatMap((product) => nestedProductSections.map((section) => ({
      url: `${siteConfig.siteUrl}${productPath(product, section.slug)}`,
    }))),
    ...newsArticles.map((article) => ({
      url: `${siteConfig.siteUrl}/news/${article.slug}`,
      lastModified: new Date(article.updatedAt),
    })),
    ...blogArticles.map((article) => ({
      url: `${siteConfig.siteUrl}/blog/${article.slug}`,
      lastModified: new Date(article.updatedAt),
    })),
  ];
}
