import { PageHero } from "@/components/PageHero";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Resources", "Replaceable technical resource placeholders for mobile lighting and site monitoring equipment selection.", "/resources");

export default function ResourcesPage() {
  const titles = ["Temporary Lighting Planning", "Site Monitoring Planning", "Solar and Diesel Power Considerations", "Portable Equipment Review", "Equipment Maintenance Planning", "Construction Site Safety", "Remote Deployment Planning", "Preparing an Equipment Inquiry"];
  return <><PageHero eyebrow="Resources" title="Technical Resources" description="General structural placeholders. Replace each item with verified technical content before publication." /><section className="section section-alt"><div className="content-wrap grid">{titles.map((title) => <article className="card" key={title}><h2>{title}</h2><p>TODO: Replace with verified product specifications.</p></article>)}</div></section></>;
}
