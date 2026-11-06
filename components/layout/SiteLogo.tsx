import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function SiteLogo({ onClick, inverse = false }: { onClick?: () => void; inverse?: boolean }) {
  return <Link className={`site-logo${inverse ? " site-logo-inverse" : ""}`} href="/" aria-label={`${siteConfig.brandName} home`} onClick={onClick}>
    <Image src="/images/cowin-machine-logo.jpg" alt={`${siteConfig.brandName} logo`} width={800} height={800}
      sizes="(max-width: 480px) 50px, 58px" loading={inverse ? "lazy" : "eager"} fetchPriority={inverse ? undefined : "high"} />
  </Link>;
}
