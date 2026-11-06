import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkInquiryRateLimit, createLead } from "@/lib/admin-operations/analytics";
import { resolveInquirySelection } from "@/lib/inquiry-context";

export const runtime = "nodejs";

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120), company: z.string().trim().min(2).max(180), country: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(180), category: z.string().trim().min(1).max(100), message: z.string().trim().min(10).max(6000),
  website: z.string().max(0).default(""), productUrl: z.string().max(600).optional(),
  submissionId: z.string().uuid().optional(),
  application: z.string().trim().max(600).optional(), material: z.string().trim().max(300).optional(), quantity: z.string().trim().max(100).optional(),
  whatsapp: z.string().trim().max(100).optional(), projectRequirements: z.string().trim().max(3000).optional(),
});

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 32_768) return NextResponse.json({ message: "The inquiry payload is too large." }, { status: 413 });

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const supplied = new URL(origin);
      const current = new URL(request.url);
      const host = request.headers.get("host")?.toLowerCase();
      if (supplied.origin !== current.origin && !(supplied.protocol === current.protocol && supplied.host === host)) {
        return NextResponse.json({ message: "Cross-origin inquiry submission is not allowed." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ message: "Cross-origin inquiry submission is not allowed." }, { status: 403 });
    }
  }

  const raw = await request.text().catch(() => "");
  if (raw.length > 32_768) return NextResponse.json({ message: "The inquiry payload is too large." }, { status: 413 });
  const payload = (() => { try { return JSON.parse(raw) as unknown; } catch { return null; } })();

  const parsed = inquirySchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ message: "Please correct the highlighted fields and try again." }, { status: 400 });

  const selection = resolveInquirySelection(parsed.data.productUrl ?? "", parsed.data.category);
  if (!selection.category) return NextResponse.json({ message: "Select a valid equipment family and try again." }, { status: 400 });
  const visitor = request.headers.get("x-cowin-visitor-id");
  const canAttribute = request.cookies.get("cw_analytics_consent")?.value === "granted" && visitor === request.cookies.get("cw_visitor_id")?.value;

  try {
    if (!await checkInquiryRateLimit(request)) {
      return NextResponse.json({ message: "Too many inquiry attempts. Please wait before trying again." }, { status: 429 });
    }
    const result = await createLead({
      ...parsed.data,
      category: selection.category.slug,
      productUrl: selection.productUrl,
      productModel: selection.model,
      visitorId: canAttribute ? visitor ?? undefined : undefined,
      sessionId: canAttribute ? request.headers.get("x-cowin-session-id") ?? undefined : undefined,
    });
    if (!result) return NextResponse.json({ message: "This inquiry was already sent with different details. Reload the page to send a new inquiry." }, { status: 409 });
    return NextResponse.json({ ok: true, replayed: result.replayed, message: "Your request has been received. Our team will review the details and contact you using the information provided." });
  } catch (error) {
    console.error("inquiry-store-failed", { code: error && typeof error === "object" && "code" in error ? error.code : "unknown" });
    return NextResponse.json({ message: "Our inquiry system is temporarily unavailable. Please contact us by email or WhatsApp." }, { status: 503 });
  }
}
