import type { Metadata, Viewport } from "next";
import { SiteShell } from "@/components/layout/SiteShell";
import { OrganizationJsonLd } from "@/components/OrganizationJsonLd";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: { default: siteConfig.defaultTitle, template: `%s | ${siteConfig.brandName}` },
  description: siteConfig.defaultDescription,
  robots: { index: true, follow: true },
  openGraph: { type: "website", title: siteConfig.defaultTitle, description: siteConfig.defaultDescription },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><OrganizationJsonLd /><SiteShell>{children}</SiteShell></body></html>;
}
