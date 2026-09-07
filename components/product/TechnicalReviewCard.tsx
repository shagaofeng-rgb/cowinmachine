import Link from "next/link";
import { mailtoHref } from "@/lib/site";

type Props = { productName: string; productModel?: string | null; productUrl: string };

export function TechnicalReviewCard({ productName, productModel, productUrl }: Props) {
  const quoteParams = new URLSearchParams({
    product: productName,
    productUrl,
    ...(productModel ? { productModel } : {}),
  });
  const specificationsParams = new URLSearchParams(quoteParams);
  specificationsParams.set("request", "verified-specifications");

  return <aside className="quote-card technical-review-card" aria-labelledby="technical-review-heading">
    <p className="eyebrow">Technical review</p>
    <h2 id="technical-review-heading">Review This Configuration</h2>
    <p className="technical-review-model"><span>Model reference</span><strong>{productModel ?? "Configuration review"}</strong></p>
    <p>Prepare these project inputs before requesting a quotation:</p>
    <ul className="technical-review-checklist">
      <li>Application and operating conditions</li>
      <li>Required capacity or output</li>
      <li>Quantity and destination country</li>
      <li>Available utilities and site constraints</li>
    </ul>
    <div className="technical-review-actions">
      <Link className="button button-primary" href={`/request-a-quote?${quoteParams.toString()}`}>Open Quote Form</Link>
      <a className="button button-outline" href={mailtoHref}>Talk to an Engineer</a>
      <Link className="text-link" href={`/request-a-quote?${specificationsParams.toString()}`}>Request Verified Specifications</Link>
    </div>
  </aside>;
}
