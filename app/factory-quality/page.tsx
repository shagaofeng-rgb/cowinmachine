import { PageHero } from "@/components/PageHero";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("Quality Documentation", "A review-gated area for verified quality and technical documentation.", "/factory-quality");
export default function FactoryQualityPage() { return <><PageHero eyebrow="Documentation" title="Quality Documentation Review" description="No manufacturing, certification, testing or packing claim is published until it is verified for the new company." /><section className="section"><div className="content-wrap"><div className="card"><h2>REVIEW REQUIRED</h2><p>Replace only with approved new-company certificates, test documentation and authorized visual assets.</p></div></div></section></>; }
