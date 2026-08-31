import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Mineral Processing and Recycling Separation", "Prepare feed-material and process information for a magnetic-separation equipment review.", "/solutions/mineral-processing-recycling");

const inputs = ["Feed material and target contaminant or mineral", "Particle-size range and moisture condition", "Required throughput and operating schedule", "Existing process stage and conveyor arrangement", "Installation space and available utilities", "Cleaning method, maintenance access and safety constraints"];

export default function MineralProcessingPage() {
  return <><PageHero eyebrow="Material processing and recycling" title="Define the Separation Objective First" description="Magnetic-separation equipment should be reviewed against the feed material, target fraction, process stage and installation constraints." image={{ src: "/images/products/magnetic-separators/mag-rcda-019.jpg", alt: "Magnetic separation equipment for material processing" }} /><section className="section"><div className="content-wrap product-link-grid"><div><h2>Process Inputs to Prepare</h2><ul>{inputs.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h2>Review Magnetic Separators</h2><p>Use the catalog as a starting point, then confirm model-specific technical data against the intended process.</p><Link className="button button-outline" href="/products/magnetic-separators">Browse Magnetic Separators</Link></div></div></section><section className="section section-alt"><div className="content-wrap"><h2>Request a Process Review</h2><p>Share feed information, the separation objective and available installation details.</p><Link className="button button-primary" href="/request-a-quote?category=magnetic-separators">Send Process Requirements</Link></div></section></>;
}
