import "server-only";

import { contentAutomationConfig } from "@/lib/content-automation/config";
import { getLatestSearchDiscovery } from "@/lib/content-automation/search-discovery-log";

export type SearchConsoleStatus = {
  configured: boolean;
  state: "not-configured" | "configured" | "sitemap-submitted" | "sitemap-submission-failed";
  detail: string;
};

export async function getSearchConsoleStatus(): Promise<SearchConsoleStatus> {
  const configured = contentAutomationConfig().searchConsoleConfigured;
  if (!configured) {
    return {
      configured: false,
      state: "not-configured",
      detail: "Set the exact Search Console property and service-account credentials in the deployment environment.",
    };
  }

  try {
    const latest = await getLatestSearchDiscovery();
    if (!latest) {
      return {
        configured: true,
        state: "configured",
        detail: "Credentials are configured, but no persisted sitemap submission result is available yet.",
      };
    }

    const timestamp = new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Shanghai",
    }).format(new Date(latest.recordedAt));

    if (latest.status === "sitemap-submitted") {
      const readback = latest.readbackHttpStatus && latest.readbackHttpStatus >= 200 && latest.readbackHttpStatus < 300
        ? "Google sitemap resource read-back succeeded"
        : "Google read-back is pending";
      return {
        configured: true,
        state: "sitemap-submitted",
        detail: `${timestamp}: submission HTTP ${latest.submitHttpStatus ?? "unknown"}; ${readback}. This confirms discovery submission, not indexing.`,
      };
    }

    return {
      configured: true,
      state: "sitemap-submission-failed",
      detail: `${timestamp}: ${latest.detail ?? "The most recent sitemap submission failed."}`,
    };
  } catch (error) {
    return {
      configured: true,
      state: "configured",
      detail: `Credentials are configured, but the persisted submission log could not be read: ${error instanceof Error ? error.message : "unknown error"}.`,
    };
  }
}
