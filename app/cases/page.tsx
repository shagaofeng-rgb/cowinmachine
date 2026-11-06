import Link from "next/link";
import { ArrowRight, Check } from "@phosphor-icons/react/ssr";
import { InteriorFigure, InteriorIntro } from "@/components/interior/Interior";
import { pageMetadata } from "@/lib/seo";

const baseMetadata = pageMetadata("Project Reviews", "Request relevant industrial equipment project references for a confirmed application.", "/cases");
export const metadata = { ...baseMetadata, robots: { index: false, follow: true } };

const details = ["Equipment family or model of interest", "Application, material or working environment", "Required capacity and destination"];

export default function CasesPage() {
  return (
    <div className="cw-interior">
      <InteriorIntro items={[{ label: "Project References" }]} label="Project review" title="Project References"
        description="Request an application reference relevant to your equipment and operating conditions. References are shared only where suitable material is available and permitted." />
      <section className="cw-section"><div className="cw-wrap cw-feature-split">
        <InteriorFigure src="/images/generated/cases-remote-infrastructure.png" alt="Illustrative remote industrial worksite" caption="Worksite illustration. Not a customer project." />
        <div className="cw-feature-copy">
          <h2>Request a relevant reference</h2>
          <p>Tell us what you are evaluating so our team can check for a shareable reference with a similar scope.</p>
          <ul className="cw-check-list">{details.map((detail) => <li key={detail}><Check size={17} aria-hidden="true" /><span>{detail}</span></li>)}</ul>
          <Link className="cw-btn cw-btn-primary" href="/request-a-quote?request=project-reference">Request a reference <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </div></section>
    </div>
  );
}
