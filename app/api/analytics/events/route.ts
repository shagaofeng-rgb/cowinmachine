import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAnalyticsEvent } from "@/lib/admin-operations/analytics";

export const runtime = "nodejs";

const identifier = z.string().regex(/^[A-Za-z0-9-]{12,100}$/);
const eventSchema = z.object({
  eventId: identifier,
  visitorId: identifier,
  sessionId: identifier,
  eventName: z.enum(["page_view", "product_view", "category_view", "news_view", "quote_click", "whatsapp_click", "email_click", "inquiry_started", "inquiry_submitted", "filter_used"]),
  pagePath: z.string().min(1).max(500),
  pageTitle: z.string().max(180).optional(),
  referrer: z.string().max(1000).optional(),
  language: z.string().max(24).optional(),
  timezone: z.string().max(80).optional(),
  screen: z.string().max(40).optional(),
  productCategory: z.string().max(100).optional(),
  productSlug: z.string().max(180).optional(),
  metadata: z.record(z.string().regex(/^[a-zA-Z0-9_-]{1,50}$/), z.union([z.string().max(180), z.number().finite(), z.boolean()])).optional(),
  utm: z.record(z.string().regex(/^utm_[a-z_]{2,30}$/), z.string().max(180)).optional(),
});

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) return NextResponse.json({ ok: false, message: "Analytics payload is too large." }, { status: 413 });
  const raw = await request.text().catch(() => "");
  if (raw.length > 16_384) return NextResponse.json({ ok: false, message: "Analytics payload is too large." }, { status: 413 });
  const payload = (() => { try { return JSON.parse(raw) as unknown; } catch { return null; } })();
  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Invalid analytics payload." }, { status: 400 });

  try {
    await recordAnalyticsEvent(parsed.data, request);
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    console.error("analytics-event-failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
