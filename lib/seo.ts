import type { Article, Product } from "./db";

export function siteUrl(path = "") {
  return `${(process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "")}${path}`;
}

export function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.english_name,
    image: product.image_url,
    sku: product.sku,
    description: product.summary,
    category: product.category_name,
    brand: { "@type": "Brand", name: "Lianteng Packaging" },
    url: siteUrl(`/products/${product.slug}`),
  };
}

export function articleJsonLd(kind: "NewsArticle" | "BlogPosting", article: Article, products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": kind,
    headline: article.title,
    description: article.excerpt,
    image: [article.cover_image_url],
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: { "@type": "Organization", name: article.author_name || "Lianteng Editorial" },
    publisher: { "@type": "Organization", name: "Wenzhou Lianteng Packaging Machinery Co., LTD" },
    mainEntityOfPage: siteUrl(kind === "NewsArticle" ? `/news/${article.slug}` : `/blog/${article.slug}`),
    keywords: article.key_takeaways,
    about: products.map((product) => product.english_name),
    mentions: products.map((product) => ({ "@type": "Product", name: product.english_name, url: siteUrl(`/products/${product.slug}`) })),
  };
}
