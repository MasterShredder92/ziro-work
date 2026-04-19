"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function estimateMonthly(students: number, teachers: number) {
  const s = clamp(students, 0, 500);
  const t = clamp(teachers, 0, 80);
  const launch = 49 + s * 0.45 + t * 5.5;
  const scale = 129 + s * 0.22 + t * 4.25;
  const command = 399 + s * 0.08 + t * 3;
  return { launch, scale, command };
}

function recommendedPlan(students: number, teachers: number): "Launch" | "Scale" | "Command" {
  if (students <= 48 && teachers <= 6) return "Launch";
  if (students <= 220 && teachers <= 22) return "Scale";
  return "Command";
}

function formatUsd(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function PricingCalculator() {
  const [students, setStudents] = React.useState(48);
  const [teachers, setTeachers] = React.useState(5);

  const { launch, scale, command } = estimateMonthly(students, teachers);
  const rec = recommendedPlan(students, teachers);

  return (
    <Card
      variant="elevated"
      padding="lg"
      radius="lg"
      className="border-[color-mix(in_oklab,var(--z-accent),transparent_65%)]"
    >
      <div className="flex flex-col gap-[var(--z-space-6)] lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-[var(--z-space-5)]">
          <div>
            <label className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]">
              Students
            </label>
            <div className="mt-2 flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={300}
                value={students}
                onChange={(e) => setStudents(Number(e.target.value))}
                className="h-2 w-full max-w-md cursor-pointer accent-[var(--z-accent)]"
              />
              <span className="w-10 text-right text-sm font-extrabold text-[var(--z-accent)]">{students}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]">
              Teachers
            </label>
            <div className="mt-2 flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={40}
                value={teachers}
                onChange={(e) => setTeachers(Number(e.target.value))}
                className="h-2 w-full max-w-md cursor-pointer accent-[var(--z-accent)]"
              />
              <span className="w-10 text-right text-sm font-extrabold text-[var(--z-accent)]">{teachers}</span>
            </div>
          </div>
        </div>
        <div className="w-full shrink-0 space-y-3 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-[var(--z-space-4)] lg:w-72">
          <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]">
            Estimated monthly
          </div>
          <div className="space-y-2 text-sm">
            <PlanRow label="Launch" value={launch} active={rec === "Launch"} />
            <PlanRow label="Scale" value={scale} active={rec === "Scale"} />
            <PlanRow label="Command" value={command} active={rec === "Command"} />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-[var(--z-muted)]">Recommended</span>
            <Badge variant="success" active className="text-[10px]">
              {rec}
            </Badge>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--z-muted)]">
            Illustrative estimator — final billing depends on modules, locations, and contract terms.
          </p>
        </div>
      </div>
    </Card>
  );
}

function PlanRow({
  label,
  value,
  active,
}: {
  label: string;
  value: number;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-[var(--z-radius-sm)] px-2 py-1.5",
        active && "bg-[color-mix(in_oklab,var(--z-accent),transparent_90%)] ring-1 ring-[color-mix(in_oklab,var(--z-accent),transparent_55%)]"
      )}
    >
      <span className={cn("font-semibold", active ? "text-black" : "text-[var(--z-fg)]")}>{label}</span>
      <span className={cn("font-extrabold", active ? "text-black" : "text-[var(--z-muted)]")}>
        {formatUsd(value)}
      </span>
    </div>
  );
}
