"use client";

import * as React from "react";
import Link from "next/link";
import { listAgentMetadata, type AgentMetadata } from "@/lib/agents/agentMetadata";
import { getAgent } from "@/lib/agents/registry";
import { queueAgentAction } from "@/lib/agents/agentActionAPI";
import { Button } from "@/components/ui/Button";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useDashboardMetrics } from "@/components/dashboard/useDashboardMetrics";
import { useStudentSignals } from "@/components/dashboard/useStudentSignals";
import type { DashboardMetrics } from "@/components/dashboard/computeDashboardMetrics";
import type { StudentSignals } from "@/components/dashboard/useStudentSignals";
import {
  DASHBOARD_LEADER_ID,
  DASHBOARD_TEAM_ORDER,
  askActionForAgent,
  linesForAgent,
  primaryLinkForAgent,
} from "@/components/agent/agentDashboardLines";
import { AGENT_RATE_CONFIG, SEED_TASKS, buildAgentSummaries } from "@/lib/agents/agentSavings";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (a + b).toUpperCase();
}

function resolveDashboardAgents(metas: AgentMetadata[]): {
  leader: AgentMetadata | null;
  team: AgentMetadata[];
} {
  const map = new Map(metas.map((m) => [m.id, m]));
  const leader = map.get(DASHBOARD_LEADER_ID) ?? null;
  const team: AgentMetadata[] = [];
  for (const id of DASHBOARD_TEAM_ORDER) {
    const m = map.get(id);
    if (m) team.push(m);
  }
  return { leader, team };
}

function fmtUsd(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** The glowing circle avatar */
function AgentOrb({
  meta,
  sizePx,
  isExpanded,
}: {
  meta: AgentMetadata;
  sizePx: number;
  isExpanded: boolean;
}) {
  const img = meta.imagePath;
  const [imgOk, setImgOk] = React.useState(true);

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border-2 bg-[var(--z-surface-2)] transition-all duration-300"
      style={{
        width: sizePx,
        height: sizePx,
        borderColor: `color-mix(in oklab, ${meta.accent}, transparent ${isExpanded ? "20%" : "40%"})`,
        boxShadow: isExpanded
          ? `0 0 0 4px color-mix(in oklab, ${meta.accent}, transparent 70%), 0 16px 48px ${meta.glow}`
          : `0 8px 32px ${meta.glow}`,
      }}
    >
      {img && imgOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="h-full w-full object-cover" onError={() => setImgOk(false)} />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-sm font-bold"
          style={{ color: meta.accent }}
        >
          {initials(meta.displayName)}
        </div>
      )}
    </div>
  );
}

/** Collapsed circle card — just the orb, name, and tagline */
function AgentCircleCollapsed({
  meta,
  savings,
  onClick,
}: {
  meta: AgentMetadata;
  savings: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col items-center gap-3 rounded-2xl border p-5 text-center",
        "border-[color-mix(in_oklab,var(--z-border),transparent_8%)]",
        "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_35%)]",
        "transition-all duration-200",
        "hover:border-[color-mix(in_oklab,var(--z-agent-accent),transparent_40%)]",
        "hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-agent-accent),transparent_50%),0_8px_32px_color-mix(in_oklab,var(--z-agent-accent),transparent_80%)]",
        focusRingClassName(),
      )}
      style={{ "--z-agent-accent": meta.accent, "--z-agent-glow": meta.glow } as React.CSSProperties}
    >
      {/* Subtle glow blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in oklab, ${meta.accent}, transparent 88%), transparent 70%)` }}
      />

      <AgentOrb meta={meta} sizePx={64} isExpanded={false} />

      <div className="relative space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: meta.accent }}>
          {getAgent(meta.id)?.role ?? "Agent"}
        </p>
        <p className="text-sm font-bold text-[var(--z-fg)]">{meta.displayName}</p>
        <p className="text-[11px] leading-snug text-[var(--z-muted)]">{meta.tagline}</p>
      </div>

      {savings > 0 && (
        <div className="relative rounded-full border px-3 py-1 text-[11px] font-bold"
          style={{
            borderColor: `color-mix(in oklab, ${meta.accent}, transparent 60%)`,
            color: meta.accent,
            background: `color-mix(in oklab, ${meta.accent}, transparent 88%)`,
          }}
        >
          saved {fmtUsd(savings)} this month
        </div>
      )}

      <div className="relative text-[10px] font-semibold text-[var(--z-muted)] group-hover:text-[var(--z-fg)] transition-colors">
        Click to expand ↓
      </div>
    </button>
  );
}

/** Expanded panel — full data, actions, savings breakdown */
function AgentCircleExpanded({
  meta,
  metrics,
  signals,
  loading,
  savings,
  onCollapse,
}: {
  meta: AgentMetadata;
  metrics: DashboardMetrics;
  signals: StudentSignals;
  loading: boolean;
  savings: number;
  onCollapse: () => void;
}) {
  const entry = getAgent(meta.id);
  const specialty = entry?.role ?? "Agent";
  const lines = linesForAgent(meta.id, metrics, signals);
  const link = primaryLinkForAgent(meta.id);
  const ask = askActionForAgent(meta.id);
  const rateConfig = AGENT_RATE_CONFIG[meta.id as keyof typeof AGENT_RATE_CONFIG];

  const fireAsk = () => {
    if (!ask) return;
    try {
      queueAgentAction(meta.id, ask.action, {
        source: "dashboard",
        ...(typeof ask.payload === "object" && ask.payload ? ask.payload : {}),
      });
    } catch {
      /* runtime not initialized; ignore */
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 sm:p-6"
      style={{
        "--z-agent-accent": meta.accent,
        "--z-agent-glow": meta.glow,
        borderColor: `color-mix(in oklab, ${meta.accent}, transparent 45%)`,
        boxShadow: `0 0 0 1px color-mix(in oklab, ${meta.accent}, transparent 55%), 0 16px 48px ${meta.glow}`,
        background: `linear-gradient(160deg, color-mix(in oklab, var(--z-surface), transparent 5%) 0%, color-mix(in oklab, var(--z-surface-2), transparent 30%) 100%)`,
      } as React.CSSProperties}
    >
      {/* Glow blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-[0.14] blur-3xl"
        style={{ background: meta.accent }}
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Left: orb + name */}
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <AgentOrb meta={meta} sizePx={80} isExpanded={true} />
          {savings > 0 && (
            <div className="rounded-full border px-3 py-1 text-center text-[11px] font-bold"
              style={{
                borderColor: `color-mix(in oklab, ${meta.accent}, transparent 55%)`,
                color: meta.accent,
                background: `color-mix(in oklab, ${meta.accent}, transparent 88%)`,
              }}
            >
              {fmtUsd(savings)} saved this month
            </div>
          )}
        </div>

        {/* Right: content */}
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: meta.accent }}>
              {specialty}
            </p>
            <p className="mt-0.5 text-lg font-bold text-[var(--z-fg)]">{meta.displayName}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--z-muted)]">{meta.tagline}</p>
          </div>

          {/* Data lines */}
          <div
            className="rounded-xl border p-3"
            style={{
              borderColor: `color-mix(in oklab, ${meta.accent}, transparent 75%)`,
              background: `color-mix(in oklab, var(--z-surface-2), transparent 20%)`,
            }}
          >
            {loading ? (
              <p className="text-xs text-[var(--z-muted)]">Loading your numbers…</p>
            ) : (
              <ul className="space-y-2 text-[11px] leading-snug text-[color-mix(in_oklab,var(--z-fg),transparent_12%)] sm:text-xs">
                {lines.map((line, i) => (
                  <li key={i} className={line.isEstimate ? "text-[var(--z-muted)]" : ""}>
                    {line.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Rate info */}
          {rateConfig && (
            <p className="text-[10px] text-[var(--z-muted)]">
              Rate basis: {rateConfig.roleEquivalent} · ${rateConfig.hourlyRateUsd}/hr US avg · {rateConfig.rateSource}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={link.href}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-semibold transition-colors",
                "ring-1",
                focusRingClassName(),
              )}
              style={{
                background: `color-mix(in oklab, ${meta.accent}, transparent 12%)`,
                color: "var(--z-fg)",
                ringColor: `color-mix(in oklab, ${meta.accent}, transparent 45%)`,
              }}
            >
              {link.label}
            </Link>
            {ask ? (
              <Button type="button" size="sm" variant="ghost" className="text-[var(--z-muted)]" onClick={fireAsk}>
                {ask.label}
              </Button>
            ) : null}
            <button
              onClick={onCollapse}
              className="ml-auto text-[11px] text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors"
            >
              Collapse ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Leader card — always expanded, centered, full-width */
function LeaderCard({
  meta,
  metrics,
  signals,
  loading,
  savings,
}: {
  meta: AgentMetadata;
  metrics: DashboardMetrics;
  signals: StudentSignals;
  loading: boolean;
  savings: number;
}) {
  const entry = getAgent(meta.id);
  const specialty = entry?.role ?? "Orchestrator";
  const lines = linesForAgent(meta.id, metrics, signals);
  const link = primaryLinkForAgent(meta.id);
  const ask = askActionForAgent(meta.id);
  const rateConfig = AGENT_RATE_CONFIG[meta.id as keyof typeof AGENT_RATE_CONFIG];

  const fireAsk = () => {
    if (!ask) return;
    try {
      queueAgentAction(meta.id, ask.action, { source: "dashboard", ...(typeof ask.payload === "object" && ask.payload ? ask.payload : {}) });
    } catch { /* ignore */ }
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
      style={{
        "--z-agent-accent": meta.accent,
        "--z-agent-glow": meta.glow,
        borderColor: `color-mix(in oklab, ${meta.accent}, transparent 40%)`,
        boxShadow: `0 0 0 1px color-mix(in oklab, ${meta.accent}, transparent 50%), 0 24px 64px ${meta.glow}`,
        background: `linear-gradient(165deg, color-mix(in oklab, var(--z-surface), transparent 5%) 0%, color-mix(in oklab, var(--z-surface-2), transparent 30%) 100%)`,
      } as React.CSSProperties}
    >
      <div aria-hidden className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full opacity-[0.13] blur-3xl" style={{ background: meta.accent }} />

      <div className="relative flex flex-col items-center text-center">
        <AgentOrb meta={meta} sizePx={96} isExpanded={true} />

        <div className="mt-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: meta.accent }}>{specialty} · Leader</p>
          <p className="text-xl font-bold tracking-tight text-[var(--z-fg)]">{meta.displayName}</p>
        </div>

        <p className="mt-2 max-w-md text-xs leading-relaxed text-[var(--z-muted)]">{meta.tagline}</p>

        {savings > 0 && (
          <div className="mt-3 rounded-full border px-4 py-1.5 text-[11px] font-bold"
            style={{
              borderColor: `color-mix(in oklab, ${meta.accent}, transparent 55%)`,
              color: meta.accent,
              background: `color-mix(in oklab, ${meta.accent}, transparent 88%)`,
            }}
          >
            orchestrated {fmtUsd(savings)} in savings this month
          </div>
        )}

        <div
          className="mt-5 w-full max-w-lg rounded-xl border p-4 text-left"
          style={{
            borderColor: `color-mix(in oklab, ${meta.accent}, transparent 72%)`,
            background: `color-mix(in oklab, var(--z-surface-2), transparent 20%)`,
          }}
        >
          {loading ? (
            <p className="text-xs text-[var(--z-muted)]">Loading…</p>
          ) : (
            <ul className="space-y-2 text-xs leading-snug text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
              {lines.map((line, i) => (
                <li key={i} className={line.isEstimate ? "text-[var(--z-muted)]" : ""}>{line.text}</li>
              ))}
            </ul>
          )}
          {rateConfig && (
            <p className="mt-3 text-[10px] text-[var(--z-muted)]">
              Rate basis: {rateConfig.roleEquivalent} · ${rateConfig.hourlyRateUsd}/hr US avg
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href={link.href}
            className={cn("inline-flex h-9 items-center justify-center rounded-full px-5 text-xs font-semibold transition-colors ring-1", focusRingClassName())}
            style={{ background: `color-mix(in oklab, ${meta.accent}, transparent 12%)`, color: "var(--z-fg)" }}
          >
            {link.label}
          </Link>
          {ask ? (
            <Button type="button" size="sm" variant="ghost" className="text-[var(--z-muted)]" onClick={fireAsk}>
              {ask.label}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TeamDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--z-border)]" />
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--z-muted)]">Specialists</span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--z-border)]" />
    </div>
  );
}

export function AgentCards() {
  const agents = React.useMemo(() => listAgentMetadata(), []);
  const { leader, team } = React.useMemo(() => resolveDashboardAgents(agents), [agents]);
  const { metrics, loading: mLoading } = useDashboardMetrics();
  const { signals, loading: sLoading } = useStudentSignals();
  const loading = mLoading || sLoading;

  // Pre-compute savings from seed data
  const savingsByAgent = React.useMemo(() => {
    const summaries = buildAgentSummaries(SEED_TASKS);
    const map: Record<string, number> = {};
    for (const s of summaries) map[s.agentId] = s.totalSavedUsd;
    return map;
  }, []);

  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <div className="space-y-5">
      {/* Leader — always shown fully expanded */}
      {leader ? (
        <LeaderCard
          meta={leader}
          metrics={metrics}
          signals={signals}
          loading={loading}
          savings={savingsByAgent[leader.id] ?? 0}
        />
      ) : null}

      {leader && team.length > 0 ? <TeamDivider /> : null}

      {/* Team — circles that expand on click */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((meta) =>
          expanded === meta.id ? (
            <div key={meta.id} className="col-span-2 sm:col-span-2 lg:col-span-3">
              <AgentCircleExpanded
                meta={meta}
                metrics={metrics}
                signals={signals}
                loading={loading}
                savings={savingsByAgent[meta.id] ?? 0}
                onCollapse={() => setExpanded(null)}
              />
            </div>
          ) : (
            <AgentCircleCollapsed
              key={meta.id}
              meta={meta}
              savings={savingsByAgent[meta.id] ?? 0}
              onClick={() => setExpanded(meta.id)}
            />
          )
        )}
      </div>
    </div>
  );
}
