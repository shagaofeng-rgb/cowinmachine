import "server-only";

import { timingSafeEqual } from "node:crypto";

export function isAdminEnabled() {
  return process.env.CONTENT_ADMIN_ENABLED === "true" && Boolean(process.env.CONTENT_ADMIN_USER && process.env.CONTENT_ADMIN_PASSWORD);
}

export function hasAdminAccess(authorization: string | null) {
  if (!authorization || !isAdminEnabled()) return false;
  const credentials = Buffer.from(`${process.env.CONTENT_ADMIN_USER}:${process.env.CONTENT_ADMIN_PASSWORD}`, "utf8").toString("base64");
  const expected = Buffer.from("Basic " + credentials);
  const actual = Buffer.from(authorization);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
