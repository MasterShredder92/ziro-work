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

  const totalLeads = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
  return (
    <div>
