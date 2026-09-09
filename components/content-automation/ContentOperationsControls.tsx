"use client";

import { useState } from "react";

export function ContentOperationsControls({ publishEnabled }: { publishEnabled: boolean }) {
  const [status, setStatus] = useState<string>("");
  const run = async (action: "dry-run" | "run-draft" | "publish-next" | "reconcile-blog") => {
    setStatus("Running protected content operation…");
    const response = await fetch("/api/content-automation/manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const payload = await response.json().catch(() => ({ error: "Unexpected response." })) as { error?: string; status?: string; reasons?: string[]; eligible?: number; migrated?: number };
    const reconciliation = action === "reconcile-blog" && !payload.error ? `: ${payload.migrated ?? 0} migrated from ${payload.eligible ?? 0} third-party records` : "";
    setStatus(payload.error ?? `${payload.status ?? "Completed"}${payload.reasons?.length ? `: ${payload.reasons.join(" ")}` : ""}${reconciliation}`);
  };
  return <section className="card"><h2>Protected operations</h2><p>These controls use the server-side automation gate. They do not expose credentials or publish by default.</p><div className="cta-row"><button className="button button-outline" type="button" onClick={() => run("dry-run")}>Run Dry Check</button><button className="button button-outline" type="button" onClick={() => run("reconcile-blog")}>Reconcile Third-party Blog</button><button className="button button-primary" type="button" onClick={() => run("run-draft")}>Generate Review Draft</button>{publishEnabled && <button className="button button-primary" type="button" onClick={() => run("publish-next")}>Publish Approved Next Item</button>}</div><p aria-live="polite" className="form-status">{status}</p></section>;
}
