import Link from "next/link";
import { AttemptList } from "@/app/(app)/assessments/components";
import type { StudentAssessmentSummary } from "@/lib/assessments/types";

export interface AssessmentsSectionProps {
  summary: StudentAssessmentSummary;
  canRun?: boolean;
}

export function AssessmentsSection({
  summary,
  canRun = true,
}: AssessmentsSectionProps) {
  const { totals, attempts } = summary;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Attempts" value={String(totals.totalAttempts)} />
        <Stat label="Completed" value={String(totals.completed)} />
        <Stat
          label="Average score"
          value={
            totals.totalAttempts > 0
              ? `${totals.averageScorePct}%`
              : "—"
          }
        />
        <Stat
          label="Pass rate"
          value={
            totals.totalAttempts > 0 ? `${totals.passRatePct}%` : "—"
          }
          accent="text-[#00ff88]"
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-2">
        <div className="text-xs text-[var(--z-muted)]">
          {canRun
            ? "Ready to take an assessment? Browse the library to get started."
            : "Viewing mode — contact your teacher to take an assessment."}
        </div>
        <Link
          href="/assessments"
          className="rounded-md border border-[#00ff88]/30 bg-[#00ff88]/10 px-3 py-1 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20"
        >
          Browse
        </Link>
      </div>

      <AttemptList attempts={attempts.slice(0, 10)} canGrade={false} />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className={`text-base font-semibold ${accent ?? "text-[var(--z-fg)]"}`}>
        {value}
      </div>
    </div>
  );
}
