import { InteriorIntro } from "@/components/interior/Interior";
import { pageMetadata } from "@/lib/seo";
import { mailtoHref, siteConfig } from "@/lib/site";

export const metadata = { ...pageMetadata("Privacy Notice", "How COWIN MACHINE handles inquiry information and optional site analytics.", "/privacy"), robots: { index: false, follow: true } };

export default function PrivacyPage() {
  return <div className="cw-interior">
    <InteriorIntro items={[{ label: "Privacy Notice" }]} title="Privacy Notice" description="Inquiry information and your analytics choices." />
    <section className="cw-section"><div className="cw-wrap cw-policy-copy">
      <h2>Equipment inquiries</h2>
      <p>We use the contact and project details you provide to review your requirements, respond and follow up on the inquiry. You do not need to allow analytics to contact us.</p>
      <h2>Optional visit analytics</h2>
      <p>When you allow analytics, this site records visits, approximate country or region when available, referrals and interactions. Your visit may be associated with an inquiry you submit. Change your choice through Analytics settings in the footer.</p>
      <h2>Third-party links</h2>
      <p>Google Maps and WhatsApp are third-party services. Their own privacy terms apply when you use those services.</p>
      <h2>Questions about your information</h2>
      <p>Contact <a href={mailtoHref}>{siteConfig.email}</a> about your information or to request a correction or deletion.</p>
    </div></section>
  </div>;
}
