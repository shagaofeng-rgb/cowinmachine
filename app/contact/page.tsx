import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageHero } from "@/components/PageHero";
import { siteConfig, whatsappHref } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Contact", "Contact cowinmachine to discuss industrial equipment requirements.", "/contact");

export default function ContactPage() {
  return <>
    <PageHero eyebrow="Contact" title="Contact Our Team" description="Share your project requirements and equipment objective to begin a focused review." image={{ src: "/images/generated/contact-project-coordinator.png", alt: "Industrial project coordinator speaking with a client" }} />
    <section className="section"><div className="content-wrap quote-layout"><div><h2>Contact details</h2><p><strong>Email:</strong> <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></p><p><strong>WhatsApp:</strong> <a href={whatsappHref}>{siteConfig.phone}</a></p><p><strong>Address:</strong><br />{siteConfig.address.line1}</p><p><strong>Business hours:</strong> REVIEW REQUIRED</p><div className="placeholder-image">Map placeholder — publish only after address verification.</div></div><div><h2>Send an inquiry</h2><InquiryForm /></div></div></section>
  </>;
}
