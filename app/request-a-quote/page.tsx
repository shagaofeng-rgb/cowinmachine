import Link from "next/link";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageHero } from "@/components/PageHero";
import { siteConfig, whatsappHref } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Request a Quote", "Send cowinmachine your mobile lighting or site monitoring requirements for an independent review.", "/request-a-quote");

export default function QuotePage() {
  return <>
    <PageHero eyebrow="Request a Quote" title="Tell Us About Your Site Equipment Requirement" description="Provide your location, operating conditions and required quantity. No product claim is made until verified information is supplied." />
    <section className="section section-alt"><div className="content-wrap"><h2>Contact Details · Equipment Requirements · Project Details</h2><InquiryForm /><p className="form-status">For an immediate conversation, email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or <a href={whatsappHref}>message us on WhatsApp</a>.</p><Link className="button button-outline" href="/products">Return to Products</Link></div></section>
  </>;
}
