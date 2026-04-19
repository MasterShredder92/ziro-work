"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_CHANNELS,
  type Template,
} from "@/lib/templates/types";

function relativeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const day = 1000 * 60 * 60 * 24;
  if (diff < day) return "today";
  if (diff < day * 2) return "yesterday";
  const days = Math.floor(diff / day);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export interface TemplateListProps {
  templates: Template[];
  emptyLabel?: string;
}

export function TemplateList({
  templates,
  emptyLabel = "No templates yet. Create your first template to get started.",
}: TemplateListProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [channel, setChannel] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (category && t.category !== category) return false;
      if (channel && t.channel !== channel) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.subject ?? "").toLowerCase().includes(q) ||
        (t.slug ?? "").toLowerCase().includes(q)
      );
    });
  }, [templates, query, category, channel]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates…"
          className="h-9 flex-1 min-w-[160px] rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-2 text-sm text-[var(--z-fg)]"
          aria-label="Filter category"
        >
          <option value="">All categories</option>
          {TEMPLATE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="h-9 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-2 text-sm text-[var(--z-fg)]"
          aria-label="Filter channel"
        >
          <option value="">All channels</option>
          {TEMPLATE_CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Link
          href="/templates/new"
          className="h-9 rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] px-3 text-sm font-semibold text-[var(--z-accent)] leading-9"
        >
          New template
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
          {templates.length === 0 ? emptyLabel : "No templates match your filters."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[var(--z-border)] bg-[var(--z-surface)]">
          <table className="w-full text-sm">
            <thead className="bg-[color-mix(in_oklab,var(--z-surface),black_3%)] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]">
              <tr>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Category</th>
                <th className="px-4 py-2 font-semibold">Channel</th>
                <th className="px-4 py-2 font-semibold">Version</th>
                <th className="px-4 py-2 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-[var(--z-border)] hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/templates/${t.id}`}
                      className="font-semibold text-[var(--z-fg)] hover:text-[var(--z-accent)]"
                    >
                      {t.name}
                    </Link>
                    {t.description ? (
                      <div className="text-xs text-[var(--z-muted)]">
                        {t.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-[var(--z-fg)]/80">{t.category}</td>
                  <td className="px-4 py-2 text-[var(--z-fg)]/80">{t.channel}</td>
                  <td className="px-4 py-2 text-[var(--z-fg)]/80">
                    v{t.currentVersion}
                  </td>
                  <td className="px-4 py-2 text-[var(--z-muted)]">
                    {relativeDate(t.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
