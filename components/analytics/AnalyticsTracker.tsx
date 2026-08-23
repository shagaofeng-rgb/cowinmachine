"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { AnalyticsEventName, AnalyticsEventPayload } from "@/types/admin-operations";

const consentKey = "cw_analytics_consent";
const visitorKey = "cw_visitor_id";
const sessionKey = "cw_session_id";

function id() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-cw`;
}

function readCookie(name: string) {
  return document.cookie.split("; ").find((part) => part.startsWith(`${name}=`))?.split("=").slice(1).join("=") ?? "";
}

function writeCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
}

function analyticsIds() {
  let visitorId = readCookie(visitorKey);
  if (!visitorId) {
    visitorId = id();
    writeCookie(visitorKey, visitorId, 60 * 60 * 24 * 180);
  }
  let sessionId = sessionStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = id();
    sessionStorage.setItem(sessionKey, sessionId);
  }
  return { visitorId, sessionId };
}

function productFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "products") return {};
  return { productCategory: parts[1], productSlug: parts[2] };
}

function cleanReferrer() {
  if (!document.referrer) return undefined;
  try { return new URL(document.referrer).origin; } catch { return undefined; }
}

function send(eventName: AnalyticsEventName, pathname: string, metadata?: Record<string, string | number | boolean>) {
  if (readCookie(consentKey) !== "granted") return;
  const { visitorId, sessionId } = analyticsIds();
  const url = new URL(window.location.href);
  const utm = Object.fromEntries([...url.searchParams.entries()].filter(([key]) => key.startsWith("utm_")).slice(0, 6));
  const payload: AnalyticsEventPayload = {
    eventId: id(), visitorId, sessionId, eventName, pagePath: pathname, pageTitle: document.title,
    referrer: cleanReferrer(), language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${window.screen.width}x${window.screen.height}`, ...productFromPath(pathname), metadata, utm,
  };
  void fetch("/api/analytics/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }).catch(() => undefined);
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<"pending" | "granted" | "rejected">("pending");

  useEffect(() => {
    const value = readCookie(consentKey);
    setConsent(value === "granted" || value === "rejected" ? value : "pending");
  }, []);

  useEffect(() => {
    if (consent === "granted") {
      send("page_view", pathname);
      if (pathname.startsWith("/products/") && pathname.split("/").filter(Boolean).length === 3) send("product_view", pathname);
      if (pathname.startsWith("/news/") && pathname !== "/news") send("news_view", pathname);
    }
  }, [consent, pathname]);

  useEffect(() => {
    if (consent !== "granted") return;
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (href.includes("wa.me")) send("whatsapp_click", pathname);
      else if (href.startsWith("mailto:")) send("email_click", pathname);
      else if (href.includes("request-a-quote") || /quote/i.test(anchor.textContent ?? "")) send("quote_click", pathname);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [consent, pathname]);

  const choose = (value: "granted" | "rejected") => {
    writeCookie(consentKey, value, 60 * 60 * 24 * 180);
    setConsent(value);
  };

  if (pathname.startsWith("/internal") || consent !== "pending") return null;
  return <aside className="analytics-consent" aria-label="Analytics preference">
    <p><strong>Analytics preference</strong><span>Allow anonymous, first-party visit analytics to help us improve product information and inquiry support. We do not use advertising pixels.</span></p>
    <div><button className="button button-primary" onClick={() => choose("granted")}>Allow analytics</button><button className="button button-outline" onClick={() => choose("rejected")}>Essential only</button></div>
  </aside>;
}
