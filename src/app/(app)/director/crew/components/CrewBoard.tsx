"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CrewDashboardData, AgentStats, AgentFilterPeriod } from "@/lib/agents/types";
import { AgentDetailPanel } from "./AgentDetailPanel";

function formatCurrency(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function StatusPill({ status }: { status: AgentStats["status"] }) {
  const styles: Record<string, string> = {
    idle: "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]",
    running: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 animate-pulse",
    complete: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    failed: "bg-red-500/15 text-red-300 border-red-500/30",
    stub: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[status] ?? styles.idle}`}>
      {status}
    </span>
  );
}

function AgentInitials({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black shrink-0"
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 2)}
    </div>
  );
}

function AgentCard({
  stats,
  onClick,
  isSelected,
}: {
  stats: AgentStats;
  onClick: () => void;
  isSelected: boolean;
}) {
  const { config, status, tasksThisMonth, totalCostUsd } = stats;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition-all cursor-pointer ${
        isSelected
          ? "border-[var(--z-accent-color)] bg-[var(--z-accent-color)]/5"
          : "border-[var(--z-border)] bg-[var(--z-surface)] hover:border-white/20 hover:bg-white/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <AgentInitials name={config.name} color={config.color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[var(--z-fg)]">{config.name}</span>
            <StatusPill status={status} />
          </div>
          <div className="text-[11px] text-[var(--z-muted)] mt-0.5 truncate">{config.title}</div>
          <div className="flex items-center gap-3 mt-2">
            <div className="text-xs text-[var(--z-muted)]">
              <span className="font-semibold text-[var(--z-fg)]">{formatNumber(tasksThisMonth)}</span> tasks
            </div>
            <div className="text-xs text-[var(--z-muted)]">
              <span className="font-semibold" style={{ color: config.color }}>{formatCurrency(totalCostUsd)}</span> saved
            </div>
            <div className="text-[10px] text-[var(--z-muted)]">${config.hourlyRate}/hr</div>
          </div>
        </div>
      </div>
    </button>
  );
}

// SVG connection line component
function ConnectionLine({
  fromId,
  toId,
  color,
  active,
}: {
  fromId: string;
  toId: string;
  color: string;
  active: boolean;
}) {
  const [coords, setCoords] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function measure() {
      const container = document.getElementById("crew-graph-container");
      const from = document.getElementById(`agent-node-${fromId}`);
      const to = document.getElementById(`agent-node-${toId}`);
      if (!container || !from || !to) return;
      const cRect = container.getBoundingClientRect();
      const fRect = from.getBoundingClientRect();
      const tRect = to.getBoundingClientRect();
      setCoords({
        x1: fRect.left + fRect.width / 2 - cRect.left,
        y1: fRect.top + fRect.height - cRect.top,
        x2: tRect.left + tRect.width / 2 - cRect.left,
        y2: tRect.top - cRect.top,
      });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [fromId, toId]);

  if (!coords) return null;
  const { x1, y1, x2, y2 } = coords;
  const midY = (y1 + y2) / 2;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      <path
        d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
        fill="none"
        stroke={active ? color : "var(--z-border)"}
        strokeWidth={active ? 2 : 1}
        strokeOpacity={active ? 0.8 : 0.4}
        strokeDasharray={active ? "6 3" : undefined}
      >
        {active && (
          <animate
            attributeName="stroke-dashoffset"
            from="18"
            to="0"
            dur="1s"
            repeatCount="indefinite"
          />
        )}
      </path>
    </svg>
  );
}

const ROW2_AGENTS = ["RAVEN", "RUBY", "BUB", "VADER", "STAR", "SID", "STEWIE"] as const;

export function CrewBoard({
  data,
  periods,
  selectedPeriod,
}: {
  data: CrewDashboardData;
  periods: AgentFilterPeriod[];
  selectedPeriod: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedAgent, setSelectedAgent] = useState<AgentStats | null>(null);

  const agentMap = Object.fromEntries(data.agents.map((a) => [a.agent, a]));
  const ziro = agentMap["ZIRO"];
  const rousey = agentMap["ROUSEY"];

  function handlePeriodChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    router.push(`?${params.toString()}`);
  }

  const currentPeriod = periods.find((p) => p.value === selectedPeriod);

  return (
    <div className="space-y-6">
      {/* SECTION 1 — SAVINGS HEADER */}
      <div className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Agent Crew — {currentPeriod?.label ?? "This month"}
            </div>
            <div className="mt-1 text-4xl sm:text-5xl font-bold" style={{ color: "#00ff88" }}>
              {formatCurrency(data.totalSavedThisMonth)}
            </div>
            <div className="mt-1 text-sm text-[var(--z-muted)]">
              saved in staff time &nbsp;·&nbsp;{" "}
              <span className="text-[var(--z-fg)] font-semibold">{formatNumber(data.totalTasksThisMonth)}</span> tasks completed
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  selectedPeriod === p.value
                    ? "bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/40"
                    : "bg-transparent text-[var(--z-muted)] border-[var(--z-border)] hover:text-[var(--z-fg)] hover:border-white/20"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2 — AGENT NODE GRAPH (desktop) */}
      <div className="hidden md:block">
        <div className="relative" id="crew-graph-container">
          {/* Connection lines */}
          {ziro && ROW2_AGENTS.map((name) => {
            const agent = agentMap[name];
            return (
              <ConnectionLine
                key={name}
                fromId="ZIRO"
                toId={name}
                color={ziro.config.color}
                active={ziro.status === "running" || agent?.status === "running"}
              />
            );
          })}
          {agentMap["BUB"] && rousey && (
            <ConnectionLine
              fromId="BUB"
              toId="ROUSEY"
              color={agentMap["BUB"].config.color}
              active={agentMap["BUB"].status === "running" || rousey.status === "running"}
            />
          )}

          {/* Row 1 — ZIRO */}
          <div className="flex justify-center mb-8">
            <div id="agent-node-ZIRO" className="w-48">
              {ziro && (
                <AgentCard
                  stats={ziro}
                  onClick={() => setSelectedAgent(selectedAgent?.agent === "ZIRO" ? null : ziro)}
                  isSelected={selectedAgent?.agent === "ZIRO"}
                />
              )}
            </div>
          </div>

          {/* Row 2 — all other agents except ROUSEY */}
          <div className="grid grid-cols-7 gap-3 mb-8">
            {ROW2_AGENTS.map((name) => {
              const agent = agentMap[name];
              if (!agent) return <div key={name} id={`agent-node-${name}`} />;
              return (
                <div key={name} id={`agent-node-${name}`}>
                  <AgentCard
                    stats={agent}
                    onClick={() => setSelectedAgent(selectedAgent?.agent === name ? null : agent)}
                    isSelected={selectedAgent?.agent === name}
                  />
                </div>
              );
            })}
          </div>

          {/* Row 3 — ROUSEY under BUB */}
          <div className="grid grid-cols-7 gap-3">
            {ROW2_AGENTS.map((name, i) => {
              if (name !== "BUB") return <div key={name} />;
              return (
                <div key="ROUSEY" id="agent-node-ROUSEY" style={{ gridColumn: i + 1 }}>
                  {rousey && (
                    <AgentCard
                      stats={rousey}
                      onClick={() => setSelectedAgent(selectedAgent?.agent === "ROUSEY" ? null : rousey)}
                      isSelected={selectedAgent?.agent === "ROUSEY"}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MOBILE — vertical card list */}
      <div className="md:hidden space-y-3">
        {data.agents.map((agent) => (
          <AgentCard
            key={agent.agent}
            stats={agent}
            onClick={() => setSelectedAgent(selectedAgent?.agent === agent.agent ? null : agent)}
            isSelected={selectedAgent?.agent === agent.agent}
          />
        ))}
      </div>

      {/* SECTION 3 — Empty state */}
      {data.totalTasksThisMonth === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center">
          <div className="text-base font-semibold text-[var(--z-fg)]">Your crew is standing by.</div>
          <div className="mt-1 text-sm text-[var(--z-muted)]">No tasks have run yet for this period.</div>
        </div>
      )}

      {/* AGENT DETAIL PANEL */}
      {selectedAgent && (
        <AgentDetailPanel
          stats={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
