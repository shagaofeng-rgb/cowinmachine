import { NextResponse } from "next/server";
import { z } from "zod";
import { createLead } from "@/lib/admin-operations/analytics";

export const runtime = "nodejs";

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120), company: z.string().trim().min(2).max(180), country: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(180), category: z.string().trim().min(1).max(100), message: z.string().trim().min(10).max(6000),
  website: z.string().max(0), productModel: z.string().trim().max(180).optional(), productUrl: z.string().url().max(600).optional().or(z.literal("")),
  application: z.string().trim().max(600).optional(), material: z.string().trim().max(300).optional(), quantity: z.string().trim().max(100).optional(),
  whatsapp: z.string().trim().max(100).optional(), projectRequirements: z.string().trim().max(3000).optional(),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = inquirySchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ message: "Please correct the highlighted fields and try again." }, { status: 400 });

  try {
    await createLead({
      ...parsed.data,
      visitorId: request.headers.get("x-cowin-visitor-id") ?? undefined,
      sessionId: request.headers.get("x-cowin-session-id") ?? undefined,
      landingPath: request.headers.get("referer") ?? undefined,
      sourceChannel: request.headers.get("x-cowin-source-channel") ?? undefined,
    });
    return NextResponse.json({ ok: true, message: "Your request has been received. Our sales team will reply within 24 hours." });
  } catch (error) {
    console.error("inquiry-store-failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ message: "Our inquiry system is temporarily unavailable. Please contact us by email or WhatsApp." }, { status: 503 });
  }
}
