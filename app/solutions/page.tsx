import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { pageMetadata } from "@/lib/seo";

const solutions = ["Compressed-Air Planning", "On-Site Power Planning", "Drilling Project Planning", "Temporary Site Equipment Planning"];

export const metadata = pageMetadata("Applications", "Independent application discussions for industrial equipment requirements, subject to project verification.", "/solutions");

export default function SolutionsPage() {
  return <><PageHero eyebrow="Applications" title="Industrial Equipment Applications" description="Discuss location, required operating conditions, available power and project constraints before configuration." /><section className="section"><div className="content-wrap grid">{solutions.map((solution) => <article className="card" key={solution}><div className="placeholder-image">REVIEW REQUIRED: authorized application image.</div><h2>{solution}</h2><p>REVIEW REQUIRED: application guidance is published only after verified technical inputs are available.</p><Link className="button button-outline" href="/contact">Discuss Your Application</Link></article>)}</div></section></>;
}
