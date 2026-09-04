import { siteConfig } from "@/lib/site";
import type { ContentArticle } from "@/types/content-automation";

const inlineJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

function extractFaqs(body: string) {
  const section = body.split("## FAQ")[1]?.split("## CTA")[0] ?? "";
  const lines = section.split("\n");
  return lines.flatMap((line, index) => {
    if (!line.startsWith("### ")) return [];
    const answer = lines.slice(index + 1).find((value) => value.trim() && !value.startsWith("### "))?.trim();
    return answer ? [{ "@type": "Question", name: line.slice(4), acceptedAnswer: { "@type": "Answer", text: answer } }] : [];
  });
}

function articleChannel(article: ContentArticle) {
  if (article.channel) return article.channel;
  return article.productFamily === "external-news" || article.productFamily === "external-blog" ? "blog" : "news";
}

export function ArticleStructuredData({ article }: { article: ContentArticle }) {
  const channel = articleChannel(article);
  const sectionName = channel === "blog" ? "Blog" : "News";
  const url = siteConfig.siteUrl + "/" + channel + "/" + article.slug;
  const faq = extractFaqs(article.body);
  const schemas = [
    { "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.summary, image: article.image ? siteConfig.siteUrl + article.image.src : undefined, datePublished: article.publishedAt, dateModified: article.updatedAt, mainEntityOfPage: url, publisher: { "@type": "Organization", name: siteConfig.brandName, url: siteConfig.siteUrl, logo: { "@type": "ImageObject", url: siteConfig.siteUrl + "/images/cowin-machine-logo.jpg" } }, citation: article.sources.map((source) => source.url) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: siteConfig.siteUrl }, { "@type": "ListItem", position: 2, name: sectionName, item: siteConfig.siteUrl + "/" + channel }, { "@type": "ListItem", position: 3, name: article.title, item: url }] },
    ...(faq.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq }] : []),
  ];
  return <>{schemas.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: inlineJson(schema) }} />)}</>;
}
