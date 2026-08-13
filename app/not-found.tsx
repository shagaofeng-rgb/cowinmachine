import Link from "next/link";
export default function NotFound() { return <section className="page-hero"><div><p className="eyebrow">404</p><h1>Page not found</h1><p>The page you requested is not available.</p><Link className="button button-primary" href="/">Return Home</Link></div></section>; }
