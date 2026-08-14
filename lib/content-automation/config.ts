import type { ContentMode } from "@/types/content-automation";

const asBoolean = (value: string | undefined) => value === "true";

export function contentAutomationConfig() {
  const mode: ContentMode = process.env.CONTENT_MODE === "publish" ? "publish" : "draft";
  return {
    schedule: process.env.CONTENT_SCHEDULE ?? "0 8 */2 * *",
    mode,
    autoPublish: asBoolean(process.env.AUTO_PUBLISH),
    storageAdapter: process.env.CONTENT_STORAGE_ADAPTER ?? "file",
    adminEnabled: asBoolean(process.env.CONTENT_ADMIN_ENABLED),
    adminPublishEnabled: asBoolean(process.env.CONTENT_ADMIN_ALLOW_PUBLISH),
    searchConsoleConfigured: Boolean(process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY && process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON),
  } as const;
}

export function isAutoPublishEnabled() {
  const config = contentAutomationConfig();
  return config.mode === "publish" && config.autoPublish;
}
