import Link from "next/link";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { productCategories } from "@/lib/products";
import { siteConfig, whatsappHref } from "@/lib/site";

export function Footer() {
  return <footer className="site-footer">
    <div className="footer-cta"><SiteLogo inverse /><div><p>Need help reviewing your industrial equipment requirement?</p><Link className="button button-primary" href="/request-a-quote">Request a Quote</Link></div></div>
    <div className="footer-grid">
      <div><p className="footer-heading">Company</p><Link href="/about">About</Link><Link href="/factory-quality">Quality Documentation</Link><Link href="/cases">Project Reviews</Link></div>
      <div><p className="footer-heading">Products</p>{productCategories.map((item) => <Link key={item.slug} href={`/products/${item.slug}`}>{item.name}</Link>)}</div>
      <div><p className="footer-heading">Applications</p><Link href="/solutions">Applications</Link><Link href="/resources">Resources</Link><Link href="/contact">Contact</Link></div>
      <div><p className="footer-heading">Contact</p><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a><a href={whatsappHref}>WhatsApp: {siteConfig.phone}</a><p>{siteConfig.address.line1}<br />{siteConfig.address.line2}<br />{siteConfig.address.city}, {siteConfig.address.region}, {siteConfig.address.country}</p></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} {siteConfig.brandName}</span><span>Industrial equipment application review.</span></div>
  </footer>;
}
