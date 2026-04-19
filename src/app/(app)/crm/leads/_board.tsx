"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lead } from "@/lib/types/crm";

const STAGES: { id: string; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "prospect", label: "Prospect" },
  { id: "enrolled", label: "Enrolled" },
  { id: "lost", label: "Lost" },
];

function groupLeadsByStage(rows: Lead[]): Record<string, Lead[]> {
  const out: Record<string, Lead[]> = {};
  for (const s of STAGES) out[s.id] = [];
  for (const l of rows) {
    const stage = (l.stage as string | null) ?? "new";
    if (!out[stage]) out[stage] = [];
    out[stage].push(l);
  }
  return out;
}

export function LeadPipelineBoard({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const grouped = groupLeadsByStage(leads);

  async function patchStage(leadId: string, stage: string) {
    setBusy(leadId);
    setErr(null);
    try {
      const res = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErr(body.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function convertLead(leadId: string) {
    setBusy(leadId);
    setErr(null);
    try {
      const res = await fetch(
        `/api/crm/leads/${encodeURIComponent(leadId)}/convert`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErr(body.error ?? `HTTP ${res.status}`);
        return;
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {err ? (
        <div className="mb-3 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-100">
          {err}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((s) => (
          <div
            key={s.id}
            className="flex min-h-[220px] flex-col rounded-lg border border-[#1c1c1e] bg-[#0a0a0c]"
          >
            <div className="border-b border-[#1c1c1e] p-3">
              <div className="text-xs uppercase tracking-wider text-[#606068]">
                {s.label}
              </div>
              <div className="mt-0.5 text-xs text-[#909098]">
                {grouped[s.id]?.length ?? 0} leads
              </div>
            </div>
            <ul className="flex-1 space-y-1 overflow-y-auto p-2">
              {(grouped[s.id] ?? []).map((l) => (
                <li
                  key={l.id}
                  className="rounded-md border border-[#14141a] bg-black p-2 text-xs"
                >
                  <Link
                    href={`/crm/leads/${encodeURIComponent(l.id)}`}
                    className="block font-semibold text-[#f0f0f0] hover:text-[#00ff88]"
                  >
                    {l.first_name} {l.last_name ?? ""}
                  </Link>
                  <div className="mt-0.5 text-[11px] text-[#707078]">
                    {l.email ?? "—"} · {l.phone ?? "—"}
                  </div>
                  {l.instrument ? (
                    <div className="mt-0.5 text-[11px] text-[#909098]">
                      {l.instrument}
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#606068]">
                      Stage
                    </label>
                    <select
                      className="h-7 rounded border border-[#1c1c1e] bg-[#0a0a0c] px-1 text-[11px] text-[#f0f0f0]"
                      value={(l.stage as string) ?? "new"}
                      disabled={busy === l.id}
                      onChange={(e) => patchStage(l.id, e.target.value)}
                    >
                      {STAGES.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-col gap-1 pt-1">
                      {!l.converted_student_id ? (
                        <button
                          type="button"
                          disabled={busy === l.id}
                          onClick={() => convertLead(l.id)}
                          className="rounded bg-[#00ff88]/10 py-1 text-[11px] font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50"
                        >
                          Convert to student
                        </button>
                      ) : (
                        <Link
                          href={`/crm/students/${l.converted_student_id}`}
                          className="text-center text-[11px] text-[#00ff88] hover:underline"
                        >
                          View student
                        </Link>
                      )}
                      <Link
                        href={`/schedule?intent=followup&leadId=${encodeURIComponent(l.id)}`}
                        className="rounded border border-[#1c1c1e] py-1 text-center text-[11px] text-[#909098] hover:bg-white/5"
                      >
                        Schedule follow-up
                      </Link>
                    </div>
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
