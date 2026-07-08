import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const tables = db().prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get() as { count: number };
  return NextResponse.json({ ok: true, database: "connected", tables: tables.count, time: new Date().toISOString() });
}
