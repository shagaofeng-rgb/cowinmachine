import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ContentArticlePage } from "@/components/content-automation/ContentArticlePage";
import {
  getArticleChannel,
  getPublishedArticles,
} from "@/lib/content-automation/storage";

export const dynamic = "force-dynamic";

async function getArticle(slug: string) {
  return (await getPublishedArticles()).find((article) => article.slug === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  if (!article) return { robots: { index: false, follow: false } };
  const isBlog = getArticleChannel(article) === "blog";
  const url = (isBlog ? "/blog/" : "/news/") + article.slug;
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
    robots: { index: !isBlog, follow: true },
  };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = await getArticle((await params).slug);
  if (!article) notFound();
  if (getArticleChannel(article) === "blog") redirect("/blog/" + article.slug);
  return <ContentArticlePage article={article} sectionName="News" sectionPath="/news" />;
}
