import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/ssr";
import { InteriorCallout, InteriorIntro } from "@/components/interior/Interior";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Application Solutions", "Review application-led equipment selection considerations for construction sites and material processing.", "/solutions");

const solutions = [
  {
    title: "Construction & Remote Sites",
    text: "Plan temporary power, compressed air, drilling and lighting around the jobsite schedule and access conditions.",
    image: "/images/products/drilling-equipment/rig-cs110-189.jpg",
    alt: "Catalog photograph of a drilling rig",
    href: "/solutions/construction-sites",
    tags: ["Power", "Compressed air", "Drilling", "Lighting"],
  },
  {
    title: "Material Processing & Recycling",
    text: "Identify the separation objective, feed conditions, conveyor geometry and available installation space.",
    image: "/images/products/magnetic-separators/mag-rcda-019.jpg",
    alt: "Catalog photograph of a magnetic separator",
    href: "/solutions/mineral-processing-recycling",
    tags: ["Feed material", "Conveyors", "Separation"],
  },
];

export default function SolutionsPage() {
  return (
    <div className="cw-interior">
      <InteriorIntro items={[{ label: "Solutions" }]} label="Equipment by application" title="Industrial Equipment Solutions"
        description="Start with what the project needs to achieve, then review the relevant equipment and selection inputs." />
      <section className="cw-section"><div className="cw-wrap cw-solution-grid">
        {solutions.map(({ title, text, image, alt, href, tags }) => (
          <article className="cw-solution-entry" key={href}>
            <div className="cw-solution-media"><Image src={image} alt={alt} fill sizes="(max-width: 760px) 92vw, 590px" /></div>
            <div className="cw-solution-copy">
              <h2><Link href={href}>{title}</Link></h2><p>{text}</p>
              <ul className="cw-topic-labels">{tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
              <Link className="cw-link" href={href}>Review the application <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
          </article>
        ))}
      </div></section>
      <InteriorCallout title="Have a project brief?" description="Share the operating conditions, site constraints and equipment objective." href="/request-a-quote" action="Discuss your project" />
    </div>
  );
}
