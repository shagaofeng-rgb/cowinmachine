import Link from "next/link";
import { ArrowRight, Check } from "@phosphor-icons/react/ssr";
import { EquipmentIcon } from "@/components/interior/EquipmentIcon";
import { InteriorCallout, InteriorFigure, InteriorIntro } from "@/components/interior/Interior";
import { pageMetadata } from "@/lib/seo";
import type { ProductCategorySlug } from "@/types/product";

export const metadata = pageMetadata("Construction and Remote Site Equipment", "Plan compressed air, temporary power, drilling and mobile lighting requirements from documented site conditions.", "/solutions/construction-sites");

const equipment: { family: ProductCategorySlug; title: string; text: string }[] = [
  { family: "generator-systems", title: "Temporary power", text: "Load schedule, starting demand, voltage and duty." },
  { family: "compressed-air-equipment", title: "Compressed air", text: "Air demand, pressure at the point of use and power source." },
  { family: "drilling-equipment", title: "Drilling", text: "Formation, target depth, hole diameter and site access." },
  { family: "mobile-lighting-systems", title: "Site lighting", text: "Coverage, operating hours, mobility and charging options." },
];

const inputs = [
  "Work schedule and required output",
  "Available fuel, electricity, air and water",
  "Terrain, access and installation space",
  "Ambient conditions and service logistics",
  "Destination and project requirements",
];

export default function ConstructionSitesPage() {
  return (
    <div className="cw-interior">
      <InteriorIntro items={[{ label: "Solutions", href: "/solutions" }, { label: "Construction & Remote Sites" }]} label="Application review"
        title="Construction & Remote Sites" description="Coordinate power, air, drilling and lighting around the jobsite rather than selecting each machine in isolation." />
      <section className="cw-section"><div className="cw-wrap">
        <div className="cw-section-title"><h2>Equipment by jobsite requirement</h2></div>
        <ul className="cw-use-grid">{equipment.map(({ family, title, text }) => (
          <li key={family}><Link href={`/products/${family}`}>
            <EquipmentIcon family={family} size={47} /><h3>{title}</h3><p>{text}</p><ArrowRight className="cw-use-arrow" size={18} aria-hidden="true" />
          </Link></li>
        ))}</ul>
      </div></section>
      <section className="cw-section cw-section-muted"><div className="cw-wrap cw-feature-split cw-quality-layout">
        <div className="cw-feature-copy"><h2>Jobsite conditions to confirm</h2><ul className="cw-check-list">{inputs.map((item) => <li key={item}><Check size={17} aria-hidden="true" /><span>{item}</span></li>)}</ul>
          <Link className="cw-link" href="/products/drilling-consumables">Review drilling tools and consumables <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <InteriorFigure src="/images/products/drilling-equipment/rig-cs110-189.jpg" alt="Catalog photograph of the CS110 drilling rig" caption="Drilling equipment from the COWIN MACHINE catalog." equipment />
      </div></section>
      <InteriorCallout title="Request a jobsite equipment review" description="Include your operating conditions, planned output and destination." href="/request-a-quote" action="Send site requirements" />
    </div>
  );
}
