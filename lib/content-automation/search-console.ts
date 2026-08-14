import "server-only";

import { contentAutomationConfig } from "@/lib/content-automation/config";

export type SearchConsoleStatus = {
  configured: boolean;
  state: "not-configured" | "configuration-required";
  detail: string;
};

export function getSearchConsoleStatus(): SearchConsoleStatus {
  const configured = contentAutomationConfig().searchConsoleConfigured;
  return configured
    ? { configured: true, state: "configuration-required", detail: "Credentials are configured, but no Search Console client is enabled in this repository. Connect an approved server-side adapter before reads are attempted." }
    : { configured: false, state: "not-configured", detail: "Set GOOGLE_SEARCH_CONSOLE_PROPERTY and GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON in the deployment environment to enable a future server-side adapter." };
}
