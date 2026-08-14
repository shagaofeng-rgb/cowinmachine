import Link from "next/link";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageHero } from "@/components/PageHero";
import { siteConfig, whatsappHref } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Request a Quote", "Send COWIN MACHINE your industrial equipment requirements for an application review.", "/request-a-quote");
type QuotePageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function QuotePage({ searchParams }: QuotePageProps) {
  const query = await searchParams;
  const value = (key: string) => typeof query[key] === "string" ? query[key] : "";
  return <>
    <PageHero eyebrow="Request a Quote" title="Tell Us About Your Equipment Requirement" description="Provide your location, operating conditions and required quantity. No product claim is made until verified information is supplied." image={{ src: "/images/generated/quote-requirements-desk.png", alt: "Technical inquiry requirements being prepared" }} />
    <section className="section section-alt"><div className="content-wrap"><h2>Contact Details · Equipment Requirements · Project Details</h2><InquiryForm productModel={value("productModel") || value("product")} productUrl={value("productUrl")} defaults={{ country: value("country"), email: value("email"), application: value("application"), material: value("material"), quantity: value("quantity"), whatsapp: value("whatsapp"), message: value("requirements") || "" }} /><p className="form-status">For an immediate conversation, email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or <a href={whatsappHref}>message us on WhatsApp</a>.</p><Link className="button button-outline" href="/products">Return to Products</Link></div></section>
  </>;
}
