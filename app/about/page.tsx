import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { productCategories } from "@/lib/products";
import { siteConfig } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("About", siteConfig.companyIntroduction, "/about");
export default function AboutPage() {
  return <><PageHero eyebrow="About COWIN MACHINE" title="Application-Led Equipment Support" description={siteConfig.companyIntroduction} image={{ src: "/images/generated/about-planning-meeting.png", alt: "Industrial planning meeting in a warehouse office" }} />
    <section className="section"><div className="content-wrap"><h2>Product Focus</h2><div className="grid">{productCategories.map((category) => <div className="card" key={category.slug}><h3>{category.name}</h3><p>{category.summary}</p></div>)}</div></div></section>
    <section className="section section-alt"><div className="content-wrap"><h2>Technical Information Policy</h2><p>Product specifications, image records and technical documents are reviewed before model-specific claims are published. Where a configuration is not yet confirmed, the product page clearly asks for an application review.</p><p>Contact our team with your operating conditions, required capacity and destination so the discussion can begin with relevant project information.</p><Link className="button button-primary" href="/contact">Contact Our Team</Link></div></section>
  </>;
}
