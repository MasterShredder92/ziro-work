import type {
  AutomationLog,
  AutomationRun,
} from "@/lib/automation/workflows/types";

export type RunTimelineProps = {
  run: AutomationRun;
  logs: AutomationLog[];
};

function formatTs(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function StepPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cn = "border-[var(--z-border)] bg-white/5 text-[var(--z-muted)]";
  if (s === "succeeded")
    cn = "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
  else if (s === "failed")
    cn = "border-rose-500/30 bg-rose-500/15 text-rose-300";
  else if (s === "running")
    cn = "border-sky-500/30 bg-sky-500/15 text-sky-300";
  else if (s === "skipped")
    cn = "border-amber-500/30 bg-amber-500/15 text-amber-300";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cn}`}
    >
      {status}
    </span>
  );
}

export function RunTimeline({ run, logs }: RunTimelineProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)] mb-3 font-semibold">
          Steps ({run.steps.length})
        </div>
        {run.steps.length === 0 ? (
          <div className="text-xs text-[var(--z-muted)] italic">
            No steps recorded yet.
          </div>
        ) : (
          <ol className="space-y-2">
            {run.steps.map((step, i) => (
              <li
                key={`${step.actionId}-${i}`}
                className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[var(--z-muted)]">
                        #{i + 1}
                      </span>
                      <StepPill status={step.status} />
                      <span className="text-sm font-medium text-[var(--z-fg)]">
                        {step.type}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--z-muted)] font-mono">
                      {step.actionId}
                    </div>
                    {step.error ? (
                      <div className="mt-2 text-xs text-rose-300">
                        {step.error.message}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right text-[10px] text-[var(--z-muted)] shrink-0">
                    <div>{formatTs(step.startedAt)}</div>
                    {typeof step.durationMs === "number" ? (
                      <div>{step.durationMs}ms</div>
                    ) : null}
                  </div>
                </div>
                {step.output ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] text-[var(--z-muted)] hover:text-[var(--z-fg)]">
                      Output
                    </summary>
                    <pre className="mt-1 whitespace-pre-wrap break-all rounded bg-black/30 p-2 text-[11px] text-[var(--z-fg)]/80">
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)] mb-3 font-semibold">
          Logs ({logs.length})
        </div>
        {logs.length === 0 ? (
          <div className="text-xs text-[var(--z-muted)] italic">No logs.</div>
        ) : (
          <ol className="space-y-1 font-mono text-[11px]">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-start gap-2 rounded px-2 py-1 hover:bg-white/5"
              >
                <span className="shrink-0 text-[var(--z-muted)]">
                  {formatTs(log.created_at)}
                </span>
                <span
                  className={`shrink-0 uppercase ${
                    log.level === "error"
                      ? "text-rose-300"
                      : log.level === "warn"
                        ? "text-amber-300"
                        : "text-[var(--z-muted)]"
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-[var(--z-fg)] break-all">
                  {log.message}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {run.payload && Object.keys(run.payload).length > 0 ? (
        <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
          <div className="text-xs uppercase tracking-wider text-[var(--z-muted)] mb-3 font-semibold">
            Payload
          </div>
          <pre className="whitespace-pre-wrap break-all rounded bg-black/30 p-3 text-[11px] text-[var(--z-fg)]/80">
            {JSON.stringify(run.payload, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
