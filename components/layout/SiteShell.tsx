"use client";

import { usePathname } from "next/navigation";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileConversionBar } from "@/components/layout/MobileConversionBar";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/internal")) return <main>{children}</main>;
  return <><Header /><main>{children}</main><Footer /><MobileConversionBar /><AnalyticsTracker /></>;
}
