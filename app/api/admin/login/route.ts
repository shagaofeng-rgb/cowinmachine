import { NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const result = await login(email, password);
  if (!result.ok) return NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent(result.message)}`, request.url), 303);
  return NextResponse.redirect(new URL("/admin", request.url), 303);
}
