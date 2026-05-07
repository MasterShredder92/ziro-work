"use client";

import { useState, useTransition } from "react";
import type { CustomDomain } from "@/lib/branding";
import { DomainStatusBadge } from "./DomainStatusBadge";

export function DomainManager({
  tenantId,
  domains,
  canWrite,
}: {
  tenantId: string;
  domains: CustomDomain[];
  canWrite: boolean;
}) {
  const [list, setList] = useState<CustomDomain[]>(domains);
  const [newDomain, setNewDomain] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addDomain = () => {
    if (!canWrite || !newDomain.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/branding/domain", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-tenant-id": tenantId,
          },
          body: JSON.stringify({ tenantId, domain_name: newDomain.trim() }),
        });
        const json = (await res.json().catch(() => null)) as
          | { data?: { domain?: CustomDomain }; error?: string }
          | null;
        if (!res.ok) {
          setError(json?.error ?? `HTTP ${res.status}`);
          return;
        }
        const row = json?.data?.domain;
        if (row) {
          setList((arr) => {
            const next = arr.filter((d) => d.id !== row.id);
            next.unshift(row);
            return next;
          });
          setNewDomain("");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  };

  const act = (domain: CustomDomain, action: "verify" | "activate" | "delete") => {
    if (!canWrite) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/branding/domain", {
          method: action === "delete" ? "DELETE" : "PATCH",
          headers: {
            "content-type": "application/json",
            "x-tenant-id": tenantId,
          },
          body: JSON.stringify(
            action === "delete"
              ? { id: domain.id }
              : {
                  id: domain.id,
                  action:
                    action === "activate" ? "activate" : "verify",
                },
          ),
        });
        const json = (await res.json().catch(() => null)) as
          | { data?: { domain?: CustomDomain }; error?: string }
          | null;
        if (!res.ok) {
          setError(json?.error ?? `HTTP ${res.status}`);
          return;
        }
        if (action === "delete") {
          setList((arr) => arr.filter((d) => d.id !== domain.id));
        } else if (json?.data?.domain) {
          const next = json.data.domain;
          setList((arr) => arr.map((d) => (d.id === next.id ? next : d)));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  };

  return (
    <div className="space-y-4">
      <header>
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Domain manager
        </div>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">
          Custom domains & CNAME verification
        </h1>
      </header>

      {error ? (
        <div className="rounded-[var(--z-radius-md)] border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 px-3 py-2 text-xs text-[#ff3b6b]">
          {error}
        </div>
      ) : null}

      <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3">
        <div className="text-sm font-semibold text-[var(--z-fg)]">Add domain</div>
        <div className="flex flex-col md:flex-row items-stretch gap-2">
          <input
            type="text"
            placeholder="school.example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            disabled={!canWrite || isPending}
            className="h-9 flex-1 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono"
          />
          <button
            type="button"
            onClick={addDomain}
            disabled={!canWrite || isPending}
            className="h-9 rounded-[var(--z-radius-sm)] border border-[#c4f036]/40 bg-[#c4f036]/10 px-3 text-xs font-semibold text-[#c4f036] hover:bg-[#c4f036]/20 disabled:opacity-50"
          >
            {isPending ? "Adding…" : "Add domain"}
          </button>
        </div>
        <div className="text-[11px] text-[var(--z-muted)]">
          After adding, create a CNAME record pointing to{" "}
          <span className="font-mono">cname.ziro.work</span> and click Verify.
        </div>
      </section>

      <section className="space-y-3">
        {list.length === 0 ? (
          <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-xs text-[var(--z-muted)]">
            No domains yet. Add one above.
          </div>
        ) : null}
        {list.map((d) => (
          <div
            key={d.id}
            className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="font-mono text-sm text-[var(--z-fg)] truncate">
                {d.domain_name}
              </div>
              <div className="sm:ml-auto flex items-center gap-2">
                <DomainStatusBadge status={d.status} />
                {d.is_primary ? (
                  <span className="text-[10px] uppercase tracking-wider text-[#c4f036] border border-[#c4f036]/40 rounded px-1.5 py-0.5">
                    Primary
                  </span>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-[var(--z-muted)]">
              <div>
                <span className="text-[var(--z-fg)] font-mono">CNAME → </span>
                <span className="font-mono">
                  {d.verification_target ?? "cname.ziro.work"}
                </span>
              </div>
              <div>
                <span className="text-[var(--z-fg)]">Token: </span>
                <span className="font-mono">{d.verification_token}</span>
              </div>
              {d.verified_at ? (
                <div>
                  Verified at {new Date(d.verified_at).toLocaleString()}
                </div>
              ) : null}
              {d.last_checked_at ? (
                <div>
                  Last checked {new Date(d.last_checked_at).toLocaleString()}
                </div>
              ) : null}
              {d.failure_reason ? (
                <div className="text-[#ff3b6b]">{d.failure_reason}</div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => act(d, "verify")}
                disabled={!canWrite || isPending || d.status === "verified" || d.status === "active"}
                className="h-8 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 text-xs text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50"
              >
                Verify
              </button>
              <button
                type="button"
                onClick={() => act(d, "activate")}
                disabled={
                  !canWrite ||
                  isPending ||
                  (d.status !== "verified" && d.status !== "active")
                }
                className="h-8 rounded-[var(--z-radius-sm)] border border-[#c4f036]/40 bg-[#c4f036]/10 px-3 text-xs font-semibold text-[#c4f036] hover:bg-[#c4f036]/20 disabled:opacity-50"
              >
                {d.status === "active" ? "Active" : "Activate"}
              </button>
              <button
                type="button"
                onClick={() => act(d, "delete")}
                disabled={!canWrite || isPending}
                className="h-8 rounded-[var(--z-radius-sm)] border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 px-3 text-xs text-[#ff3b6b] hover:bg-[#ff3b6b]/20 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
