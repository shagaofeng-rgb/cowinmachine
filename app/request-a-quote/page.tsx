import type { Metadata } from "next";
import Link from "next/link";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageHero } from "@/components/PageHero";
import { siteConfig, whatsappHref } from "@/lib/site";
export const metadata: Metadata = { title: "Request a Quote", description: "Send cowinmachine your magnetic separation process requirements for an independent review." };
export default function QuotePage() { return <><PageHero eyebrow="Request a Quote" title="Tell Us About Your Separation Requirement" description="Provide your material, operating conditions and required quantity. No product claim is made until verified information is supplied." /><section className="section section-alt"><div className="content-wrap"><h2>Contact Details · Process Requirements · Project Details</h2><InquiryForm /><p className="form-status">For an immediate conversation, email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or <a href={whatsappHref}>message us on WhatsApp</a>.</p><Link className="button button-outline" href="/products">Return to Magnetic Separators</Link></div></section></>; }
