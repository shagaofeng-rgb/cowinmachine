import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
const solutions = ["Bulk Material Handling", "Mineral Processing", "Recycling Lines", "Process Filtration"];
export const metadata: Metadata = { title: "Applications", description: "Independent application discussions for magnetic separation requirements, subject to project verification." };
export default function SolutionsPage() { return <><PageHero eyebrow="Applications" title="Magnetic Separation Applications" description="Discuss material characteristics, process position and site constraints before configuration." /><section className="section"><div className="content-wrap grid">{solutions.map((solution) => <article className="card" key={solution}><div className="placeholder-image">REVIEW REQUIRED: authorized application image.</div><h2>{solution}</h2><p>REVIEW REQUIRED: application guidance is published only after verified technical inputs are available.</p><Link className="button button-outline" href="/contact">Discuss Your Application</Link></article>)}</div></section></>; }
