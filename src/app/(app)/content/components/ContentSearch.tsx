"use client";

import Link from "next/link";
import { useState } from "react";
import type { ContentSearchResult } from "@/lib/content/types";

export type ContentSearchProps = {
  tenantId: string;
  initialQuery?: string;
};

export function ContentSearch({ tenantId, initialQuery = "" }: ContentSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ContentSearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setStatus("pending");
    setError(null);
    try {
      const url = new URL("/content/api/search", window.location.origin);
      url.searchParams.set("tenantId", tenantId);
      url.searchParams.set("q", q);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const body = (await res.json()) as {
        data: { results: ContentSearchResult[] };
      };
      setResults(body.data?.results ?? []);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={runSearch}
        className="flex gap-2 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles, descriptions, tags…"
          className="flex-1 rounded-md bg-transparent px-2 py-1.5 text-sm text-[var(--z-fg)] outline-none"
        />
        <button
          type="submit"
          disabled={status === "pending"}
          className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-sm font-semibold text-[var(--z-fg)] hover:text-[#c4f036] disabled:opacity-50"
        >
          {status === "pending" ? "Searching…" : "Search"}
        </button>
      </form>

      {error ? (
        <div className="text-xs text-[var(--z-danger)]">{error}</div>
      ) : null}

      {results.length > 0 ? (
        <ul className="space-y-1.5">
          {results.map((r) => (
            <li
              key={r.item.id}
              className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/content/${r.item.id}`}
                  className="text-sm font-semibold text-[var(--z-fg)] hover:text-[#c4f036]"
                >
                  {r.item.title}
                </Link>
                <span className="text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
                  score {r.score.toFixed(1)}
                </span>
              </div>
              {r.snippet ? (
                <div className="mt-0.5 text-xs text-[var(--z-muted)] line-clamp-2">
                  {r.snippet}
                </div>
              ) : null}
              {r.matchedTags.length > 0 ? (
                <div className="mt-1 text-[11px] text-[var(--z-muted)]">
                  Matched tags: {r.matchedTags.join(", ")}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : query.trim() && status !== "pending" ? (
        <div className="rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-6 text-center text-xs text-[var(--z-muted)]">
          No matches for <span className="text-[var(--z-fg)]">{query}</span>
        </div>
      ) : null}
    </div>
  );
}
