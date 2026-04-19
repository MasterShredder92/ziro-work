"use client";

import { useState } from "react";
import Image from "next/image";
import { PageShell } from "@/components/layouts/PageShell";
import type { PeriodSummary, AgentSummary } from "@/lib/agents/agentSavings";
import { AGENT_METADATA } from "@/lib/agents/agentMetadata";

interface AgentReportsClientProps {
  monthly: PeriodSummary;
  weekly: PeriodSummary;
}

function fmtUsd(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Hero summary banner ──────────────────────────────────────────────────────
function HeroBanner({ period }: { period: PeriodSummary }) {
  return (
    <div className="rounded-2xl border border-[var(--z-border)] bg-gradient-to-br from-[var(--z-surface)] to-[var(--z-surface-2)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--z-muted)]">{period.label}</p>
          <h2 className="mt-1 text-3xl font-black text-[#4ADE80]">{fmtUsd(period.totalSavedUsd)}</h2>
          <p className="mt-1 text-sm text-[var(--z-muted)]">saved in administrative costs</p>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-extrabold text-[var(--z-fg)]">{period.totalTasks}</div>
            <div className="text-xs text-[var(--z-muted)]">tasks completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold text-[var(--z-fg)]">
              {fmtHours(period.agents.reduce((s, a) => s + a.totalMinutes, 0))}
            </div>
            <div className="text-xs text-[var(--z-muted)]">hours worked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold text-[#F87171]">{period.totalOwnerTasks}</div>
            <div className="text-xs text-[var(--z-muted)]">tasks needed from you</div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-[var(--z-muted)]">
        Hourly rates based on US national averages (BLS, ZipRecruiter, Indeed, Glassdoor, Salary.com — April 2026).
        Rates represent what you would pay a human employee to perform the equivalent role.
      </p>
    </div>
  );
}

// ─── Agent row in the summary table ──────────────────────────────────────────
function AgentSummaryRow({
  summary,
  isExpanded,
  onToggle,
}: {
  summary: AgentSummary;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const meta = AGENT_METADATA[summary.agentId];
  const accent = meta?.accent ?? "#888";

  return (
    <>
      <div
        className="grid cursor-pointer items-center border-b transition-colors hover:bg-white/[0.02]"
        style={{
          gridTemplateColumns: "40px 1.5fr 80px 80px 100px 120px 40px",
          columnGap: "12px",
          padding: "10px 16px",
          borderColor: "var(--z-border)",
        }}
        onClick={onToggle}
      >
        {/* Avatar */}
        <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full" style={{ boxShadow: `0 0 8px ${accent}66` }}>
          {meta ? (
            <Image src={meta.imagePath} alt={meta.displayName} fill className="object-cover" />
          ) : (
            <div className="h-full w-full rounded-full" style={{ background: accent }} />
          )}
        </div>

        {/* Name + role */}
        <div>
          <div className="text-sm font-bold" style={{ color: accent }}>{summary.displayName}</div>
          <div className="text-[11px] text-[var(--z-muted)]">{summary.roleEquivalent}</div>
        </div>

        {/* Tasks */}
        <div className="text-sm font-semibold text-[var(--z-fg)]">{summary.totalTasks}</div>

        {/* Hours */}
        <div className="text-sm text-[var(--z-muted)]">{fmtHours(summary.totalMinutes)}</div>

        {/* Rate */}
        <div className="text-sm text-[var(--z-muted)]">${summary.hourlyRateUsd}/hr</div>

        {/* Saved */}
        <div className="text-sm font-bold text-[#4ADE80]">{fmtUsd(summary.totalSavedUsd)}</div>

        {/* Expand */}
        <div className="text-[var(--z-muted)]">
          <svg
            className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Expanded task list */}
      {isExpanded && summary.tasks.length > 0 && (
        <div className="border-b bg-[var(--z-surface-2)] px-6 py-3 space-y-2" style={{ borderColor: "var(--z-border)" }}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)]">Recent tasks</p>
          {summary.tasks.slice(0, 10).map((task) => (
            <div key={task.id} className="flex items-start justify-between gap-4 rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--z-fg)]">{task.description}</p>
                <p className="mt-0.5 text-[10px] text-[var(--z-muted)]">
                  {new Date(task.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {task.ownerTasksRequired > 0 && (
                    <span className="ml-2 rounded bg-[rgba(251,191,36,0.15)] px-1.5 py-0.5 text-[9px] font-bold text-[#FBBF24]">
                      needed you
                    </span>
                  )}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-xs font-semibold text-[#4ADE80]">{fmtUsd((task.minutesSpent / 60) * summary.hourlyRateUsd)}</div>
                <div className="text-[10px] text-[var(--z-muted)]">{fmtHours(task.minutesSpent)}</div>
              </div>
            </div>
          ))}
          <p className="pt-1 text-[10px] text-[var(--z-muted)]">
            Rate basis: {summary.rateSource}
          </p>
        </div>
      )}
    </>
  );
}

// ─── Main client ─────────────────────────────────────────────────────────────
export function AgentReportsClient({ monthly, weekly }: AgentReportsClientProps) {
  const [view, setView] = useState<"monthly" | "weekly">("monthly");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const period = view === "monthly" ? monthly : weekly;

  const toggle = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Sort agents by savings descending
  const sorted = [...period.agents].sort((a, b) => b.totalSavedUsd - a.totalSavedUsd);

  return (
    <PageShell title="Agent Reports">
      <div className="space-y-6">
        {/* Period toggle */}
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border border-[var(--z-border)] text-sm">
            {(["monthly", "weekly"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-4 py-1.5 capitalize transition-colors"
                style={{
                  background: view === v ? "var(--z-accent)" : "var(--z-surface)",
                  color: view === v ? "var(--z-on-accent)" : "var(--z-muted)",
                  fontWeight: view === v ? 700 : 400,
                }}
              >
                {v === "monthly" ? monthly.label : weekly.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-[var(--z-muted)]">
            * Task data is seeded with realistic examples. Live tracking activates when agent task logging is enabled.
          </span>
        </div>

        {/* Hero banner */}
        <HeroBanner period={period} />

        {/* Summary statement */}
        <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] px-5 py-4">
          <p className="text-sm leading-relaxed text-[var(--z-fg)]">
            During <strong>{period.label}</strong>, your 7 agents completed{" "}
            <strong>{period.totalTasks} tasks</strong>, saving you an estimated{" "}
            <strong className="text-[#4ADE80]">{fmtUsd(period.totalSavedUsd)}</strong> in administrative costs.
            You personally only needed to handle{" "}
            <strong className="text-[#FBBF24]">{period.totalOwnerTasks} tasks</strong> — everything else was handled automatically.
          </p>
        </div>

        {/* Agent breakdown table (desktop) */}
        <div className="hidden sm:block rounded-xl border border-[var(--z-border)] overflow-hidden">
          <div
            className="grid border-b bg-[var(--z-surface)] text-[9px] font-black uppercase tracking-widest text-[var(--z-muted)]"
            style={{ gridTemplateColumns: "40px 1.5fr 80px 80px 100px 120px 40px", columnGap: "12px", padding: "8px 16px", borderColor: "var(--z-border)" }}
          >
            <div /><div>Agent</div><div>Tasks</div><div>Hours</div><div>Rate</div><div>Saved</div><div />
          </div>
          {sorted.map((summary) => (
            <AgentSummaryRow key={summary.agentId} summary={summary} isExpanded={expanded.has(summary.agentId)} onToggle={() => toggle(summary.agentId)} />
          ))}
          <div
            className="grid items-center border-t bg-[var(--z-surface-2)] font-bold"
            style={{ gridTemplateColumns: "40px 1.5fr 80px 80px 100px 120px 40px", columnGap: "12px", padding: "10px 16px", borderColor: "var(--z-border)" }}
          >
            <div />
            <div className="text-sm text-[var(--z-fg)]">Total</div>
            <div className="text-sm text-[var(--z-fg)]">{period.totalTasks}</div>
            <div className="text-sm text-[var(--z-fg)]">{fmtHours(period.agents.reduce((s, a) => s + a.totalMinutes, 0))}</div>
            <div />
            <div className="text-sm text-[#4ADE80]">{fmtUsd(period.totalSavedUsd)}</div>
            <div />
          </div>
        </div>

        {/* Agent cards (mobile) */}
        <div className="sm:hidden space-y-3">
          {sorted.map((summary) => {
            const meta = AGENT_METADATA[summary.agentId];
            const accent = meta?.accent ?? "#888";
            const isExp = expanded.has(summary.agentId);
            return (
              <div key={summary.agentId} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--z-border)" }}>
                <button
                  onClick={() => toggle(summary.agentId)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  style={{ background: "var(--z-surface)" }}
                >
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full" style={{ boxShadow: `0 0 8px ${accent}66` }}>
                    {meta ? (
                      <Image src={meta.imagePath} alt={meta.displayName} fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full rounded-full" style={{ background: accent }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold" style={{ color: accent }}>{summary.displayName}</div>
                    <div className="text-[11px] text-[var(--z-muted)]">{summary.roleEquivalent}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-[#4ADE80]">{fmtUsd(summary.totalSavedUsd)}</div>
                    <div className="text-[10px] text-[var(--z-muted)]">{summary.totalTasks} tasks · {fmtHours(summary.totalMinutes)}</div>
                  </div>
                  <svg className={`h-3 w-3 shrink-0 transition-transform text-[var(--z-muted)] ${isExp ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
                {isExp && summary.tasks.length > 0 && (
                  <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: "var(--z-border)", background: "var(--z-surface-2)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)]">Recent tasks</p>
                    {summary.tasks.slice(0, 6).map((task) => (
                      <div key={task.id} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-[var(--z-fg)]">{task.description}</p>
                          <p className="mt-0.5 text-[10px] text-[var(--z-muted)]">
                            {new Date(task.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs font-semibold text-[#4ADE80]">{fmtUsd((task.minutesSpent / 60) * summary.hourlyRateUsd)}</div>
                          <div className="text-[10px] text-[var(--z-muted)]">{fmtHours(task.minutesSpent)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {/* Mobile totals */}
          <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[var(--z-muted)] uppercase tracking-widest">Total saved</div>
              <div className="text-xl font-black text-[#4ADE80]">{fmtUsd(period.totalSavedUsd)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-[var(--z-fg)]">{period.totalTasks} tasks</div>
              <div className="text-xs text-[var(--z-muted)]">{fmtHours(period.agents.reduce((s, a) => s + a.totalMinutes, 0))} worked</div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-[var(--z-muted)] leading-relaxed">
          Hourly rates are based on US national averages from the Bureau of Labor Statistics (BLS), ZipRecruiter,
          Indeed, Glassdoor, and Salary.com (April 2026). Rates represent the cost of hiring a human employee
          to perform the equivalent role full-time. Savings are calculated as: (minutes spent ÷ 60) × hourly rate.
          Owner tasks required are tasks that needed a human decision or action that the agent could not complete autonomously.
        </p>
      </div>
    </PageShell>
  );
}
