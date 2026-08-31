import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Construction and Remote Site Equipment", "Plan compressed air, temporary power, drilling and mobile lighting requirements from documented site conditions.", "/solutions/construction-sites");

const inputs = ["Application and operating schedule", "Required output, pressure, load or hole objective", "Power, fuel, air and water availability", "Access route, terrain and installation space", "Ambient conditions and service logistics", "Destination-country and project requirements"];

export default function ConstructionSitesPage() {
  return <><PageHero eyebrow="Construction and remote sites" title="Coordinate Equipment Around the Jobsite" description="Temporary and remote projects depend on connected decisions across power, compressed air, drilling support, lighting, transport and service access." image={{ src: "/images/products/drilling-equipment/rig-cs110-189.jpg", alt: "Drilling rig prepared for a remote worksite" }} /><section className="section"><div className="content-wrap product-link-grid"><div><h2>Inputs to Prepare</h2><ul>{inputs.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h2>Equipment Categories</h2><p>Review air compressors, generator systems, drilling equipment, drilling tools and mobile light towers against one project brief.</p><Link className="button button-outline" href="/products">Browse Equipment</Link></div></div></section><section className="section section-alt"><div className="content-wrap"><h2>Request an Application Review</h2><p>Share the operating conditions and required quantity so the next discussion can focus on relevant configuration questions.</p><Link className="button button-primary" href="/request-a-quote">Send Project Requirements</Link></div></section></>;
}
