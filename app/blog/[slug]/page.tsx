import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentArticlePage } from "@/components/content-automation/ContentArticlePage";
import { getArticleChannel, getPublishedArticle, getPublishedBlogArticles } from "@/lib/content-automation/storage";

export const dynamic = "force-dynamic";

async function getArticle(slug: string) {
  const article = await getPublishedArticle(slug);
  return article && getArticleChannel(article) === "blog" ? article : undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  if (!article) return { robots: { index: false, follow: false } };
  const url = "/blog/" + article.slug;
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      url,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: article.image ? [{ url: article.image.src, alt: article.image.alt }] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  const articles = await getPublishedBlogArticles();
  const currentIndex = articles.findIndex((item) => item.slug === slug);
  const relatedArticles = currentIndex < 0 ? [] : [articles[currentIndex - 1], articles[currentIndex + 1]].filter((item) => item !== undefined);
  return <ContentArticlePage article={article} relatedArticles={relatedArticles} sectionName="Blog" sectionPath="/blog" />;
}
