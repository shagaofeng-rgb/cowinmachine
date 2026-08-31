import Image from "next/image";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageHero } from "@/components/PageHero";
import { siteConfig, whatsappHref } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Contact", "Contact COWIN MACHINE to discuss industrial equipment requirements.", "/contact");

export default function ContactPage() {
  const address = [siteConfig.address.line1, siteConfig.address.line2, siteConfig.address.city, siteConfig.address.region, siteConfig.address.country].filter(Boolean);

  return <>
    <PageHero eyebrow="Contact" title="Contact Our Team" description="Share your project requirements and equipment objective to begin a focused review." image={{ src: "/images/generated/contact-project-coordinator.png", alt: "Industrial project coordinator speaking with a client" }} />
    <section className="section">
      <div className="content-wrap quote-layout">
        <div>
          <h2>Contact details</h2>
          <p><strong>Email:</strong> <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></p>
          <p><strong>WhatsApp:</strong> <a href={whatsappHref}>{siteConfig.phone}</a></p>
          <p><strong>Address:</strong><br />{address.map((line) => <span key={line}>{line}<br /></span>)}</p>
          <p><strong>Response handling:</strong> Messages are reviewed during China business hours.</p>
          <figure className="contact-coordination-visual">
            <Image src="/images/generated/contact-logistics-coordination.png" alt="Project coordinator reviewing equipment requirements beside an industrial logistics yard" width={1536} height={1024} sizes="(max-width: 800px) 92vw, 50vw" />
            <figcaption>Project coordination visual. Contact our team to discuss your equipment requirements.</figcaption>
          </figure>
        </div>
        <div><h2>Send an inquiry</h2><InquiryForm /></div>
      </div>
    </section>
  </>;
}
