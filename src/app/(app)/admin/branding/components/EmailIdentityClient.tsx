"use client";

import { useMemo, useState } from "react";
import type { EmailIdentity } from "@/lib/branding";
import { EmailIdentityTester } from "./EmailIdentityTester";

const emptyIdentity = (): EmailIdentity => ({
  id: "new",
  tenant_id: "",
  from_name: "Workspace",
  from_email: "noreply@ziro.work",
  reply_to_email: null,
  status: "pending",
  verified_at: null,
  last_tested_at: null,
  failure_reason: null,
  is_primary: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export function EmailIdentityClient({
  tenantId,
  canWrite,
  identity,
}: {
  tenantId: string;
  canWrite: boolean;
  identity: EmailIdentity | null;
}) {
  const base = identity ?? emptyIdentity();
  const [fromName, setFromName] = useState(base.from_name);
  const [fromEmail, setFromEmail] = useState(base.from_email);
  const [replyTo, setReplyTo] = useState(base.reply_to_email ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const qs = useMemo(() => `tenantId=${encodeURIComponent(tenantId)}`, [tenantId]);

  async function save() {
    if (!canWrite) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/branding/email-identity?${qs}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: identity?.id !== "new" ? identity?.id : undefined,
          from_name: fromName,
          from_email: fromEmail,
          reply_to_email: replyTo.trim() || null,
          is_primary: true,
        }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      setMsg("Saved.");
    } finally {
      setBusy(false);
    }
  }

  const forTester: EmailIdentity = {
    ...base,
    from_name: fromName,
    from_email: fromEmail,
    reply_to_email: replyTo.trim() || null,
    id: identity?.id && identity.id !== "new" ? identity.id : base.id,
  };

  return (
    <div className="space-y-4 max-w-lg">
      <label className="flex flex-col gap-1 text-xs text-[var(--z-muted)]">
        From name
        <input
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          disabled={!canWrite || busy}
          className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[var(--z-muted)]">
        From address
        <input
          type="email"
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          disabled={!canWrite || busy}
          className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[var(--z-muted)]">
        Reply-to (optional)
        <input
          type="email"
          value={replyTo}
          onChange={(e) => setReplyTo(e.target.value)}
          disabled={!canWrite || busy}
          className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
        />
      </label>
      <button
        type="button"
        disabled={!canWrite || busy}
        onClick={save}
        className="rounded-[var(--z-radius-md)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-4 py-2 text-sm font-semibold text-[#00ff88] disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save"}
      </button>
      {msg ? <div className="text-xs text-[var(--z-muted)]">{msg}</div> : null}

      {forTester.id !== "new" ? (
        <EmailIdentityTester
          identity={forTester}
          tenantId={tenantId}
          disabled={!canWrite || busy}
        />
      ) : (
        <div className="text-xs text-[var(--z-muted)]">
          Save once to enable test email.
        </div>
      )}
    </div>
  );
}
