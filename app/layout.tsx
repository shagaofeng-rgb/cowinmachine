import type { Metadata, Viewport } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileConversionBar } from "@/components/layout/MobileConversionBar";
import { OrganizationJsonLd } from "@/components/OrganizationJsonLd";
import { siteConfig } from "@/lib/site";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
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
  return <html lang="en" data-scroll-behavior="smooth"><body><OrganizationJsonLd /><Header /><main>{children}</main><Footer /><MobileConversionBar /><AnalyticsTracker /></body></html>;
}
