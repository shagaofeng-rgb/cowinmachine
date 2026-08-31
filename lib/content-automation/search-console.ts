import "server-only";

import { contentAutomationConfig } from "@/lib/content-automation/config";

export type SearchConsoleStatus = {
  configured: boolean;
  state: "not-configured" | "configured";
  detail: string;
};

export function getSearchConsoleStatus(): SearchConsoleStatus {
  const configured = contentAutomationConfig().searchConsoleConfigured;
  return configured
    ? { configured: true, state: "configured", detail: "Search Console credentials are configured for scheduled sitemap submission." }
    : { configured: false, state: "not-configured", detail: "Set a Search Console property and either JSON or split service-account credentials in the deployment environment." };
}
