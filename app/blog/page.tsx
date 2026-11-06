import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ContentIndex } from "@/components/content-automation/ContentIndex";
import { getPublishedBlogArticles } from "@/lib/content-automation/storage";
import { blogPerPage, getPageCount, paginateItems, resolvePage } from "@/lib/pagination";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type BlogPageProps = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const articles = await getPublishedBlogArticles();
  const resolution = resolvePage((await searchParams).page, getPageCount(articles.length, blogPerPage));
  const page = resolution.valid ? resolution.page : 1;
  const suffix = page === 1 ? "" : ` - Page ${page}`;
  const path = page === 1 ? "/blog" : `/blog?page=${page}`;
  const metadata = pageMetadata(
    `Blog${suffix}`,
    "Practical equipment-selection notes and application guidance from COWIN MACHINE.",
    path,
  );
  return resolution.valid ? metadata : { ...metadata, robots: { index: false, follow: false } };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const articles = await getPublishedBlogArticles();
  const pageCount = getPageCount(articles.length, blogPerPage);
  const resolution = resolvePage((await searchParams).page, pageCount);
  if (!resolution.valid) notFound();
  if (resolution.shouldRedirect) permanentRedirect(resolution.page === 1 ? "/blog" : `/blog?page=${resolution.page}`);

  return (
    <ContentIndex
      articles={paginateItems(articles, resolution.page, blogPerPage)}
      totalItems={articles.length}
      currentPage={resolution.page}
      totalPages={pageCount}
      sectionPath="/blog"
      kicker="COWIN MACHINE Blog"
      title="Equipment Guides"
      description="Practical notes for preparing equipment requirements, comparing configurations and planning technical inquiries."
      emptyTitle="No equipment guides published yet"
      emptyDescription="Browse the equipment catalog or contact our team for selection guidance."
    />
  );
}
