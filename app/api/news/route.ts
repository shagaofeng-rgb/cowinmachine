import { NextResponse } from "next/server";
import { articles } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ data: articles("news", 20), page: 1, pageSize: 20 });
}
