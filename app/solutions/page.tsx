import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { pageMetadata } from "@/lib/seo";

const solutions = ["Compressed-Air Planning", "On-Site Power Planning", "Drilling Project Planning", "Temporary Site Equipment Planning"];
const solutionImages = [
  { src: "/images/generated/solution-mining-quarrying.png", alt: "Aggregate quarry landscape" },
  { src: "/images/generated/solution-road-infrastructure.png", alt: "Road and infrastructure worksite" },
  { src: "/images/generated/solution-water-well-drilling.png", alt: "Rural water well worksite" },
  { src: "/images/generated/solution-remote-lighting.png", alt: "Remote worksite at dusk" },
];

export const metadata = pageMetadata("Applications", "Independent application discussions for industrial equipment requirements, subject to project verification.", "/solutions");

export default function SolutionsPage() {
  return <><PageHero eyebrow="Applications" title="Industrial Equipment Applications" description="Discuss location, required operating conditions, available power and project constraints before configuration." image={{ src: "/images/generated/solutions-quarry-landscape.png", alt: "Quarry and infrastructure landscape" }} /><section className="section"><div className="content-wrap grid">{solutions.map((solution, index) => <article className="card" key={solution}><Image className="card-image" src={solutionImages[index].src} alt={solutionImages[index].alt} width={1200} height={900} sizes="(max-width: 800px) 92vw, 25vw" /><h2>{solution}</h2><p>REVIEW REQUIRED: application guidance is published only after verified technical inputs are available.</p><Link className="button button-outline" href="/contact">Discuss Your Application</Link></article>)}</div></section></>;
}
