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

/**
 * Static circular avatar — no floating animation, no orbit ring (dashboard only).
 * Keeps faces out of overlapping text above/below.
 */
function DashboardAgentFace({
  meta,
  sizePx,
}: {
  meta: AgentMetadata;
  sizePx: number;
}) {
  const img = meta.imagePath;
  const [imgOk, setImgOk] = React.useState(true);
  const style = {
    width: sizePx,
    height: sizePx,
    borderColor: `color-mix(in oklab, ${meta.accent}, transparent 40%)`,
    boxShadow: `0 10px 40px ${meta.glow}, inset 0 1px 0 color-mix(in oklab, white, transparent 85%)`,
  } as React.CSSProperties;

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border-2 bg-[var(--z-surface-2)]"
      style={style}
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

function AgentOrbPanel({
  meta,
  metrics,
  signals,
  loading,
  variant,
}: {
  meta: AgentMetadata;
  metrics: DashboardMetrics;
  signals: StudentSignals;
  loading: boolean;
  variant: "leader" | "team";
}) {
  const entry = getAgent(meta.id);
  const specialty = entry?.role ?? "Helper";
  const orbSize = variant === "leader" ? 88 : 56;

  const style = {
    "--z-agent-accent": meta.accent,
    "--z-agent-glow": meta.glow,
  } as React.CSSProperties;

  const lines = linesForAgent(meta.id, metrics, signals);
  const link = primaryLinkForAgent(meta.id);
  const ask = askActionForAgent(meta.id);
  const hasEstimate = lines.some((l) => l.isEstimate);

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

  const dataBlock = (
    <div
      className={cn(
        "rounded-xl border text-left",
        "border-[color-mix(in_oklab,var(--z-agent-accent),transparent_75%)]",
        "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)]",
        "p-3",
      )}
    >
      {loading ? (
        <p className="text-xs text-[var(--z-muted)]">Loading your numbers…</p>
      ) : (
        <ul className="space-y-2 text-[11px] leading-snug text-[color-mix(in_oklab,var(--z-fg),transparent_12%)] sm:text-xs">
          {lines.map((line, i) => (
            <li
              key={i}
              className={line.isEstimate ? "text-[color-mix(in_oklab,var(--z-fg),transparent_28%)]" : ""}
            >
              {line.text}
            </li>
          ))}
        </ul>
      )}
      {hasEstimate && !loading ? (
        <p className="mt-2 text-[10px] leading-snug text-[var(--z-muted)]">
          Dollar estimates use optional env settings so we do not guess your prices in secret.
        </p>
      ) : null}
    </div>
  );

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={link.href}
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-semibold transition-colors",
          "bg-[color-mix(in_oklab,var(--z-agent-accent),transparent_12%)]",
          "text-[var(--z-fg)] ring-1 ring-[color-mix(in_oklab,var(--z-agent-accent),transparent_45%)]",
          "hover:bg-[color-mix(in_oklab,var(--z-agent-accent),transparent_22%)]",
          focusRingClassName(),
        )}
      >
        {link.label}
      </Link>
      {ask ? (
        <Button type="button" size="sm" variant="ghost" className="text-[var(--z-muted)]" onClick={fireAsk}>
          {ask.label}
        </Button>
      ) : null}
    </div>
  );

  if (variant === "leader") {
    return (
      <div
        style={style}
        className={cn(
          "relative overflow-hidden rounded-2xl border",
          "border-[color-mix(in_oklab,var(--z-agent-accent),transparent_55%)]",
          "bg-[linear-gradient(165deg,color-mix(in_oklab,var(--z-surface),transparent_5%)_0%,color-mix(in_oklab,var(--z-surface-2),transparent_30%)_100%)]",
          "p-6 sm:p-8",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full opacity-[0.12] blur-3xl"
          style={{ background: meta.accent }}
        />
        <div className="relative flex flex-col items-center text-center">
          <DashboardAgentFace meta={meta} sizePx={orbSize} />
          <div className="mt-4 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: meta.accent }}>
              {specialty}
            </p>
            <p className="text-lg font-semibold tracking-tight text-[var(--z-fg)]">{meta.displayName}</p>
          </div>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_30%)]">
            {meta.tagline}
          </p>
          <div className="mt-5 w-full max-w-md">{dataBlock}</div>
          <div className="mt-5 flex justify-center">{actions}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={style}
      className={cn(
        "relative overflow-hidden rounded-2xl border",
        "border-[color-mix(in_oklab,var(--z-border),transparent_8%)]",
        "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_35%)]",
        "p-4 sm:p-5",
        "transition-[border-color,box-shadow] duration-200",
        "hover:border-[color-mix(in_oklab,var(--z-agent-accent),transparent_45%)]",
        "hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-agent-accent),transparent_55%)]",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 justify-center sm:justify-start">
          <DashboardAgentFace meta={meta} sizePx={orbSize} />
        </div>
        <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: meta.accent }}
            >
              {specialty}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--z-fg)]">{meta.displayName}</p>
            <p className="mt-1 text-xs leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_32%)]">
              {meta.tagline}
            </p>
          </div>
          {dataBlock}
          <div className="flex justify-center sm:justify-start">{actions}</div>
        </div>
      </div>
    </div>
  );
}

function TeamDivider() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--z-border)]" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
        Specialists
      </span>
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

  return (
    <div className="space-y-6">
      {leader ? <AgentOrbPanel meta={leader} metrics={metrics} signals={signals} loading={loading} variant="leader" /> : null}

      {leader && team.length > 0 ? <TeamDivider /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {team.map((meta) => (
          <AgentOrbPanel
            key={meta.id}
            meta={meta}
            metrics={metrics}
            signals={signals}
            loading={loading}
            variant="team"
          />
        ))}
      </div>
    </div>
  );
}
