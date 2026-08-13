import Link from "next/link";
import { productCategories } from "@/lib/products";
import { siteConfig, whatsappHref } from "@/lib/site";
import { SiteLogo } from "@/components/layout/SiteLogo";

export function Footer() {
  return <footer className="site-footer">
    <div className="footer-cta"><SiteLogo inverse /><div><p>Need equipment for your next project?</p><Link className="button button-primary" href="/request-a-quote">Request a Quote</Link></div></div>
    <div className="footer-grid">
      <div><p className="footer-heading">Company</p><Link href="/about">About Us</Link><Link href="/factory-quality">Factory & Quality</Link><Link href="/cases">Cases</Link></div>
      <div><p className="footer-heading">Products</p>{productCategories.map((item) => <Link key={item.slug} href={`/products/${item.slug}`}>{item.name}</Link>)}</div>
      <div><p className="footer-heading">Solutions</p><Link href="/solutions">Industry Solutions</Link><Link href="/resources">Resources</Link><Link href="/contact">Contact Us</Link></div>
      <div><p className="footer-heading">Contact</p><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a><a href={whatsappHref}>WhatsApp: {siteConfig.phone}</a><p>{siteConfig.address.city}, {siteConfig.address.region}, {siteConfig.address.country}</p></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} {siteConfig.brandName}</span><span>TODO: Replace with verified COWIN MACHINE company information.</span></div>
  </footer>;
}
