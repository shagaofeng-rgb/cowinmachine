import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/ssr";
import { InteriorBreadcrumbs, InteriorCallout } from "@/components/interior/Interior";
import { CatalogDirectory } from "@/components/product/CatalogDirectory";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata("About", siteConfig.companyIntroduction, "/about");

const reviewSteps = [
  { title: "Define the application", text: "Share what the equipment needs to do, where it will operate and what is already on site." },
  { title: "Review the equipment fit", text: "Match the operating conditions and required output to the relevant model and options." },
  { title: "Confirm the configuration", text: "Review model-specific specifications, documentation and destination requirements before a quotation." },
];

export default function AboutPage() {
  return (
    <div className="cw-interior">
      <div className="cw-wrap"><InteriorBreadcrumbs items={[{ label: "About Us" }]} /></div>
      <header className="cw-about-hero">
        <Image src="/images/generated/about-planning-meeting.png" alt="Illustration of a team reviewing an industrial project plan" fill sizes="100vw" fetchPriority="high" loading="eager" />
        <div className="cw-wrap cw-about-copy cw-title">
          <p className="cw-kicker">Industrial equipment</p>
          <h1>COWIN MACHINE</h1>
          <p>Application-led equipment support for mining, construction, remote power and material processing projects.</p>
          <Link className="cw-btn cw-btn-primary" href="/products">Explore the catalog <ArrowRight size={18} aria-hidden="true" /></Link>
          <p className="cw-about-caption">Project planning illustration</p>
        </div>
      </header>
      <CatalogDirectory />
      <section className="cw-section"><div className="cw-wrap">
        <div className="cw-section-title"><h2>From project conditions to equipment selection</h2><p>The review starts with the work the equipment needs to perform.</p></div>
        <ol className="cw-steps">
          {reviewSteps.map(({ title, text }, index) => (
            <li key={title}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{text}</p></li>
          ))}
        </ol>
      </div></section>
      <InteriorCallout title="Discuss your application" description="Send your equipment objective, operating conditions and destination." href="/contact" action="Contact our team" />
    </div>
  );
}
