import "server-only";
import { listSessionLog } from "@data/sessionLog";
import { getStudentById } from "@data/students";
import type { InvoiceLineItemInsert } from "@data/invoiceLineItems";
import { createInvoice } from "./invoiceQueries";
import type { InvoiceWithLines } from "./models";

type AutoBillInput = {
  studentId: string;
  dateFrom?: string;
  dateTo?: string;
  ratePerSessionCents?: number;
};

/**
 * Scheduling OS integration: scan the session_log for attended sessions in a
 * date range and produce a draft invoice with one line item per session.
 */
export async function autoBillAttendedSessions(
  tenantId: string,
  input: AutoBillInput,
): Promise<InvoiceWithLines | null> {
  const student = await getStudentById(input.studentId, tenantId);
  if (!student) return null;

  const sessions = await listSessionLog(
    tenantId,
    {
      student_id: input.studentId,
      status: "attended",
      date_from: input.dateFrom,
      date_to: input.dateTo,
    },
    { limit: 200, orderBy: "block_date", ascending: true },
  );

  if (sessions.length === 0) return null;

  const ratePerSession =
    input.ratePerSessionCents ??
    Math.round(((student as { rate_per_session?: number | null }).rate_per_session ?? 0) * 100);

  const lineItems: InvoiceLineItemInsert[] = sessions.map((s) => {
    const ref = s as {
      id: string;
      block_date?: string | null;
      schedule_block_id?: string | null;
    };
    return {
      invoice_id: "",
      description: `Lesson on ${ref.block_date ?? "session"}`,
      quantity: 1,
      unit_amount_cents: ratePerSession,
      amount_cents: ratePerSession,
      kind: "session",
      session_log_id: ref.id,
      schedule_block_id: ref.schedule_block_id ?? null,
      student_id: input.studentId,
    };
  });

  return createInvoice(tenantId, {
    family_id: (student as { family_id?: string | null }).family_id ?? null,
    student_id: input.studentId,
    status: "draft",
    lineItems,
  });
}

/**
 * Templates OS integration: build a render-context for invoice email templates.
 * Resolved by the existing renderer at call time.
 */
export type InvoiceEmailContext = {
  invoice: {
    id: string;
    number: string | null;
    totalCents: number;
    balanceCents: number;
    dueAt: string | null;
  };
  family: { id: string | null } | null;
  student: { id: string | null } | null;
};

export function buildInvoiceEmailContext(
  invoice: InvoiceWithLines,
): InvoiceEmailContext {
  return {
    invoice: {
      id: invoice.id,
      number: invoice.number,
      totalCents: invoice.total_cents ?? 0,
      balanceCents: invoice.balance_cents ?? 0,
      dueAt: invoice.due_at,
    },
    family: invoice.family_id ? { id: invoice.family_id } : null,
    student: invoice.student_id ? { id: invoice.student_id } : null,
  };
}
