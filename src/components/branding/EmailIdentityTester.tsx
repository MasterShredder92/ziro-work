"use client";

import { useState } from "react";

type EmailIdentityTesterProps = {
  tenantId: string;
  identityId: string;
  disabled?: boolean;
};

export function EmailIdentityTester({
  tenantId,
  identityId,
  disabled,
}: EmailIdentityTesterProps) {
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    if (!to.trim()) return;
    setStatus("sending");
    setMsg(null);
    try {
      const res = await fetch("/api/branding/email-identity", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({ test: { id: identityId, to: to.trim() } }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "Request failed");
      setStatus("ok");
      setMsg(`Sent (stub): ${body?.data?.messageId ?? "ok"}`);
    } catch (e) {
      setStatus("err");
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase text-[var(--z-muted)]">
          Test recipient
        </span>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          disabled={disabled}
          placeholder="you@example.com"
          className="min-w-[220px] rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm"
        />
      </label>
      <button
        type="button"
        disabled={disabled || status === "sending"}
        onClick={send}
        className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-sm font-semibold text-[var(--z-fg)] hover:text-[#00ff88] disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send test"}
      </button>
      {msg ? (
        <span
          className={`text-xs ${status === "ok" ? "text-[#00ff88]" : "text-[var(--z-danger)]"}`}
        >
          {msg}
        </span>
      ) : null}
    </div>
  );
}
