import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { audit, db } from "@/lib/db";

const Schema = z.object({
  name: z.string().min(1).max(120),
  company: z.string().max(160).optional(),
  email: z.string().email(),
  phone: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  message: z.string().min(5).max(3000),
  product_id: z.string().optional(),
  consent: z.string().optional(),
  website: z.string().optional(),
});

export async function POST(request: Request) {
  const form = Object.fromEntries((await request.formData()).entries());
  const parsed = Schema.safeParse(form);
  if (!parsed.success || parsed.data.website) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "表单信息不完整或疑似垃圾提交" } }, { status: 400 });
  }
  const ipHash = crypto.createHash("sha256").update(request.headers.get("x-forwarded-for") || "local").digest("hex");
  const formNo = `INQ-${Date.now()}`;
  db().prepare(`INSERT INTO form_submissions(form_no, form_type, name, company, email, phone, country, message, product_id, source_page, ip_hash, consent)
    VALUES (?, '产品询价表单', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    formNo,
    parsed.data.name,
    parsed.data.company || "",
    parsed.data.email,
    parsed.data.phone || "",
    parsed.data.country || "",
    parsed.data.message,
    parsed.data.product_id || null,
    request.headers.get("referer") || "/contact",
    ipHash,
    parsed.data.consent === "1" ? 1 : 0,
  );
  audit("新增客户表单", "客户表单", "success", formNo);
  return NextResponse.redirect(new URL(`/contact?submitted=${formNo}`, request.url), 303);
}
