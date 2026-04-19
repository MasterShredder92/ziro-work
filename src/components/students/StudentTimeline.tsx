"use client";

import { AlertTriangle, Bot, CalendarDays, GitBranch, Receipt } from "lucide-react";
import { Timeline, type TimelineItemProps } from "@/components/ui/Timeline";
import type { TimelineItem } from "@/lib/lifecycle/buildTimeline";
import { cn } from "@/components/ui/utils";

export type StudentTimelineProps = {
  events: TimelineItem[];
  className?: string;
};

type VisualKind = "stage" | "agent" | "invoice" | "attendance" | "risk" | "neutral";

function classifyEvent(type: string): VisualKind {
  const t = type.toLowerCase();
  if (t === "stage_transition" || t === "student_stage_changed") return "stage";
  if (t.includes("invoice") || t === "invoice") return "invoice";
  if (t.includes("attendance") || t.includes("lesson") || t.includes("present")) return "attendance";
  if (t.includes("risk") || t.includes("churn") || t.includes("at_risk")) return "risk";
  if (t.includes("agent") || t.includes("tool") || t.includes("emit")) return "agent";
  return "neutral";
}

function iconFor(kind: VisualKind) {
  const base = "h-4 w-4";
  switch (kind) {
    case "stage":
      return <GitBranch className={cn(base, "text-[var(--z-accent)]")} aria-hidden />;
    case "invoice":
      return <Receipt className={cn(base, "text-[var(--z-accent)]")} aria-hidden />;
    case "attendance":
      return <CalendarDays className={cn(base, "text-[var(--z-accent)]")} aria-hidden />;
    case "risk":
      return <AlertTriangle className={cn(base, "text-[var(--z-warning)]")} aria-hidden />;
    case "agent":
      return <Bot className={cn(base, "text-[var(--z-accent)]")} aria-hidden />;
    default:
      return <div className={cn(base, "rounded-full bg-[var(--z-border)]")} aria-hidden />;
  }
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function StudentTimeline({ events, className }: StudentTimelineProps) {
  const items: TimelineItemProps[] = events.map((e, idx) => {
    const kind = classifyEvent(e.type);
    const payload = e.payload ? JSON.stringify(e.payload) : undefined;
    return {
      id: `${e.occurredAt}-${e.type}-${idx}`,
      icon: iconFor(kind),
      title: e.title,
      meta: formatWhen(e.occurredAt),
      description: (
        <span className="block space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--z-muted)]">{e.type}</span>
          {payload && payload !== "{}" ? (
            <span className="block font-mono text-[10px] text-[color-mix(in_oklab,var(--z-fg),transparent_35%)]">
              {payload.length > 220 ? `${payload.slice(0, 220)}…` : payload}
            </span>
          ) : null}
        </span>
      ),
      accent: kind === "stage" || kind === "risk",
    };
  });

  return (
    <div className={cn("min-w-0", className)}>
      <Timeline items={items} />
    </div>
  );
}
