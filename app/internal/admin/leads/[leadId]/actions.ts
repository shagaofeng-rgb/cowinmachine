"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { saveLeadFollowUp } from "@/lib/admin-operations/analytics";
import { hasAdminAccess } from "@/lib/admin-operations/auth";
import { leadStatusLabels, type LeadStatus } from "@/types/admin-operations";

export type LeadFollowUpResult = { ok: boolean; message: string } | null;

export async function updateLeadFollowUp(id: string, _previous: LeadFollowUpResult, form: FormData): Promise<LeadFollowUpResult> {
  if (!hasAdminAccess((await headers()).get("authorization"))) return { ok: false, message: "请重新登录后台。" };
  const status = form.get("status");
  const note = form.get("note");
  if (!/^[A-Za-z0-9-]{12,100}$/.test(id) || typeof status !== "string" || !Object.hasOwn(leadStatusLabels, status) || typeof note !== "string" || note.length > 2000) {
    return { ok: false, message: "请选择有效状态，备注不超过 2,000 字。" };
  }
  try {
    const saved = await saveLeadFollowUp(id, status as LeadStatus, note.trim());
    if (!saved) return { ok: false, message: "没有保存：请修改状态或填写跟进备注。" };
    revalidatePath(`/internal/admin/leads/${id}`);
    return { ok: true, message: "跟进记录已保存。" };
  } catch {
    console.error("lead-follow-up-failed");
    return { ok: false, message: "暂时无法保存。请稍后重试。" };
  }
}
