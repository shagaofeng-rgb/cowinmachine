import Link from "next/link";
import { ArrowRight, Check, MagnetStraight, Stack, Wrench } from "@phosphor-icons/react/ssr";
import { ConveyorIcon } from "@/components/interior/EquipmentIcon";
import { InteriorCallout, InteriorFigure, InteriorIntro } from "@/components/interior/Interior";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Mineral Processing and Recycling Separation", "Prepare feed-material and process information for a magnetic-separation equipment review.", "/solutions/mineral-processing-recycling");

const stages = [
  { title: "Feed", text: "Material, particle size and moisture.", icon: Stack },
  { title: "Convey", text: "Belt width, speed and burden depth.", icon: ConveyorIcon },
  { title: "Separate", text: "Target fraction and separation objective.", icon: MagnetStraight },
  { title: "Install", text: "Clearance, utilities and cleaning access.", icon: Wrench },
];

const inputs = ["Feed material and target contaminant or mineral", "Required throughput and operating schedule", "Conveyor layout and available installation space", "Cleaning, maintenance and safety constraints"];

export default function MineralProcessingPage() {
  return (
    <div className="cw-interior">
      <InteriorIntro items={[{ label: "Solutions", href: "/solutions" }, { label: "Material Processing & Recycling" }]}
        label="Application review" title="Material Processing & Recycling" description="Define the material, separation objective and installation conditions before reviewing magnetic equipment." />
      <section className="cw-section"><div className="cw-wrap">
        <div className="cw-section-title"><h2>Separation review sequence</h2><p>Application planning diagram. The final process depends on the feed and site layout.</p></div>
        <ol className="cw-process">{stages.map(({ title, text, icon: Icon }, index) => (
          <li key={title}>
            <span className="cw-process-mark"><Icon size={28} aria-hidden="true" /><span>{String(index + 1).padStart(2, "0")}</span></span>
            <h3>{title}</h3><p>{text}</p>
          </li>
        ))}</ol>
      </div></section>
      <section className="cw-section cw-section-muted"><div className="cw-wrap cw-feature-split">
        <InteriorFigure src="/images/products/magnetic-separators/mag-rcda-019.jpg" alt="Catalog photograph of an RCDA magnetic separator" caption="Magnetic separation equipment from the COWIN MACHINE catalog." equipment />
        <div className="cw-feature-copy"><h2>Inputs for equipment selection</h2><ul className="cw-check-list">{inputs.map((item) => <li key={item}><Check size={17} aria-hidden="true" /><span>{item}</span></li>)}</ul>
          <Link className="cw-link" href="/products/magnetic-separators">Browse magnetic separators <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </div></section>
      <InteriorCallout title="Request a process review" description="Share your feed information, separation objective and available installation details." href="/request-a-quote?category=magnetic-separators" action="Send process requirements" />
    </div>
  );
}
