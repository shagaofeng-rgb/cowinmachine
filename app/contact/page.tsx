import Image from "next/image";
import { ArrowSquareOut, MapPin } from "@phosphor-icons/react/ssr";
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
    <section className="section section-alt contact-location-section">
      <div className="content-wrap contact-location-layout">
        <div className="contact-location-copy">
          <p className="eyebrow">Visit COWIN MACHINE</p>
          <h2>Our office location</h2>
          <p>Arrange your visit with our team in advance so we can prepare for the equipment discussion.</p>
          <address>
            {address.map((line) => <span key={line}>{line}<br /></span>)}
          </address>
          <a className="button button-outline" href={siteConfig.mapUrl} target="_blank" rel="noreferrer">
            <MapPin aria-hidden="true" size={19} weight="bold" />
            Open in Google Maps
            <ArrowSquareOut aria-hidden="true" size={17} weight="bold" />
          </a>
        </div>
        <div className="contact-map-wrap">
          <iframe
            className="contact-map"
            title="COWIN MACHINE office location in Quzhou, China"
            src={siteConfig.mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  </>;
}
