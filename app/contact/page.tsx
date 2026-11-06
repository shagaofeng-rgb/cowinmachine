import { ArrowSquareOut, EnvelopeSimple, MapPin, WhatsappLogo } from "@phosphor-icons/react/ssr";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { InteriorFigure, InteriorIntro } from "@/components/interior/Interior";
import { pageMetadata } from "@/lib/seo";
import { mailtoHref, siteConfig, whatsappHref } from "@/lib/site";

export const metadata = pageMetadata("Contact", "Contact COWIN MACHINE to discuss industrial equipment requirements.", "/contact");

export default function ContactPage() {
  const address = [siteConfig.address.line1, siteConfig.address.line2, siteConfig.address.city, siteConfig.address.region, siteConfig.address.country].filter(Boolean);

  return (
    <div className="cw-interior">
      <InteriorIntro items={[{ label: "Contact" }]} label="COWIN MACHINE" title="Contact Our Team"
        description="Talk with us about your equipment, application and project requirements." />
      <section className="cw-section"><div className="cw-wrap cw-contact-layout">
        <aside className="cw-contact-info" aria-labelledby="contact-channels">
          <h2 id="contact-channels">Contact details</h2>
          <div className="cw-contact-channels">
            <a href={whatsappHref}><WhatsappLogo size={26} aria-hidden="true" /><span><strong>WhatsApp</strong><span>{siteConfig.phone}</span></span></a>
            <a href={mailtoHref}><EnvelopeSimple size={26} aria-hidden="true" /><span><strong>Email</strong><span>{siteConfig.email}</span></span></a>
            <a href={siteConfig.mapUrl} target="_blank" rel="noreferrer"><MapPin size={26} aria-hidden="true" /><span><strong>Office address</strong><span>{address.join(", ")}</span></span><ArrowSquareOut size={17} aria-hidden="true" /></a>
          </div>
          <p>Messages are reviewed during China business hours.</p>
        </aside>
        <section className="cw-form-panel" aria-labelledby="contact-inquiry">
          <h2 id="contact-inquiry">Send an inquiry</h2>
          <InquiryForm compact />
        </section>
      </div></section>
      <section className="cw-section cw-section-muted" aria-labelledby="office-heading">
        <div className="cw-wrap cw-location-layout">
          <div className="cw-feature-copy">
            <h2 id="office-heading">Office location</h2>
            <address><a href={siteConfig.mapUrl} target="_blank" rel="noreferrer">{address.map((line) => <span key={line}>{line}</span>)}</a></address>
            <p>Arrange your visit with our team in advance.</p>
            <a className="cw-btn cw-btn-outline" href={siteConfig.mapUrl} target="_blank" rel="noreferrer">Open in Google Maps <ArrowSquareOut size={17} aria-hidden="true" /></a>
          </div>
          <iframe className="cw-office-map" title="COWIN MACHINE office location in Quzhou, China" src={siteConfig.mapEmbedUrl}
            loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
      </section>
      <section className="cw-section" aria-label="Project coordination illustrations">
        <div className="cw-wrap cw-contact-visuals">
          <InteriorFigure src="/images/generated/contact-project-coordinator.png" alt="Illustration of an industrial project discussion" caption="Illustration of project coordination." />
          <InteriorFigure src="/images/generated/contact-logistics-coordination.png" alt="Illustration of logistics planning for industrial equipment" caption="Illustration of equipment logistics planning." />
        </div>
      </section>
    </div>
  );
}
