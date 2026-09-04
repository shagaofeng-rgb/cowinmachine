import type { Metadata } from "next";
import { ContentIndex } from "@/components/content-automation/ContentIndex";
import { getPublishedBlogArticles } from "@/lib/content-automation/storage";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMetadata(
  "Blog",
  "Practical equipment-selection notes and application guidance from COWIN MACHINE.",
  "/blog",
);

export default async function BlogPage() {
  const articles = await getPublishedBlogArticles();
  return (
    <ContentIndex
      articles={articles}
      sectionPath="/blog"
      kicker="COWIN MACHINE / EQUIPMENT GUIDES"
      title="Blog & Equipment Guidance"
      description="Practical notes for preparing equipment requirements, comparing configurations and planning technical inquiries."
      emptyTitle="The first equipment guide is being prepared."
      emptyDescription="Third-party editorial submissions and practical equipment guidance will appear here after publication."
    />
  );
}
