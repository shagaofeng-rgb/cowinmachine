import "server-only";

import { timingSafeEqual } from "node:crypto";
import { contentAutomationConfig } from "@/lib/content-automation/config";

function equal(first: string, second: string) {
  const a = Buffer.from(first); const b = Buffer.from(second);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function hasContentAdminCredentials() {
  return Boolean(process.env.CONTENT_ADMIN_USER && process.env.CONTENT_ADMIN_PASSWORD);
}

export function isAdminRequest(request: Request) {
  if (!contentAutomationConfig().adminEnabled || !hasContentAdminCredentials()) return false;
  const expected = `Basic ${Buffer.from(`${process.env.CONTENT_ADMIN_USER}:${process.env.CONTENT_ADMIN_PASSWORD}`).toString("base64")}`;
  return equal(request.headers.get("authorization") ?? "", expected);
}

export function isSchedulerRequest(request: Request) {
  const configured = process.env.CONTENT_AUTOMATION_TOKEN ?? process.env.CRON_SECRET;
  return Boolean(configured) && equal(request.headers.get("authorization") ?? "", `Bearer ${configured}`);
}
