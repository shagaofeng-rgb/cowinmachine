import type { ContentMode } from "@/types/content-automation";

const asBoolean = (value: string | undefined) => value === "true";

export function contentAutomationConfig() {
  const mode: ContentMode = process.env.CONTENT_MODE === "draft" ? "draft" : "publish";
  return {
    schedule: process.env.CONTENT_SCHEDULE ?? "45 1 * * *",
    mode,
    autoPublish: process.env.AUTO_PUBLISH !== "false",
    storageAdapter: process.env.CONTENT_STORAGE_ADAPTER ?? ((process.env.DATABASE_URL ?? process.env.POSTGRES_URL) ? "neon" : "file"),
    adminEnabled: asBoolean(process.env.CONTENT_ADMIN_ENABLED),
    adminPublishEnabled: asBoolean(process.env.CONTENT_ADMIN_ALLOW_PUBLISH),
    searchConsoleConfigured: Boolean(process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY && process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON),
  } as const;
}

export function isAutoPublishEnabled() {
  const config = contentAutomationConfig();
  return config.mode === "publish" && config.autoPublish;
}
