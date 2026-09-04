import type { Metadata } from "next";
import { ContentIndex } from "@/components/content-automation/ContentIndex";
import { getPublishedNewsArticles } from "@/lib/content-automation/storage";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata(
  "News",
  "Source-reviewed industrial equipment and application news from COWIN MACHINE.",
  "/news",
);

export default async function NewsPage() {
  const articles = await getPublishedNewsArticles();
  return (
    <ContentIndex
      articles={articles}
      sectionPath="/news"
      kicker="COWIN MACHINE / INDUSTRY NEWS"
      title="News & Industry Developments"
      description="Source-reviewed industry developments connected to equipment applications and buyer decisions."
      emptyTitle="Today’s industry update is being prepared."
      emptyDescription="Source-reviewed industry updates appear here after publication checks finish."
    />
  );
}
