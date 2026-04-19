"use client";

import * as React from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TransactionalPreview } from "@/components/email/TransactionalPreview";
import { cn, focusRingClassName } from "@/components/ui/utils";

const EVENT_TYPES = [
  "student_enrolled",
  "trial_scheduled",
  "invoice_overdue",
  "lead_followed_up",
  "custom",
] as const;

const SAMPLE_JSON = `{
  "studentName": "Jamie Chen",
  "teacherName": "Riley Park",
  "familyName": "Chen household",
  "invoiceAmount": "$88",
  "studioName": "Harbor Music Lab",
  "trialDate": "Sunday, Apr 20",
  "lessonTime": "3:30 PM"
}`;

export function EmailPreviewClient() {
  const [eventType, setEventType] = React.useState<string>(EVENT_TYPES[0]);
  const [rawPayload, setRawPayload] = React.useState(SAMPLE_JSON);

  const parsed = React.useMemo(() => {
    try {
      const data = JSON.parse(rawPayload) as unknown;
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return { ok: false as const, error: "Payload must be a JSON object.", data: {} as Record<string, unknown> };
      }
      return { ok: true as const, error: null as string | null, data: data as Record<string, unknown> };
    } catch {
      return { ok: false as const, error: "Invalid JSON.", data: {} as Record<string, unknown> };
    }
  }, [rawPayload]);

  const payload = parsed.data;
  const error = parsed.ok ? null : parsed.error;

  return (
    <PageShell>
      <div className="flex flex-col gap-[var(--z-space-8)]">
        <PageHeader
          title="Transactional email preview"
          subtitle="Select an event type and merge tokens from sample JSON."
        />
        <div className="grid grid-cols-1 gap-[var(--z-space-6)] lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <Card padding="lg" radius="md" variant="elevated" className="space-y-[var(--z-space-4)] border-[var(--z-border)]">
            <div className="flex flex-col gap-[var(--z-space-2)]">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
                Event type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className={cn(
                  "h-10 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] text-sm text-[var(--z-fg)]",
                  "hover:border-[var(--z-border-2)]",
                  focusRingClassName(),
                )}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-[var(--z-space-2)]">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
                Sample payload (JSON)
              </label>
              <textarea
                value={rawPayload}
                onChange={(e) => setRawPayload(e.target.value)}
                rows={14}
                spellCheck={false}
                className={cn(
                  "min-h-[220px] w-full resize-y rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] py-[var(--z-space-3)] font-mono text-xs leading-relaxed text-[var(--z-fg)]",
                  "hover:border-[var(--z-border-2)]",
                  focusRingClassName(),
                )}
              />
            </div>
            {error ? <p className="text-xs font-semibold text-[var(--z-danger)]">{error}</p> : null}
          </Card>
          <TransactionalPreview eventType={eventType} payload={payload} />
        </div>
      </div>
    </PageShell>
  );
}
