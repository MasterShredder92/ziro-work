"use client";

import { useEffect, useRef, useState } from "react";

type DnsCheckStatus = "idle" | "checking" | "ok" | "pending";

const CHECK_MS = 1500;

function statusLabel(s: DnsCheckStatus): string {
  switch (s) {
    case "checking":
      return "Checking…";
    case "ok":
      return "Looks good";
    case "pending":
      return "Pending propagation";
    default:
      return "Not checked";
  }
}

function statusClass(s: DnsCheckStatus): string {
  switch (s) {
    case "ok":
      return "text-green-500";
    case "pending":
      return "text-amber-500";
    case "checking":
      return "text-[var(--z-muted)]";
    default:
      return "text-gray-400";
  }
}

export function DNSStatusPanel({ domain }: { domain: string | null }) {
  const [status, setStatus] = useState<DnsCheckStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const displayDomain =
    domain && domain.trim() ? domain.trim() : "No domain configured";

  function runCheck() {
    const host = domain?.trim() ?? "";
    if (!host || status === "checking") return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("checking");

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const lower = host.toLowerCase();
      if (lower.endsWith(".test")) setStatus("ok");
      else setStatus("pending");
    }, CHECK_MS);
  }

  return (
    <section
      className="rounded-[var(--brand-card-radius,1rem)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3"
      aria-labelledby="dns-status-heading"
    >
      <h2
        id="dns-status-heading"
        className="text-sm font-semibold text-[var(--z-fg)]"
      >
        DNS Status
      </h2>
      <p className="font-mono text-xs text-[var(--z-muted)] break-all">
        {displayDomain}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={status === "checking" || !domain?.trim()}
          onClick={runCheck}
          className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 text-xs font-semibold text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50"
        >
          Check DNS
        </button>
        <span className={`text-xs font-medium ${statusClass(status)}`}>
          Status: {statusLabel(status)}
        </span>
      </div>
      <p className="text-[10px] leading-snug text-[var(--z-muted)]">
        Stub preview only — no DNS lookups are performed.
      </p>
    </section>
  );
}
