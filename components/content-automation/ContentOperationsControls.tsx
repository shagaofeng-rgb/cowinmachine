"use client";

import { useState } from "react";

export function ContentOperationsControls() {
  const [status, setStatus] = useState<string>("");
  const run = async () => {
    setStatus("Reconciling third-party Blog records…");
    const response = await fetch("/api/content-automation/manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reconcile-blog" }) });
    const payload = await response.json().catch(() => ({ error: "Unexpected response." })) as { error?: string; status?: string; reasons?: string[]; eligible?: number; migrated?: number };
    const reconciliation = !payload.error ? `: ${payload.migrated ?? 0} migrated from ${payload.eligible ?? 0} third-party records` : "";
    setStatus(payload.error ?? `${payload.status ?? "Completed"}${payload.reasons?.length ? `: ${payload.reasons.join(" ")}` : ""}${reconciliation}`);
  };
  return <section className="card"><h2>Protected operations</h2><p>News automation is disabled. Third-party Blog reconciliation remains available and does not expose credentials.</p><div className="cta-row"><button className="button button-outline" type="button" onClick={run}>Reconcile Third-party Blog</button></div><p aria-live="polite" className="form-status">{status}</p></section>;
}
