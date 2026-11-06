import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentArticlePage } from "@/components/content-automation/ContentArticlePage";
import { getPublishedBlogArticles } from "@/lib/content-automation/storage";

export const dynamic = "force-dynamic";

async function getArticle(slug: string) {
  return (await getPublishedBlogArticles()).find((article) => article.slug === slug);
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
  const articles = await getPublishedBlogArticles();
  const currentIndex = articles.findIndex((item) => item.slug === slug);
  const article = articles[currentIndex];
  if (!article) notFound();
  const relatedArticles = [articles[currentIndex - 1], articles[currentIndex + 1]].filter((item) => item !== undefined);
  return <ContentArticlePage article={article} relatedArticles={relatedArticles} sectionName="Blog" sectionPath="/blog" />;
}
