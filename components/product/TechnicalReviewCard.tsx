import Link from "next/link";
import { ArrowRight, ClipboardText } from "@phosphor-icons/react/ssr";
import { mailtoHref } from "@/lib/site";

export function TechnicalReviewCard({ quoteHref, model }: { quoteHref: string; model?: string | null }) {
  return (
    <aside className="cw-technical-aside" aria-labelledby="technical-review-heading">
      <ClipboardText size={28} aria-hidden="true" />
      <h2 id="technical-review-heading">Project review</h2>
      {model && <p className="cw-aside-model">Model: <strong>{model}</strong></p>}
      <ul>
        <li>Application and operating conditions</li>
        <li>Required output or capacity</li>
        <li>Quantity and destination</li>
      </ul>
      <Link className="cw-btn cw-btn-primary" href={quoteHref}>Request a quote <ArrowRight size={17} aria-hidden="true" /></Link>
      <a className="cw-link" href={mailtoHref}>Contact an engineer</a>
    </aside>
  );
}
