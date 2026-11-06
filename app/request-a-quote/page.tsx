import Link from "next/link";
import { ArrowLeft, Check, ClipboardText, EnvelopeSimple, WhatsappLogo } from "@phosphor-icons/react/ssr";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { InteriorFigure, InteriorIntro } from "@/components/interior/Interior";
import { resolveInquirySelection } from "@/lib/inquiry-context";
import { pageMetadata } from "@/lib/seo";
import { mailtoHref, whatsappHref } from "@/lib/site";

export const metadata = pageMetadata("Request a Quote", "Send COWIN MACHINE your industrial equipment requirements for an application review.", "/request-a-quote");
type QuotePageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const requestTypes: Record<string, { title: string; message: string }> = {
  "verified-specifications": { title: "Request Verified Specifications", message: "I would like verified specifications for the equipment below." },
  "quality-documents": { title: "Request Quality Documentation", message: "I would like to request technical, inspection or packing documentation." },
  "project-reference": { title: "Request a Project Reference", message: "I would like a shareable project reference for the application below." },
};

const checklist = ["Equipment model or family", "Site conditions and required output", "Quantity and destination country"];

export default async function QuotePage({ searchParams }: QuotePageProps) {
  const query = await searchParams;
  const value = (key: string, max = 600) => typeof query[key] === "string" ? query[key].trim().slice(0, max) : "";
  const requestType = value("request");
  const request = Object.hasOwn(requestTypes, requestType) ? requestTypes[requestType] : undefined;
  const { product, productUrl, category, model: productModel } = resolveInquirySelection(value("productUrl"), value("category", 100));
  const productPath = productUrl ? new URL(productUrl).pathname : "";

  return (
    <div className="cw-interior">
      <InteriorIntro items={[{ label: "Request a Quote" }]} label="Equipment inquiry"
        title={request?.title ?? "Request a Quote"} description="Share your application, operating conditions and destination for an equipment review." />
      <section className="cw-section"><div className="cw-wrap cw-quote-layout">
        <section className="cw-form-panel" aria-labelledby="quote-heading">
          <h2 id="quote-heading">Your equipment inquiry</h2>
          {product && <div className="cw-quote-context">
            <ClipboardText size={22} aria-hidden="true" />
            <div>
              <p>Selected equipment</p>
              <Link className="cw-link" href={productPath}>{product.name}</Link>
              {productModel && <p>Model: {productModel}</p>}
              <Link className="cw-link" href="/products">Choose different equipment</Link>
            </div>
          </div>}
          <InquiryForm productModel={productModel} productUrl={productUrl} fixedCategory={product && category ? category : undefined} defaults={{
            category: category?.slug ?? "",
            country: value("country", 100),
            application: value("application"),
            material: value("material", 300),
            quantity: value("quantity", 100),
            message: value("requirements", 6000) || request?.message || "",
          }} />
        </section>
        <aside className="cw-quote-aside">
          <div className="cw-feature-copy">
            <h2>Project review checklist</h2>
            <ul className="cw-check-list">{checklist.map((item) => <li key={item}><Check size={17} aria-hidden="true" /><span>{item}</span></li>)}</ul>
          </div>
          <div className="cw-quote-alternatives"><a className="cw-link" href={mailtoHref}><EnvelopeSimple size={20} aria-hidden="true" />Email our team</a><a className="cw-link" href={whatsappHref}><WhatsappLogo size={20} aria-hidden="true" />Chat on WhatsApp</a></div>
          <InteriorFigure src="/images/generated/quote-requirements-desk.png" alt="Illustration of an equipment inquiry and project drawings" caption="Illustration of quote preparation." sizes="(max-width: 760px) 92vw, 340px" />
          <Link className="cw-link" href="/products"><ArrowLeft size={17} aria-hidden="true" />Return to products</Link>
        </aside>
      </div></section>
    </div>
  );
}
