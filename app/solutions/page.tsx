import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
const solutions = ["Mining & Quarrying", "Water Well Drilling", "Road & Infrastructure", "Construction Sites", "Remote Area Lighting", "Mineral Processing & Recycling"];
export const metadata: Metadata = { title: "Industry Solutions", description: "Replaceable industrial solution information for application-led equipment discussions." };
export default function SolutionsPage() { return <><PageHero eyebrow="Applications" title="Industry Solutions" description="Start with your worksite requirements and confirm the equipment configuration before selection." /><section className="section"><div className="content-wrap grid">{solutions.map((solution) => <article className="card" key={solution}><div className="placeholder-image">TODO: Replace with authorized product image.</div><h2>{solution}</h2><p>TODO: Replace with verified application information.</p><Link className="button button-outline" href="/contact">Discuss Your Application</Link></article>)}</div></section></>; }
