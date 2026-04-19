"use client";

import { useState } from "react";
import type { EmailIdentity } from "@/lib/branding";

export interface EmailIdentityTesterProps {
  identity: EmailIdentity;
  tenantId: string;
  disabled?: boolean;
}

export function EmailIdentityTester({
  identity,
  tenantId,
  disabled,
}: EmailIdentityTesterProps) {
  const [toEmail, setToEmail] = useState<string>(identity.reply_to_email ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const send = async () => {
    if (!toEmail) {
      setStatus("error");
      setMessage("Enter a recipient email.");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/branding/email-identity/test", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          tenantId,
          id: identity.id,
          toEmail,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { data?: { messageId?: string }; error?: string }
        | null;
      if (!res.ok) {
        setStatus("error");
        setMessage(json?.error ?? `HTTP ${res.status}`);
        return;
      }
      setStatus("ok");
      setMessage(`Queued (${json?.data?.messageId ?? "stub"}).`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
      <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
        Send test email
      </div>
      <div className="flex items-center gap-2">
        <input
          type="email"
          placeholder="recipient@example.com"
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
          disabled={disabled || status === "sending"}
          className="h-9 flex-1 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
        />
        <button
          type="button"
          onClick={send}
          disabled={disabled || status === "sending"}
          className="h-9 rounded-[var(--z-radius-sm)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Send test"}
        </button>
      </div>
      {message ? (
        <div
          className={`text-xs ${
            status === "ok"
              ? "text-[#00ff88]"
              : status === "error"
                ? "text-[#ff3b6b]"
                : "text-[var(--z-muted)]"
          }`}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
