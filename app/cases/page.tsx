import { PageHero } from "@/components/PageHero";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Project Reviews", "A review-gated area for verified mobile lighting and site monitoring project information.", "/cases");

export default function CasesPage() {
  return <><PageHero eyebrow="Project reviews" title="Verified Project Information" description="No project record is published until the application, equipment and approval scope are verified." /><section className="section"><div className="content-wrap"><div className="card"><h2>REVIEW REQUIRED</h2><p>Project data, images, customer permissions and application claims must be verified before publication.</p></div></div></section></>;
}
