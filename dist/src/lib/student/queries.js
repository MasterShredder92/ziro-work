import "server-only";
import { getStudentById } from "@data/students";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import { listSessionLog } from "@data/sessionLog";
import { listAIConversations } from "@data/aiConversations";
import { listSquareInvoices, listSquarePayments, } from "@data/squareInvoices";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
const SCHEDULE_PAST_DAYS = 14;
const SCHEDULE_FUTURE_DAYS = 60;
const LESSON_HISTORY_DAYS = 180;
function isoDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}
async function resolveTenantForStudent(studentId, tenantId) {
    var _a;
    if (tenantId && tenantId.trim().length > 0)
        return tenantId.trim();
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("students")
        .select("tenant_id")
        .eq("id", studentId)
        .maybeSingle();
    if (error)
        throw error;
    const t = (_a = data === null || data === void 0 ? void 0 : data.tenant_id) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    return t;
}
async function resolveProfileIdForStudent(studentId, tenantId) {
    var _a;
    const student = await getStudentById(studentId, tenantId);
    if (!student)
        return null;
    const row = student;
    return (_a = row["profile_id"]) !== null && _a !== void 0 ? _a : null;
}
export async function getStudentProfile(studentId, tenantId) {
    const tid = await resolveTenantForStudent(studentId, tenantId);
    return getStudentById(studentId, tid);
}
export async function getStudentByProfileId(profileId) {
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("profile_id", profileId)
        .maybeSingle();
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : null);
}
export async function getStudentSchedule(studentId, tenantId) {
    const tid = await resolveTenantForStudent(studentId, tenantId);
    const rows = await listScheduleBlocks(tid, {
        student_id: studentId,
        date_from: isoDate(-SCHEDULE_PAST_DAYS),
        date_to: isoDate(SCHEDULE_FUTURE_DAYS),
    }, { orderBy: "block_date", ascending: true, limit: 500 });
    return rows.map(toScheduleItem);
}
export async function getStudentLessons(studentId, tenantId) {
    const tid = await resolveTenantForStudent(studentId, tenantId);
    const rows = await listSessionLog(tid, {
        student_id: studentId,
        date_from: isoDate(-LESSON_HISTORY_DAYS),
        date_to: isoDate(0),
    }, { orderBy: "block_date", ascending: false, limit: 100 });
    return rows.map(toLessonItem);
}
export async function getStudentMessages(studentId, tenantId) {
    const tid = await resolveTenantForStudent(studentId, tenantId);
    const profileId = await resolveProfileIdForStudent(studentId, tid);
    if (!profileId)
        return [];
    const rows = await listAIConversations(tid, { profile_id: profileId }, { orderBy: "updated_at", ascending: false, limit: 50 });
    return rows.map(toMessageItem);
}
export async function getStudentBilling(studentId, tenantId) {
    var _a;
    const tid = await resolveTenantForStudent(studentId, tenantId);
    const student = await getStudentById(studentId, tid);
    const familyId = student
        ? (_a = student["family_id"]) !== null && _a !== void 0 ? _a : null
        : null;
    const [invoices, payments] = await Promise.all([
        listSquareInvoices(tid, undefined, { orderBy: "invoice_date", ascending: false, limit: 200 }),
        listSquarePayments(tid, { limit: 200 }),
    ]);
    const scopedInvoices = familyId
        ? invoices.filter((inv) => inv["family_id"] === familyId)
        : invoices.filter((inv) => inv["student_id"] === studentId);
    const items = scopedInvoices.map(toBillingItem);
    const summary = buildBillingSummary(items);
    return { items, payments, summary };
}
function toScheduleItem(row) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const r = row;
    return {
        id: row.id,
        tenant_id: (_a = r["tenant_id"]) !== null && _a !== void 0 ? _a : "",
        student_id: (_b = r["student_id"]) !== null && _b !== void 0 ? _b : null,
        block_date: (_c = r["block_date"]) !== null && _c !== void 0 ? _c : null,
        start_time: (_d = r["start_time"]) !== null && _d !== void 0 ? _d : null,
        end_time: (_e = r["end_time"]) !== null && _e !== void 0 ? _e : null,
        block_type: (_f = r["block_type"]) !== null && _f !== void 0 ? _f : null,
        status: (_g = r["status"]) !== null && _g !== void 0 ? _g : null,
        room: (_h = r["room"]) !== null && _h !== void 0 ? _h : null,
        is_virtual: (_j = r["is_virtual"]) !== null && _j !== void 0 ? _j : null,
        raw: row,
    };
}
function toLessonItem(row) {
    var _a, _b, _c, _d, _e, _f;
    const r = row;
    const worked = r["worked_on"];
    const workedOn = Array.isArray(worked)
        ? worked.filter((w) => typeof w === "string")
        : [];
    return {
        id: row.id,
        tenant_id: (_a = r["tenant_id"]) !== null && _a !== void 0 ? _a : "",
        block_date: (_b = r["block_date"]) !== null && _b !== void 0 ? _b : null,
        instrument: (_c = r["instrument"]) !== null && _c !== void 0 ? _c : null,
        status: (_d = r["status"]) !== null && _d !== void 0 ? _d : null,
        engagement_level: typeof r["engagement_level"] === "number"
            ? r["engagement_level"]
            : null,
        progress_indicator: (_e = r["progress_indicator"]) !== null && _e !== void 0 ? _e : null,
        lesson_notes: (_f = r["lesson_notes"]) !== null && _f !== void 0 ? _f : null,
        worked_on: workedOn,
        raw: row,
    };
}
function toMessageItem(row) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const r = row;
    const meta = (_a = r["metadata"]) !== null && _a !== void 0 ? _a : {};
    const title = (_e = (_d = (_c = (_b = meta === null || meta === void 0 ? void 0 : meta["title"]) !== null && _b !== void 0 ? _b : meta === null || meta === void 0 ? void 0 : meta["subject"]) !== null && _c !== void 0 ? _c : r["client_route"]) !== null && _d !== void 0 ? _d : r["source"]) !== null && _e !== void 0 ? _e : "Conversation";
    const preview = (_g = (_f = meta === null || meta === void 0 ? void 0 : meta["preview"]) !== null && _f !== void 0 ? _f : meta === null || meta === void 0 ? void 0 : meta["summary"]) !== null && _g !== void 0 ? _g : null;
    return {
        id: row.id,
        tenant_id: (_h = r["tenant_id"]) !== null && _h !== void 0 ? _h : "",
        title,
        preview,
        source: (_j = r["source"]) !== null && _j !== void 0 ? _j : null,
        client_route: (_k = r["client_route"]) !== null && _k !== void 0 ? _k : null,
        updated_at: (_l = r["updated_at"]) !== null && _l !== void 0 ? _l : null,
        created_at: (_m = r["created_at"]) !== null && _m !== void 0 ? _m : null,
        raw: row,
    };
}
function toBillingItem(row) {
    var _a, _b, _c, _d, _e, _f;
    const r = row;
    const total = typeof r["amount_cents"] === "number"
        ? r["amount_cents"]
        : 0;
    const paid = typeof r["amount_paid"] === "number"
        ? r["amount_paid"]
        : typeof r["amount_paid_cents"] === "number"
            ? r["amount_paid_cents"]
            : 0;
    const balance = Math.max(0, total - paid);
    return {
        id: row.id,
        tenant_id: (_a = r["tenant_id"]) !== null && _a !== void 0 ? _a : "",
        invoice_number: (_b = r["invoice_number"]) !== null && _b !== void 0 ? _b : null,
        title: (_c = r["title"]) !== null && _c !== void 0 ? _c : null,
        status: (_d = r["status"]) !== null && _d !== void 0 ? _d : null,
        invoice_date: (_e = r["invoice_date"]) !== null && _e !== void 0 ? _e : null,
        due_date: (_f = r["due_date"]) !== null && _f !== void 0 ? _f : null,
        amount_cents: total,
        amount_paid_cents: paid,
        balance_cents: balance,
        raw: row,
    };
}
function buildBillingSummary(items) {
    const today = new Date().toISOString().slice(0, 10);
    let totalBilledCents = 0;
    let totalPaidCents = 0;
    let balanceCents = 0;
    let overdueCount = 0;
    let overdueAmountCents = 0;
    for (const it of items) {
        totalBilledCents += it.amount_cents;
        totalPaidCents += it.amount_paid_cents;
        balanceCents += it.balance_cents;
        const isUnpaid = it.balance_cents > 0;
        const isOverdue = isUnpaid && it.due_date != null && it.due_date < today;
        if (isOverdue) {
            overdueCount += 1;
            overdueAmountCents += it.balance_cents;
        }
    }
    return {
        totalBilledCents,
        totalPaidCents,
        balanceCents,
        overdueCount,
        overdueAmountCents,
        invoiceCount: items.length,
    };
}
