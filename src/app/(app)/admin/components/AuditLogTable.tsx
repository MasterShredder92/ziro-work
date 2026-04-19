"use client";

import { useMemo, useState } from "react";
import type { AuditLogEntry } from "@/lib/admin/adminTypes";

export type AuditLogTableProps = {
  entries: AuditLogEntry[];
  tenantId: string;
};

function formatTs(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AuditLogTable({ entries, tenantId }: AuditLogTableProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(entries.map((e) => e.category).filter((c): c is string => !!c)),
      ).sort(),
    [entries],
  );

  const rows = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (category && e.category !== category) return false;
      if (!lower) return true;
      const hay = `${e.event} ${e.actor_id ?? ""} ${e.target_type ?? ""} ${
        e.target_id ?? ""
      }`.toLowerCase();
      return hay.includes(lower);
    });
  }, [entries, search, category]);

  const exportHref = `/api/admin/audit?tenantId=${encodeURIComponent(tenantId)}&format=csv`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events…"
          className="h-9 w-full max-w-sm rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <a
          href={exportHref}
          className="ml-auto h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 text-sm leading-9 text-[var(--z-fg)] hover:bg-white/5"
        >
          Export CSV
        </a>
      </div>

      <div className="overflow-auto rounded-[var(--z-radius-md)] border border-[var(--z-border)]">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-[var(--z-surface)] text-left text-[var(--z-muted)]">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--z-border)] hover:bg-white/5"
              >
                <td className="px-3 py-2 font-mono text-xs text-[var(--z-muted)]">
                  {formatTs(row.created_at)}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{row.event}</td>
                <td className="px-3 py-2 text-xs">{row.category ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {row.actor_id ?? "system"}
                  {row.actor_role ? (
                    <span className="ml-2 text-[var(--z-muted)]">
                      {row.actor_role}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {row.target_type ?? "—"}
                  {row.target_id ? (
                    <span className="ml-1 text-[var(--z-muted)]">
                      {row.target_id}
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => setSelected(row)}
                    className="text-xs text-[var(--z-accent)] hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-[var(--z-muted)]"
                >
                  No audit events match your filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-mono text-sm">{selected.event}</div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-[var(--z-muted)] hover:underline"
            >
              Close
            </button>
          </div>
          <pre className="max-h-[400px] overflow-auto text-xs text-[var(--z-fg)]">
{JSON.stringify(
  {
    before: selected.before,
    after: selected.after,
    diff: selected.diff,
    payload: selected.payload,
  },
  null,
  2,
)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
