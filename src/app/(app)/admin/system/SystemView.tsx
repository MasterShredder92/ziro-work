"use client";

import { useMemo, useState } from "react";
import type { DeadLetterJobRecord, JobRecord } from "@/lib/queue/types";
import type { HealthReport, HealthStatus } from "@/lib/observability/health";

interface Props {
  activeJobs: JobRecord[];
  recentJobs: JobRecord[];
  deadLetter: DeadLetterJobRecord[];
  health: HealthReport;
}

const STATUS_COLOR: Record<HealthStatus, string> = {
  ok: "#00ff88",
  degraded: "#f4c430",
  down: "#ff5566",
};

export function SystemView({ activeJobs, recentJobs, deadLetter, health }: Props) {
  const [tab, setTab] = useState<"active" | "recent" | "dead">("active");
  const [requeuing, setRequeuing] = useState<string | null>(null);

  const summary = useMemo(
    () => ({
      active: activeJobs.length,
      recent: recentJobs.length,
      dead: deadLetter.length,
    }),
    [activeJobs, recentJobs, deadLetter],
  );

  async function requeue(id: string) {
    setRequeuing(id);
    try {
      const res = await fetch(`/admin/api/system/dead-letter/${id}/requeue`, { method: "POST" });
      if (res.ok) window.location.reload();
    } finally {
      setRequeuing(null);
    }
  }

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold text-[#f0f0f0] mb-1">System health</h1>
        <p className="text-sm text-[#8a8a92]">
          Background jobs, dead-letter queue, and health checks for this environment.
        </p>
      </header>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#606068] mb-3">
          Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {health.checks.map((c) => (
            <div
              key={c.name}
              className="rounded-lg border border-[#202026] bg-[#0d0d10] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-[#d4d4d4] font-medium capitalize">
                  {c.name.replace(/_/g, " ")}
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: STATUS_COLOR[c.status] }}
                >
                  {c.status}
                </span>
              </div>
              <div className="text-xs text-[#606068] mt-2">{c.latencyMs}ms</div>
              {c.message ? (
                <div className="text-[11px] text-[#80808a] mt-1 truncate" title={c.message}>
                  {c.message}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <TabButton active={tab === "active"} onClick={() => setTab("active")}>
            Active · {summary.active}
          </TabButton>
          <TabButton active={tab === "recent"} onClick={() => setTab("recent")}>
            Recent · {summary.recent}
          </TabButton>
          <TabButton active={tab === "dead"} onClick={() => setTab("dead")}>
            Dead-letter · {summary.dead}
          </TabButton>
        </div>

        {tab === "active" ? <JobTable jobs={activeJobs} empty="No active jobs." /> : null}
        {tab === "recent" ? <JobTable jobs={recentJobs} empty="No recent jobs." /> : null}
        {tab === "dead" ? (
          <DeadLetterTable
            rows={deadLetter}
            requeuing={requeuing}
            onRequeue={requeue}
          />
        ) : null}
      </section>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${
        active
          ? "bg-[#1a1a1f] text-[#f0f0f0] border-[#2a2a30]"
          : "bg-transparent text-[#8a8a92] border-transparent hover:text-[#d4d4d4]"
      }`}
    >
      {children}
    </button>
  );
}

function JobTable({ jobs, empty }: { jobs: JobRecord[]; empty: string }) {
  if (jobs.length === 0) {
    return <div className="text-sm text-[#606068] italic py-6">{empty}</div>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-[#202026]">
      <table className="w-full text-xs">
        <thead className="text-[10px] uppercase text-[#606068] bg-[#0d0d10]">
          <tr>
            <th className="text-left px-3 py-2">Kind</th>
            <th className="text-left px-3 py-2">Status</th>
            <th className="text-left px-3 py-2">Attempts</th>
            <th className="text-left px-3 py-2">Run at</th>
            <th className="text-left px-3 py-2">Updated</th>
            <th className="text-left px-3 py-2">Last error</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} className="border-t border-[#1a1a1f]">
              <td className="px-3 py-2 font-mono text-[#d4d4d4]">{j.kind}</td>
              <td className="px-3 py-2">{j.status}</td>
              <td className="px-3 py-2">
                {j.attempts}/{j.maxAttempts}
              </td>
              <td className="px-3 py-2 text-[#80808a]">{fmt(j.runAt)}</td>
              <td className="px-3 py-2 text-[#80808a]">{fmt(j.updatedAt)}</td>
              <td className="px-3 py-2 text-[#ff8899] max-w-[24rem] truncate" title={j.lastError ?? ""}>
                {j.lastError ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeadLetterTable({
  rows,
  requeuing,
  onRequeue,
}: {
  rows: DeadLetterJobRecord[];
  requeuing: string | null;
  onRequeue: (id: string) => void;
}) {
  if (rows.length === 0) {
    return <div className="text-sm text-[#606068] italic py-6">No dead-letter jobs.</div>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-[#202026]">
      <table className="w-full text-xs">
        <thead className="text-[10px] uppercase text-[#606068] bg-[#0d0d10]">
          <tr>
            <th className="text-left px-3 py-2">Kind</th>
            <th className="text-left px-3 py-2">Attempts</th>
            <th className="text-left px-3 py-2">Failed at</th>
            <th className="text-left px-3 py-2">Error</th>
            <th className="text-right px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[#1a1a1f]">
              <td className="px-3 py-2 font-mono text-[#d4d4d4]">{r.kind}</td>
              <td className="px-3 py-2">{r.attempts}</td>
              <td className="px-3 py-2 text-[#80808a]">{fmt(r.failedAt)}</td>
              <td className="px-3 py-2 text-[#ff8899] max-w-[24rem] truncate" title={r.lastError ?? ""}>
                {r.lastError ?? ""}
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  disabled={requeuing === r.id}
                  onClick={() => onRequeue(r.id)}
                  className="text-[11px] px-2 py-1 rounded bg-[#1a1a1f] border border-[#2a2a30] text-[#d4d4d4] disabled:opacity-50"
                >
                  {requeuing === r.id ? "Requeuing…" : "Requeue"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
