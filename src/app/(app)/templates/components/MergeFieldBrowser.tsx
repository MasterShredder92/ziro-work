"use client";

import { useMemo, useState } from "react";
import type { MergeField } from "@/lib/templates/types";

export interface MergeFieldBrowserProps {
  mergeFields: MergeField[];
  missing?: string[];
  onInsert?: (token: string) => void;
}

const GROUP_LABELS: Record<string, string> = {
  student: "Student (Progress OS)",
  family: "Family (CRM OS)",
  teacher: "Teacher (CRM OS)",
  lesson: "Lesson (Messaging OS)",
  tenant: "Workspace",
  custom: "Custom",
};

export function MergeFieldBrowser({
  mergeFields,
  missing,
  onInsert,
}: MergeFieldBrowserProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mergeFields;
    return mergeFields.filter(
      (f) =>
        f.path.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q),
    );
  }, [mergeFields, query]);

  const groups = useMemo(() => {
    return filtered.reduce<Record<string, MergeField[]>>((acc, f) => {
      const key = f.group ?? "custom";
      if (!acc[key]) acc[key] = [];
      acc[key].push(f);
      return acc;
    }, {});
  }, [filtered]);

  const groupKeys = Object.keys(groups).sort();
  const missingSet = new Set(missing ?? []);

  return (
    <div className="space-y-3 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Merge fields
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="w-36 rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-xs text-[var(--z-fg)]"
        />
      </div>

      {missing && missing.length > 0 ? (
        <div className="rounded-md border border-[color-mix(in_oklab,var(--z-danger),transparent_50%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] p-2 text-xs text-[var(--z-danger)]">
          <div className="font-semibold">Unresolved in last render:</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {missing.map((m) => (
              <code
                key={m}
                className="rounded bg-[color-mix(in_oklab,var(--z-danger),transparent_80%)] px-1.5 py-0.5"
              >{`{{${m}}}`}</code>
            ))}
          </div>
        </div>
      ) : null}

      <div className="max-h-[400px] space-y-3 overflow-y-auto">
        {groupKeys.length === 0 ? (
          <div className="text-xs text-[var(--z-muted)]">No matches.</div>
        ) : null}
        {groupKeys.map((key) => (
          <div key={key}>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              {GROUP_LABELS[key] ?? key}
            </div>
            <ul className="space-y-1">
              {groups[key].map((f) => {
                const token = `{{${f.path}}}`;
                const isMissing = missingSet.has(f.path);
                return (
                  <li
                    key={f.path}
                    className={`rounded-md border px-2 py-1.5 text-xs ${
                      isMissing
                        ? "border-[color-mix(in_oklab,var(--z-danger),transparent_55%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)]"
                        : "border-[var(--z-border)] bg-[var(--z-surface-2)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <code className="truncate text-[var(--z-accent)]">
                        {token}
                      </code>
                      {onInsert ? (
                        <button
                          type="button"
                          onClick={() => onInsert(token)}
                          className="shrink-0 rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--z-fg)] hover:text-[var(--z-accent)]"
                        >
                          Insert
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--z-fg)]/80">
                      {f.label}
                    </div>
                    {f.description ? (
                      <div className="text-[11px] text-[var(--z-muted)]">
                        {f.description}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
