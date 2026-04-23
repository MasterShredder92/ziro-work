"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/* ─── Types ──────────────────────────────────────────────── */
type SearchResult = {
  student_id: string;
  student_first_name: string;
  student_last_name: string;
  student_status: string;
  student_instrument: string | null;
  family_id: string;
  family_name: string;
  family_primary_email: string | null;
  family_primary_phone: string | null;
  family_status: string;
};

/* ─── Status badge color ─────────────────────────────────── */
function statusDot(status: string): string {
  const s = status?.toLowerCase();
  if (s === "active") return "bg-emerald-500";
  if (s === "paused" || s === "trial") return "bg-blue-500";
  return "bg-zinc-400";
}

/* ─── OmniSearch ─────────────────────────────────────────── */
export function OmniSearch({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus on mount
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/crm/search?q=${encodeURIComponent(q)}&limit=10`,
          { headers: { "x-tenant-id": DEFAULT_TENANT_ID } }
        );
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const json = await res.json();
        const items: SearchResult[] = json.data?.items ?? json.items ?? [];
        setResults(items);
        setActiveIdx(0);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search error");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function navigate(href: string) {
    router.push(href);
    onClose?.();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[activeIdx];
      if (r) navigate(`/students/${r.student_id}`);
    }
  }

  const trimmed = query.trim();

  return (
    <div className="flex flex-col gap-3">
      {/* Input */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
          fill="none" viewBox="0 0 18 18" stroke="currentColor" strokeWidth={1.5}
          aria-hidden
        >
          <circle cx="8" cy="8" r="5.5" />
          <path d="M12.5 12.5l3 3" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search students or families…"
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
          autoComplete="off"
          spellCheck={false}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 dark:text-zinc-500">
            Searching…
          </span>
        )}
      </div>

      {/* Results */}
      {!trimmed ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Type a student name, family name, email, or phone number.
        </p>
      ) : error ? (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      ) : !loading && results.length === 0 ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          No students or families found matching &ldquo;{trimmed}&rdquo;
        </p>
      ) : results.length > 0 ? (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800" role="listbox">
          {results.map((r, idx) => {
            const studentHref = `/students/${r.student_id}`;
            const familyHref = `/crm/families/${r.family_id}`;
            const isActive = idx === activeIdx;
            return (
              <li
                key={r.student_id}
                role="option"
                aria-selected={isActive}
                className={[
                  "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
                ].join(" ")}
                onMouseEnter={() => setActiveIdx(idx)}
              >
                {/* Left: student info */}
                <button
                  type="button"
                  onClick={() => navigate(studentHref)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  {/* Status dot */}
                  <span
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${statusDot(r.student_status)}`}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {r.student_first_name} {r.student_last_name}
                      {r.student_instrument && (
                        <span className="ml-1.5 text-xs font-normal text-zinc-400 dark:text-zinc-500">
                          · {r.student_instrument}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                      {r.family_name
                        ? r.family_name.toLowerCase().endsWith("family")
                          ? r.family_name
                          : `The ${r.family_name} Family`
                        : "—"}
                    </p>
                  </div>
                </button>

                {/* Right: View Family button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(familyHref);
                  }}
                  className="flex-shrink-0 rounded-md px-2 py-1 text-xs font-medium text-zinc-400 ring-1 ring-zinc-200 hover:text-zinc-600 hover:ring-zinc-300 dark:text-zinc-500 dark:ring-zinc-700 dark:hover:text-zinc-300 dark:hover:ring-zinc-600"
                  title={`View ${r.family_name} family`}
                >
                  View Family
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
