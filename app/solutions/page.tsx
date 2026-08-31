import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Application Solutions", "Review application-led equipment selection considerations for construction sites and material processing.", "/solutions");
export default function SolutionsPage() {
  return <><PageHero eyebrow="Application solutions" title="Start with the Operating Conditions" description="Use the application context to identify the equipment category, project inputs and technical questions that should be reviewed before quotation." image={{ src: "/images/products/generator-systems/gen-bf-150kva-144.jpg", alt: "Industrial generator equipment prepared for application review" }} /><section className="section"><div className="content-wrap grid"><article className="card"><h2>Construction &amp; Remote Sites</h2><p>Review power, compressed air, drilling, lighting, access and support-equipment requirements for temporary or remote work.</p><Link className="button button-outline" href="/solutions/construction-sites">Review Site Inputs</Link></article><article className="card"><h2>Material Processing &amp; Recycling</h2><p>Review feed material, process objective, installation constraints and separation-stage questions for magnetic equipment.</p><Link className="button button-outline" href="/solutions/mineral-processing-recycling">Review Process Inputs</Link></article></div></section></>;
}
