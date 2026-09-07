import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ContentIndex } from "@/components/content-automation/ContentIndex";
import { getPublishedNewsArticles } from "@/lib/content-automation/storage";
import { getPageCount, newsPerPage, paginateItems, resolvePage } from "@/lib/pagination";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type NewsPageProps = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: NewsPageProps): Promise<Metadata> {
  const articles = await getPublishedNewsArticles();
  const resolution = resolvePage((await searchParams).page, getPageCount(articles.length, newsPerPage));
  const page = resolution.valid ? resolution.page : 1;
  const suffix = page === 1 ? "" : ` - Page ${page}`;
  const path = page === 1 ? "/news" : `/news?page=${page}`;
  const metadata = pageMetadata(
    `News${suffix}`,
    "Source-reviewed industrial equipment and application news from COWIN MACHINE.",
    path,
  );
  return resolution.valid ? metadata : { ...metadata, robots: { index: false, follow: false } };
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const articles = await getPublishedNewsArticles();
  const pageCount = getPageCount(articles.length, newsPerPage);
  const resolution = resolvePage((await searchParams).page, pageCount);
  if (!resolution.valid) notFound();
  if (resolution.shouldRedirect) permanentRedirect(resolution.page === 1 ? "/news" : `/news?page=${resolution.page}`);

  return (
    <ContentIndex
      articles={paginateItems(articles, resolution.page, newsPerPage)}
      totalItems={articles.length}
      currentPage={resolution.page}
      totalPages={pageCount}
      sectionPath="/news"
      kicker="COWIN MACHINE / INDUSTRY NEWS"
      title="News & Industry Developments"
      description="Source-reviewed industry developments connected to equipment applications and buyer decisions."
      emptyTitle="Today’s industry update is being prepared."
      emptyDescription="Source-reviewed industry updates appear here after publication checks finish."
    />
  );
}
