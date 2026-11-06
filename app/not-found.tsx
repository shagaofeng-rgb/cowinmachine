import Link from "next/link";
import { ArrowRight, MapTrifold } from "@phosphor-icons/react/ssr";
import "./interior.css";

export default function NotFound() {
  return (
    <section className="cw-interior cw-missing-page">
      <div className="cw-wrap cw-title">
        <MapTrifold size={40} aria-hidden="true" />
        <p className="cw-kicker">404</p>
        <h1>Page not found</h1>
        <p>This address is no longer available. Find current equipment in the catalog or contact our team for help.</p>
        <div className="cw-missing-actions">
          <Link className="cw-btn cw-btn-primary" href="/products">Browse products <ArrowRight size={17} aria-hidden="true" /></Link>
          <Link className="cw-btn cw-btn-outline" href="/">Return home</Link>
          <Link className="cw-link" href="/contact">Contact us</Link>
        </div>
      </div>
    </section>
  );
}
