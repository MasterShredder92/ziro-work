"use client";

import { useState, useTransition } from "react";
import type { EmailIdentity } from "@/lib/branding";
import { EmailIdentityTester } from "./EmailIdentityTester";

export function EmailIdentityForm({
  tenantId,
  identity,
  canWrite,
}: {
  tenantId: string;
  identity: EmailIdentity | null;
  canWrite: boolean;
}) {
  const [state, setState] = useState({
    id: identity?.id ?? null,
    from_name: identity?.from_name ?? "Workspace",
    from_email: identity?.from_email ?? "noreply@ziro.work",
    reply_to_email: identity?.reply_to_email ?? "",
    is_primary: identity?.is_primary ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [current, setCurrent] = useState<EmailIdentity | null>(identity);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    if (!canWrite) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/branding/email-identity", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            "x-tenant-id": tenantId,
          },
          body: JSON.stringify({
            identity: {
              id: state.id ?? undefined,
              from_name: state.from_name,
              from_email: state.from_email,
              reply_to_email: state.reply_to_email || null,
              is_primary: state.is_primary,
            },
          }),
        });
        const json = (await res.json().catch(() => null)) as
          | { data?: { identity?: EmailIdentity }; error?: string }
          | null;
        if (!res.ok) {
          setError(json?.error ?? `HTTP ${res.status}`);
          return;
        }
        const row = json?.data?.identity;
        if (row) {
          setCurrent(row);
          setState((s) => ({ ...s, id: row.id }));
        }
        setSavedAt(new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  };

  return (
    <div className="space-y-4">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Email identity
        </div>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">
          From-name, from-address & reply-to
        </h1>
      </header>

      {error ? (
        <div className="rounded-[var(--z-radius-md)] border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 px-3 py-2 text-xs text-[#ff3b6b]">
          {error}
        </div>
      ) : null}

      <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
              From name
            </span>
            <input
              type="text"
              value={state.from_name}
              onChange={(e) => setState({ ...state, from_name: e.target.value })}
              disabled={!canWrite}
              className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
              From email
            </span>
            <input
              type="email"
              value={state.from_email}
              onChange={(e) =>
                setState({ ...state, from_email: e.target.value })
              }
              disabled={!canWrite}
              className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono"
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
              Reply-to
            </span>
            <input
              type="email"
              value={state.reply_to_email}
              onChange={(e) =>
                setState({ ...state, reply_to_email: e.target.value })
              }
              disabled={!canWrite}
              placeholder="support@school.example.com"
              className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.is_primary}
              onChange={(e) =>
                setState({ ...state, is_primary: e.target.checked })
              }
              disabled={!canWrite}
            />
            <span className="text-sm text-[var(--z-fg)]">
              Use as primary sender
            </span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={!canWrite || isPending}
            className="h-9 rounded-[var(--z-radius-sm)] border border-[#c4f036]/40 bg-[#c4f036]/10 px-3 text-xs font-semibold text-[#c4f036] hover:bg-[#c4f036]/20 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save identity"}
          </button>
          {savedAt ? (
            <span className="text-[11px] text-[var(--z-muted)]">
              Saved {new Date(savedAt).toLocaleTimeString()}
            </span>
          ) : null}
          {current?.status ? (
            <span className="ml-auto text-[11px] text-[var(--z-muted)]">
              Status: {current.status}
            </span>
          ) : null}
        </div>
      </section>

      {current ? (
        <EmailIdentityTester
          identity={current}
          tenantId={tenantId}
          disabled={!canWrite}
        />
      ) : null}
    </div>
  );
}
