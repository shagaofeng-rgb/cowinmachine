"use client";

import { usePathname } from "next/navigation";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileConversionBar } from "@/components/layout/MobileConversionBar";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/internal/")) return <div lang="zh-CN">{children}</div>;
  const hasInquiryForm = pathname === "/request-a-quote" || pathname === "/contact";
  return <><a className="skip-to-content" href="#main-content">Skip to content</a><Header /><main id="main-content" tabIndex={-1}>{children}</main><AnalyticsTracker inline={hasInquiryForm} /><Footer />{!hasInquiryForm && <MobileConversionBar />}</>;
}
