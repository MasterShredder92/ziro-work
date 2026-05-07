import Link from "next/link";
import type { LessonPlanSummary } from "@/lib/lessonPlanner/types";

export function LessonPlanList({
  summaries,
  canWrite,
}: {
  summaries: LessonPlanSummary[];
  canWrite: boolean;
}) {
  if (summaries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]">
        No lesson plans yet.{" "}
        {canWrite
          ? "Draft your first plan — try the AI draft panel to get started in seconds."
          : "Check back once plans have been created."}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {summaries.map((s) => {
        const plan = s.plan;
        return (
          <Link
            key={plan.id}
            href={`/lesson-planner/${plan.id}`}
            className="block rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 hover:border-[#c4f036]/40 hover:bg-[color-mix(in_oklab,var(--z-surface),var(--z-accent)_4%)] transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
                  {plan.title}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
                  {plan.source === "ai_draft" ? "AI draft · " : ""}
                  {plan.status}
                  {plan.grade_level ? ` · ${plan.grade_level}` : ""}
                </div>
              </div>
              <StatusPill status={plan.status} />
            </div>
            {plan.summary ? (
              <p className="mt-2 line-clamp-2 text-xs text-[var(--z-muted)]">
                {plan.summary}
              </p>
            ) : null}
            <div className="mt-3 grid grid-cols-4 gap-2 text-[11px] text-[var(--z-muted)]">
              <Stat label="Objectives" value={s.objectiveCount} />
              <Stat label="Activities" value={s.activityCount} />
              <Stat label="Materials" value={s.materialCount} />
              <Stat label="Versions" value={s.versionCount} />
            </div>
            {s.hasAIDraft ? (
              <div className="mt-3 text-[11px] text-[#c4f036]">
                AI draft assisted
              </div>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[10px] uppercase">{label}</div>
      <div className="text-[var(--z-fg)] font-semibold">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const color =
    status === "published"
      ? "text-[#c4f036] bg-[#c4f036]/10 border-[#c4f036]/30"
      : status === "ready"
        ? "text-sky-300 bg-sky-400/10 border-sky-400/30"
        : status === "archived"
          ? "text-[var(--z-muted)] bg-white/5 border-[var(--z-border)]"
          : "text-amber-300 bg-amber-400/10 border-amber-400/30";
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${color}`}
    >
      {status}
    </span>
  );
}
