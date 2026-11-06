"use client";

import { useActionState } from "react";
import type { LeadFollowUpResult } from "@/app/internal/admin/leads/[leadId]/actions";
import { leadStatusLabels, type LeadStatus } from "@/types/admin-operations";

export function LeadFollowUpForm({ action, status }: {
  action: (previous: LeadFollowUpResult, form: FormData) => Promise<LeadFollowUpResult>;
  status: LeadStatus;
}) {
  const [result, submit, pending] = useActionState(action, null);
  return <form action={submit} className="admin-lead-form" aria-busy={pending}>
    <label>询盘状态<select name="status" defaultValue={status}>
      {Object.entries(leadStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select></label>
    <label>跟进备注<textarea name="note" rows={4} maxLength={2000} /></label>
    <button type="submit" disabled={pending} className="button button-primary">{pending ? "保存中..." : "保存跟进"}</button>
    {result && <p role={result.ok ? "status" : "alert"}>{result.message}</p>}
  </form>;
}
