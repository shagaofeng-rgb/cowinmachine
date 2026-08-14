import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export function pageMetadata(title: string, description: string, path = "/"): Metadata {
  const url = new URL(path, siteConfig.siteUrl).toString();
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title: `${title} | ${siteConfig.brandName}`,
      description,
      url,
      images: [{ url: "/images/cowin-machine-logo.jpg", width: 800, height: 800, alt: `${siteConfig.brandName} logo` }],
    },
  };
}
