"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lead } from "@/lib/types/crm";

/** Matches `Database["public"]["Enums"]["lead_stage"]` — keep in sync with `leads/page.tsx` grouping. */
export const LEAD_KANBAN_STAGES = [
  "inquiry",
  "contacted",
  "scheduled",
  "enrolled",
  "lost",
] as const;

type Stage = (typeof LEAD_KANBAN_STAGES)[number];

const STAGES = LEAD_KANBAN_STAGES;

function leadIdleDays(l: Lead): number | null {
  const row = l as Lead & { updated_at?: string | null; created_at?: string | null };
  const iso = row.updated_at ?? row.created_at;
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

export function LeadKanbanBoard({
  grouped: initial,
}: {
  grouped: Record<string, Lead[]>;
}) {
  const router = useRouter();
  const [grouped, setGrouped] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function patchStage(leadId: string, stage: Stage) {
    setBusyId(leadId);
    setErr(null);
    try {
      const res = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setGrouped((prev) => {
        let moved: Lead | undefined;
        const next: Record<string, Lead[]> = {};
        for (const s of STAGES) next[s] = [];
        for (const s of STAGES) {
          for (const l of prev[s] ?? []) {
            if (l.id === leadId) {
              moved = { ...l, stage };
            } else {
              next[s].push(l);
            }
          }
        }
        if (moved) {
          next[stage].push(moved);
        }
        return next;
      });
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function convertLead(leadId: string) {
    setBusyId(leadId);
    setErr(null);
    try {
      const res = await fetch(
        `/api/crm/leads/${encodeURIComponent(leadId)}/convert`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as {
        data?: { leadId?: string; studentId?: string };
      };
      const sid = json.data?.studentId;
      router.refresh();
      if (sid) {
        router.push(`/crm/students/${encodeURIComponent(sid)}`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function scheduleFollowup(leadId: string) {
    const when = window.prompt(
      "Follow-up time (ISO date/time, e.g. 2026-04-20T15:00:00)",
    );
    if (!when?.trim()) return;
    setBusyId(leadId);
    setErr(null);
    try {
      const res = await fetch(
        `/api/crm/leads/${encodeURIComponent(leadId)}/followup`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ when: when.trim() }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {err ? (
        <div className="mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {err}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((s) => (
          <div
            key={s}
            className="flex min-h-[220px] flex-col rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)]"
          >
            <div className="border-b border-[var(--z-border,#1c1c1e)] p-3">
              <div className="text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]">
                {s}
              </div>
              <div className="mt-0.5 text-xs text-[var(--z-muted,#909098)]">
                {grouped[s]?.length ?? 0} leads
              </div>
            </div>
            <ul className="flex-1 space-y-2 overflow-y-auto p-2">
              {(grouped[s] ?? []).map((l) => (
                <li
                  key={l.id}
                  className="flex flex-col gap-2 rounded-md border border-[#14141a] bg-black p-2 text-xs"
                >
                  <Link
                    href={`/crm/contacts/${encodeURIComponent(`lead:${l.id}`)}`}
                    className="font-semibold text-[var(--z-fg,#f0f0f0)] hover:text-[var(--z-accent,#00ff88)]"
                  >
                    {l.first_name} {l.last_name ?? ""}
                  </Link>
                  <div className="text-[11px] text-[#707078]">
                    {l.email ?? "—"} · {l.phone ?? "—"}
                  </div>
                  {l.instrument ? (
                    <div className="text-[11px] text-[var(--z-muted,#909098)]">
                      {l.instrument}
                    </div>
                  ) : null}
                  {(() => {
                    const days = leadIdleDays(l);
                    if (days == null) return null;
                    const tone =
                      days >= 14 ? "hot" : days >= 7 ? "warn" : "muted";
                    const cls =
                      tone === "hot"
                        ? "border-red-500/40 bg-red-500/15 text-red-200"
                        : tone === "warn"
                          ? "border-amber-500/40 bg-amber-500/15 text-amber-100"
                          : "border-[var(--z-border,#1c1c1e)] bg-white/[0.04] text-[#909098]";
                    return (
                      <div
                        className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}
                        title="Days since last update on this lead"
                      >
                        {days === 0 ? "Updated today" : `${days}d since update`}
                      </div>
                    );
                  })()}
                  <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wider text-[#606068]">
                    Stage
                    <select
                      className="rounded border border-[#1c1c1e] bg-[#0a0a0c] px-1 py-1 text-[11px] text-[#f0f0f0]"
                      value={
                        STAGES.includes((l.stage as Stage) ?? STAGES[0])
                          ? ((l.stage as Stage) ?? STAGES[0])
                          : STAGES[0]
                      }
                      disabled={busyId === l.id}
                      onChange={(e) =>
                        patchStage(l.id, e.target.value as Stage)
                      }
                    >
                      {STAGES.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={busyId === l.id}
                      onClick={() => convertLead(l.id)}
                      className="rounded bg-[var(--z-accent,#00ff88)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--z-accent,#00ff88)] hover:bg-[var(--z-accent,#00ff88)]/25 disabled:opacity-50"
                    >
                      Convert
                    </button>
                    <button
                      type="button"
                      disabled={busyId === l.id}
                      onClick={() => scheduleFollowup(l.id)}
                      className="rounded border border-[var(--z-border,#1c1c1e)] px-2 py-0.5 text-[10px] text-[var(--z-muted,#909098)] hover:bg-white/5 disabled:opacity-50"
                    >
                      Follow-up
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
