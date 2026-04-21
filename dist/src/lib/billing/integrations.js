import "server-only";
import { listSessionLog } from "@data/sessionLog";
import { getStudentById } from "@data/students";
import { createInvoice } from "./invoiceQueries";
/**
 * Scheduling OS integration: scan the session_log for attended sessions in a
 * date range and produce a draft invoice with one line item per session.
 */
export async function autoBillAttendedSessions(tenantId, input) {
    var _a, _b, _c;
    const student = await getStudentById(input.studentId, tenantId);
    if (!student)
        return null;
    const sessions = await listSessionLog(tenantId, {
        student_id: input.studentId,
        status: "attended",
        date_from: input.dateFrom,
        date_to: input.dateTo,
    }, { limit: 200, orderBy: "block_date", ascending: true });
    if (sessions.length === 0)
        return null;
    const ratePerSession = (_a = input.ratePerSessionCents) !== null && _a !== void 0 ? _a : Math.round(((_b = student.rate_per_session) !== null && _b !== void 0 ? _b : 0) * 100);
    const lineItems = sessions.map((s) => {
        var _a, _b;
        const ref = s;
        return {
            invoice_id: "",
            description: `Lesson on ${(_a = ref.block_date) !== null && _a !== void 0 ? _a : "session"}`,
            quantity: 1,
            unit_amount_cents: ratePerSession,
            amount_cents: ratePerSession,
            kind: "session",
            session_log_id: ref.id,
            schedule_block_id: (_b = ref.schedule_block_id) !== null && _b !== void 0 ? _b : null,
            student_id: input.studentId,
        };
    });
    return createInvoice(tenantId, {
        family_id: (_c = student.family_id) !== null && _c !== void 0 ? _c : null,
        student_id: input.studentId,
        status: "draft",
        lineItems,
    });
}
export function buildInvoiceEmailContext(invoice) {
    var _a, _b;
    return {
        invoice: {
            id: invoice.id,
            number: invoice.number,
            totalCents: (_a = invoice.total_cents) !== null && _a !== void 0 ? _a : 0,
            balanceCents: (_b = invoice.balance_cents) !== null && _b !== void 0 ? _b : 0,
            dueAt: invoice.due_at,
        },
        family: invoice.family_id ? { id: invoice.family_id } : null,
        student: invoice.student_id ? { id: invoice.student_id } : null,
    };
}
