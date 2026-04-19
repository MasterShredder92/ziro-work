import { cn } from "@/components/ui/utils/cn";
import type { LeadQualification } from "@/lib/leads/types";

export interface LeadQualificationCardProps {
  qualification: LeadQualification;
}

const TIER_LABELS: Record<LeadQualification["tier"], string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
};

const TIER_TONES: Record<LeadQualification["tier"], string> = {
  hot: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  warm: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  cold: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

const ACTION_LABELS: Record<LeadQualification["recommendedAction"], string> = {
  promote_to_student: "Promote to student",
  schedule_followup: "Schedule a follow-up",
  nurture: "Add to nurture sequence",
  needs_info: "Collect missing info",
};

function SignalRow({
  label,
  active,
  detail,
}: {
  label: string;
  active: boolean;
  detail?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-xs">
      <span className="text-[var(--z-fg)]">{label}</span>
      <span
        className={cn(
          "font-semibold uppercase tracking-wider",
          active ? "text-emerald-300" : "text-[var(--z-muted)]",
        )}
      >
        {active ? "yes" : detail ?? "no"}
      </span>
    </li>
  );
}

export function LeadQualificationCard({
  qualification,
}: LeadQualificationCardProps) {
  const { score, tier, signals, recommendedAction, reasons } = qualification;
  return (
    <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Qualification
          </div>
          <h3 className="text-base font-semibold text-[var(--z-fg)]">
            {ACTION_LABELS[recommendedAction]}
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider",
            TIER_TONES[tier],
          )}
        >
          {TIER_LABELS[tier]}
          <span className="rounded-full bg-black/30 px-1.5 py-0.5 text-[10px] text-white">
            {score}
          </span>
        </span>
      </header>

      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            tier === "hot"
              ? "bg-rose-400"
              : tier === "warm"
                ? "bg-amber-400"
                : "bg-sky-400",
          )}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-2">
          Signals
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <SignalRow label="Email on file" active={signals.hasEmail} />
          <SignalRow label="Phone on file" active={signals.hasPhone} />
          <SignalRow label="Name captured" active={signals.hasName} />
          <SignalRow label="Instrument" active={signals.hasInstrument} />
          <SignalRow label="Goals" active={signals.hasGoals} />
          <SignalRow label="Preferred times" active={signals.hasPreferredTimes} />
          <SignalRow
            label="Recent contact"
            active={signals.respondedRecently}
          />
          <SignalRow
            label="Conversations"
            active={signals.engagedConversations > 0}
            detail={String(signals.engagedConversations)}
          />
        </ul>
      </div>

      {reasons.length > 0 ? (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-2">
            Why not higher
          </div>
          <ul className="space-y-1 text-xs text-[var(--z-muted)]">
            {reasons.map((r, i) => (
              <li key={`${r}-${i}`} className="flex gap-2">
                <span className="text-[var(--z-fg)]/60">·</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
