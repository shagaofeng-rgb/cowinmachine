import { NextResponse } from "next/server";
import { products } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ data: products(), page: 1, pageSize: 20 });
}
