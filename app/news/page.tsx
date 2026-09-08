import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ContentIndex } from "@/components/content-automation/ContentIndex";
import { getPublishedNewsArticles } from "@/lib/content-automation/storage";
import { getPageCount, newsPerPage, paginateItems, resolvePage } from "@/lib/pagination";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type NewsPageProps = { searchParams: Promise<{ page?: string; industry?: string }> };

function getIndustryFilters(articles: Awaited<ReturnType<typeof getPublishedNewsArticles>>) {
  const counts = new Map<string, number>();
  for (const article of articles) {
    const label = article.industry.trim();
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([firstLabel, firstCount], [secondLabel, secondCount]) => secondCount - firstCount || firstLabel.localeCompare(secondLabel))
    .map(([label, count]) => ({ label, count }));
}

export async function generateMetadata({ searchParams }: NewsPageProps): Promise<Metadata> {
  const query = await searchParams;
  const articles = await getPublishedNewsArticles();
  const activeIndustry = query.industry?.trim();
  const filteredArticles = activeIndustry ? articles.filter((article) => article.industry === activeIndustry) : articles;
  const resolution = resolvePage(query.page, getPageCount(filteredArticles.length, newsPerPage));
  const page = resolution.valid ? resolution.page : 1;
  const suffix = page === 1 ? "" : ` - Page ${page}`;
  const params = new URLSearchParams();
  if (activeIndustry) params.set("industry", activeIndustry);
  if (page > 1) params.set("page", String(page));
  const path = params.size ? `/news?${params}` : "/news";
  const metadata = pageMetadata(
    `${activeIndustry ? `${activeIndustry} News` : "News"}${suffix}`,
    "Source-reviewed industrial equipment and application news from COWIN MACHINE.",
    path,
  );
  return resolution.valid && !activeIndustry ? metadata : { ...metadata, robots: { index: false, follow: false } };
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const query = await searchParams;
  const articles = await getPublishedNewsArticles();
  const activeIndustry = query.industry?.trim();
  const filteredArticles = activeIndustry ? articles.filter((article) => article.industry === activeIndustry) : articles;
  const pageCount = getPageCount(filteredArticles.length, newsPerPage);
  const resolution = resolvePage(query.page, pageCount);
  if (!resolution.valid) notFound();
  if (resolution.shouldRedirect) {
    const params = new URLSearchParams();
    if (activeIndustry) params.set("industry", activeIndustry);
    if (resolution.page > 1) params.set("page", String(resolution.page));
    permanentRedirect(params.size ? `/news?${params}` : "/news");
  }

  return (
    <ContentIndex
      articles={paginateItems(filteredArticles, resolution.page, newsPerPage)}
      totalItems={filteredArticles.length}
      currentPage={resolution.page}
      totalPages={pageCount}
      sectionPath="/news"
      industryFilters={getIndustryFilters(articles)}
      activeIndustry={activeIndustry}
      kicker="COWIN MACHINE / INDUSTRY NEWS"
      title="News & Industry Developments"
      description="Source-reviewed industry developments connected to equipment applications and buyer decisions."
      emptyTitle="Today’s industry update is being prepared."
      emptyDescription="Source-reviewed industry updates appear here after publication checks finish."
    />
  );
}
