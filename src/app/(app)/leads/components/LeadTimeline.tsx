import { cn } from "@/components/ui/utils/cn";
import type { LeadTimelineItem } from "@/lib/leads/types";

export interface LeadTimelineProps {
  items: LeadTimelineItem[];
  maxRows?: number;
  emptyMessage?: string;
}

const TYPE_LABELS: Record<LeadTimelineItem["type"], string> = {
  lead_created: "Created",
  lead_updated: "Updated",
  stage_changed: "Stage change",
  note: "Note",
  conversation: "Conversation",
  follow_up: "Follow-up",
  conversion: "Converted",
};

const TYPE_TONES: Record<LeadTimelineItem["type"], string> = {
  lead_created: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  lead_updated:
    "bg-white/[0.04] text-[var(--z-muted)] border-[var(--z-border)]",
  stage_changed: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  note: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  conversation: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  follow_up: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  conversion: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LeadTimeline({
  items,
  maxRows = 50,
  emptyMessage = "No activity recorded yet.",
}: LeadTimelineProps) {
  const rows = items.slice(0, maxRows);

  return (
    <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="px-5 py-3 border-b border-[var(--z-border)]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Activity
        </div>
        <h3 className="text-base font-semibold text-[var(--z-fg)]">Timeline</h3>
      </header>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-[var(--z-muted)]">
          {emptyMessage}
        </div>
      ) : (
        <ol className="relative divide-y divide-[var(--z-border)]">
          {rows.map((item) => (
            <li key={item.id} className="flex gap-3 px-5 py-4">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "inline-flex h-6 min-w-[72px] items-center justify-center rounded-full border px-2 text-[10px] font-semibold uppercase tracking-wider",
                    TYPE_TONES[item.type],
                  )}
                >
                  {TYPE_LABELS[item.type]}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm font-medium text-[var(--z-fg)] truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-[var(--z-muted)] whitespace-nowrap">
                    {formatDateTime(item.at)}
                  </div>
                </div>
                {item.detail ? (
                  <p className="mt-1 text-xs text-[var(--z-muted)] whitespace-pre-wrap break-words">
                    {item.detail}
                  </p>
                ) : null}
                {item.source ? (
                  <div className="mt-1 text-[10px] text-[var(--z-muted)] uppercase tracking-wider">
                    {item.source}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
