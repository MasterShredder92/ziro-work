import type { EventLog, Invoice, StudentLifecycleEntry } from "./models";

export type StudentTimelineItemType = "lifecycle" | "invoice" | "event";

export interface StudentTimelineItem {
  type: StudentTimelineItemType;
  occurred_at: string;
  id: string;
  title: string;
  detail?: string;
  payload?: Record<string, unknown> | null;
}

function safeTitle(input: string | null | undefined, fallback: string) {
  const t = (input ?? "").trim();
  return t.length > 0 ? t : fallback;
}

export function buildStudentTimeline(input: {
  lifecycle: StudentLifecycleEntry[];
  invoices: Invoice[];
  events: EventLog[];
}): StudentTimelineItem[] {
  const items: StudentTimelineItem[] = [];

  for (const l of input.lifecycle) {
    items.push({
      type: "lifecycle",
      occurred_at: l.occurred_at,
      id: l.id,
      title: safeTitle(l.title, l.type),
      detail: l.detail ?? undefined,
      payload: l.payload,
    });
  }

  for (const inv of input.invoices) {
    items.push({
      type: "invoice",
      occurred_at: inv.issued_at ?? inv.created_at,
      id: inv.id,
      title: `Invoice ${inv.status.toUpperCase()}`,
      detail:
        inv.description ??
        `${inv.currency} ${(inv.amount_cents / 100).toFixed(2)}`,
      payload: {
        status: inv.status,
        amount_cents: inv.amount_cents,
        currency: inv.currency,
        due_at: inv.due_at,
        paid_at: inv.paid_at,
      },
    });
  }

  for (const e of input.events) {
    items.push({
      type: "event",
      occurred_at: e.created_at,
      id: e.id,
      title: e.event_type,
      payload: e.payload,
    });
  }

  return items.sort((a, b) => {
    const ta = Date.parse(a.occurred_at);
    const tb = Date.parse(b.occurred_at);
    if (tb !== ta) return tb - ta;
    return a.id.localeCompare(b.id);
  });
}

