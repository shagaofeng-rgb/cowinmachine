import Link from "next/link";
import { whatsappHref } from "@/lib/site";

export function MobileConversionBar() {
  return <div className="mobile-conversion-bar"><a href={whatsappHref}>WhatsApp</a><Link href="/request-a-quote">Get a Quote</Link></div>;
}
