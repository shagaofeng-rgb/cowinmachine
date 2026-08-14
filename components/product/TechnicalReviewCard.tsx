"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { mailtoHref } from "@/lib/site";

type Props = { productName: string; productModel?: string | null; productUrl: string };
export function TechnicalReviewCard({ productName, productModel, productUrl }: Props) {
  const router = useRouter();
  const [values, setValues] = useState({ application: "", material: "", quantity: "", country: "", requirements: "", email: "", whatsapp: "" });
  const update = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new URLSearchParams({ product: productName, productUrl, ...(productModel ? { productModel } : {}), ...Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim())) });
    router.push(`/request-a-quote?${query.toString()}`);
  };
  return <aside className="quote-card technical-review-card" aria-labelledby="technical-review-heading">
    <p className="eyebrow">Technical review</p><h2 id="technical-review-heading">Request a Technical Review</h2>
    <p>Share the operating context so the configuration can be reviewed before a quotation is prepared.</p>
    <form onSubmit={submit} className="technical-review-form">
      <label>Product model<input value={productModel ?? "Configuration review"} readOnly /></label>
      <label>Application<input value={values.application} onChange={(event) => update("application", event.target.value)} /></label>
      <label>Material / medium<input value={values.material} onChange={(event) => update("material", event.target.value)} /></label>
      <label>Required quantity<input value={values.quantity} onChange={(event) => update("quantity", event.target.value)} /></label>
      <label>Country<input value={values.country} onChange={(event) => update("country", event.target.value)} /></label>
      <label>Project requirements<textarea rows={3} value={values.requirements} onChange={(event) => update("requirements", event.target.value)} /></label>
      <label>Email<input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} /></label>
      <label>WhatsApp<input value={values.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} /></label>
      <button className="button button-primary" type="submit">Request a Quote</button>
    </form>
    <div className="technical-review-actions"><a className="button button-outline" href={mailtoHref}>Talk to an Engineer</a><Link className="text-link" href={`/request-a-quote?product=${encodeURIComponent(productName)}&productUrl=${encodeURIComponent(productUrl)}&request=verified-specifications`}>Request Verified Specifications</Link></div>
  </aside>;
}
