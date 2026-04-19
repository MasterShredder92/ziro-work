"use client";

import { useMemo, useState } from "react";
import { ACTION_CATALOG } from "@/lib/automation/workflows/types";

export function ActionLibrary() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return ACTION_CATALOG;
    return ACTION_CATALOG.filter(
      (a) =>
        a.type.toLowerCase().includes(needle) ||
        a.label.toLowerCase().includes(needle) ||
        a.description.toLowerCase().includes(needle) ||
        a.category.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <div className="space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search actions..."
        className="w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)]"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((a) => (
          <div
            key={a.type}
            className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-[var(--z-fg)]">
                  {a.label}
                </div>
                <div className="text-[10px] font-mono text-[var(--z-muted)] mt-0.5">
                  {a.type}
                </div>
              </div>
              <span className="inline-flex items-center rounded-full border border-[var(--z-border)] bg-white/5 px-2 py-0.5 text-[10px] text-[var(--z-muted)] uppercase">
                {a.category}
              </span>
            </div>
            <div className="mt-2 text-xs text-[var(--z-muted)]">
              {a.description}
            </div>
            {a.configSchema ? (
              <div className="mt-2 text-[10px] text-[var(--z-muted)]">
                Config:{" "}
                {Object.keys(a.configSchema)
                  .map((k) => k + (a.configSchema?.[k]?.required ? "*" : ""))
                  .join(", ")}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-xs text-[var(--z-muted)] italic">
          No actions match your search.
        </div>
      ) : null}
    </div>
  );
}
