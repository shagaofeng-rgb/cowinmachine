import { NextResponse } from "next/server";
import { z } from "zod";

const inquirySchema = z.object({
  name: z.string().min(2), company: z.string().min(2), country: z.string().min(2),
  email: z.string().email(), category: z.string().min(1), message: z.string().min(10),
  website: z.string().max(0), productModel: z.string().optional(), productUrl: z.string().url().optional().or(z.literal("")),
  application: z.string().optional(), material: z.string().optional(), quantity: z.string().optional(), whatsapp: z.string().optional(), projectRequirements: z.string().optional(),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = inquirySchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ message: "Please correct the highlighted fields and try again." }, { status: 400 });
  // TODO: Connect a verified CRM or email delivery provider here. No inquiry data is persisted in this placeholder implementation.
  return NextResponse.json({ ok: true, message: "Your request has been received. Our sales team will reply within 24 hours." });
}
