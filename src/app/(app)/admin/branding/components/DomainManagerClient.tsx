"use client";

import { useMemo, useState } from "react";
import type { CustomDomain } from "@/lib/branding";
import { DNSStatusPanel } from "@/components/branding/DNSStatusPanel";
import { DomainStatusBadge } from "./DomainStatusBadge";

export function DomainManagerClient({
  tenantId,
  canWrite,
  domains: initial,
}: {
  tenantId: string;
  canWrite: boolean;
  domains: CustomDomain[];
}) {
  const [domains, setDomains] = useState(initial);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const qs = useMemo(() => `tenantId=${encodeURIComponent(tenantId)}`, [tenantId]);

  async function addDomain() {
    if (!canWrite || !name.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/branding/domain?${qs}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain_name: name.trim() }),
      });
      const j = (await res.json().catch(() => null)) as {
        data?: { domain?: CustomDomain };
        error?: string;
      } | null;
      if (!res.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      if (j?.data?.domain) setDomains((d) => [...d, j.data!.domain!]);
      setName("");
      setMsg("Domain added.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(id: string, action: "verify" | "mark_verified" | "activate") {
    if (!canWrite) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/branding/domain?${qs}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const j = (await res.json().catch(() => null)) as {
        data?: { domain?: CustomDomain };
        error?: string;
      } | null;
      if (!res.ok) {
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      if (j?.data?.domain) {
        setDomains((list) =>
          list.map((x) => (x.id === id ? j.data!.domain! : x)),
        );
      }
      setMsg("Updated.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!canWrite) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/branding/domain?${qs}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setMsg(j?.error ?? `HTTP ${res.status}`);
        return;
      }
      setDomains((list) => list.filter((x) => x.id !== id));
      setMsg("Removed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <label className="flex flex-col gap-1 text-xs text-[var(--z-muted)]">
          Add domain
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="portal.school.com"
            disabled={!canWrite || busy}
            className="h-9 min-w-[240px] rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
          />
        </label>
        <button
          type="button"
          disabled={!canWrite || busy}
          onClick={addDomain}
          className="h-9 rounded-[var(--z-radius-sm)] border border-[#c4f036]/40 bg-[#c4f036]/10 px-3 text-xs font-semibold text-[#c4f036] disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <DNSStatusPanel
        key={
          domains[0]?.domain_name?.trim() ||
          name.trim() ||
          "__no_domain__"
        }
        domain={
          domains[0]?.domain_name?.trim() ||
          (name.trim() ? name.trim() : null)
        }
      />

      <ul className="space-y-2">
        {domains.map((d) => (
          <li
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2"
          >
            <div>
              <div className="font-mono text-sm text-[var(--z-fg)]">{d.domain_name}</div>
              <div className="text-[11px] text-[var(--z-muted)]">
                CNAME → {d.verification_target ?? "cname.ziro.work"} · token{" "}
                <span className="font-mono">{d.verification_token.slice(0, 8)}…</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DomainStatusBadge status={d.status} />
              <button
                type="button"
                disabled={!canWrite || busy}
                onClick={() => verify(d.id, "verify")}
                className="h-8 rounded border border-[var(--z-border)] px-2 text-[11px] text-[var(--z-fg)] disabled:opacity-50"
              >
                Check DNS
              </button>
              <button
                type="button"
                disabled={!canWrite || busy}
                onClick={() => verify(d.id, "mark_verified")}
                className="h-8 rounded border border-[var(--z-border)] px-2 text-[11px] text-[var(--z-fg)] disabled:opacity-50"
              >
                Mark verified
              </button>
              <button
                type="button"
                disabled={!canWrite || busy}
                onClick={() => verify(d.id, "activate")}
                className="h-8 rounded border border-[#c4f036]/40 px-2 text-[11px] text-[#c4f036] disabled:opacity-50"
              >
                Activate
              </button>
              <button
                type="button"
                disabled={!canWrite || busy}
                onClick={() => remove(d.id)}
                className="h-8 rounded border border-[var(--z-border)] px-2 text-[11px] text-[var(--z-muted)] disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      {msg ? <div className="text-xs text-[var(--z-muted)]">{msg}</div> : null}
    </div>
  );
}
