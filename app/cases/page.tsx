import { PageHero } from "@/components/PageHero";
import { pageMetadata } from "@/lib/seo";

const baseMetadata = pageMetadata("Project Reviews", "Request relevant industrial equipment project references for a confirmed application.", "/cases");
export const metadata = { ...baseMetadata, robots: { index: false, follow: true } };

export default function CasesPage() {
  return <><PageHero eyebrow="Project reviews" title="Application Reference Review" description="Relevant project references depend on the application, equipment scope and permission to share customer information." image={{ src: "/images/generated/cases-remote-infrastructure.png", alt: "Remote infrastructure worksite under review" }} /><section className="section"><div className="content-wrap"><div className="card"><h2>Request a Relevant Reference</h2><p>Send your application, operating environment and target equipment category. Our team will review whether a suitable, shareable project reference is available.</p></div></div></section></>;
}
