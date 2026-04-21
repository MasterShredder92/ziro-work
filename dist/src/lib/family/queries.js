import "server-only";
import { listStudents } from "@data/students";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import { listSquareInvoices, listSquarePayments, } from "@data/squareInvoices";
import { listAIConversations } from "@data/aiConversations";
import { getFamilyById, listFamilies } from "@data/families";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { studentDisplayName, studentInitials, } from "./types";
const SCHEDULE_WINDOW_PAST_DAYS = 2;
const SCHEDULE_WINDOW_FUTURE_DAYS = 60;
function isoDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}
async function resolveTenantForFamily(familyId, tenantId) {
    var _a;
    if (tenantId && tenantId.trim().length > 0)
        return tenantId;
    const family = (await getFamilyById(familyId));
    const t = (_a = family === null || family === void 0 ? void 0 : family.tenant_id) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    return t;
}
export async function getFamilyProfile(profileId) {
    var _a, _b;
    if (!profileId)
        return null;
    const tenantId = DEFAULT_TENANT_ID;
    const matches = await listFamilies(tenantId, { profile_id: profileId }, { limit: 5 });
    if (matches.length > 0)
        return ((_a = matches[0]) !== null && _a !== void 0 ? _a : null);
    const fallback = await getFamilyById(profileId);
    return (_b = fallback) !== null && _b !== void 0 ? _b : null;
}
export async function getFamilyRecord(familyId, tenantId) {
    var _a;
    const family = await getFamilyById(familyId, tenantId);
    return (_a = family) !== null && _a !== void 0 ? _a : null;
}
export async function getFamilyStudents(familyId, tenantId) {
    const tid = await resolveTenantForFamily(familyId, tenantId);
    const rows = await listStudents(tid, { family_id: familyId }, { orderBy: "first_name", ascending: true, limit: 100 });
    return rows.map((s) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const raw = s;
        return {
            id: s.id,
            tenant_id: (_a = raw["tenant_id"]) !== null && _a !== void 0 ? _a : tid,
            family_id: (_b = raw["family_id"]) !== null && _b !== void 0 ? _b : null,
            first_name: (_c = raw["first_name"]) !== null && _c !== void 0 ? _c : null,
            last_name: (_d = raw["last_name"]) !== null && _d !== void 0 ? _d : null,
            display_name: studentDisplayName(s),
            initials: studentInitials(s),
            instrument: (_e = raw["instrument"]) !== null && _e !== void 0 ? _e : null,
            status: (_f = raw["status"]) !== null && _f !== void 0 ? _f : null,
            enrollment_type: (_g = raw["enrollment_type"]) !== null && _g !== void 0 ? _g : null,
            teacher_name: (_j = (_h = raw["first_teacher_name"]) !== null && _h !== void 0 ? _h : raw["last_teacher_name"]) !== null && _j !== void 0 ? _j : null,
            raw: s,
        };
    });
}
export async function getFamilySchedule(familyId, tenantId) {
    const tid = await resolveTenantForFamily(familyId, tenantId);
    const students = await listStudents(tid, { family_id: familyId }, { limit: 100 });
    const ids = students.map((s) => s.id);
    if (ids.length === 0)
        return [];
    const nameById = new Map();
    for (const s of students)
        nameById.set(s.id, studentDisplayName(s));
    const dateFrom = isoDate(-SCHEDULE_WINDOW_PAST_DAYS);
    const dateTo = isoDate(SCHEDULE_WINDOW_FUTURE_DAYS);
    const all = await Promise.all(ids.map((id) => listScheduleBlocks(tid, { student_id: id, date_from: dateFrom, date_to: dateTo }, { orderBy: "block_date", ascending: true, limit: 500 })));
    const flat = all.flat();
    flat.sort((a, b) => {
        var _a, _b, _c, _d;
        const da = (_a = a.block_date) !== null && _a !== void 0 ? _a : "";
        const db = (_b = b.block_date) !== null && _b !== void 0 ? _b : "";
        if (da !== db)
            return da.localeCompare(db);
        const ta = (_c = a.start_time) !== null && _c !== void 0 ? _c : "";
        const tb = (_d = b.start_time) !== null && _d !== void 0 ? _d : "";
        return ta.localeCompare(tb);
    });
    return flat.map((b) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return ({
            id: b.id,
            tenant_id: (_a = b.tenant_id) !== null && _a !== void 0 ? _a : tid,
            student_id: (_b = b.student_id) !== null && _b !== void 0 ? _b : null,
            student_name: b.student_id
                ? ((_c = nameById.get(b.student_id)) !== null && _c !== void 0 ? _c : null)
                : null,
            block_date: (_d = b.block_date) !== null && _d !== void 0 ? _d : null,
            start_time: (_e = b.start_time) !== null && _e !== void 0 ? _e : null,
            end_time: (_f = b.end_time) !== null && _f !== void 0 ? _f : null,
            block_type: (_g = b.block_type) !== null && _g !== void 0 ? _g : null,
            status: (_h = b.status) !== null && _h !== void 0 ? _h : null,
            room: (_j = b.room) !== null && _j !== void 0 ? _j : null,
            is_virtual: (_k = b.is_virtual) !== null && _k !== void 0 ? _k : null,
            raw: b,
        });
    });
}
export async function getFamilyBilling(familyId, tenantId) {
    const tid = await resolveTenantForFamily(familyId, tenantId);
    const [rawInvoices, payments] = await Promise.all([
        listSquareInvoices(tid, undefined, {
            orderBy: "invoice_date",
            ascending: false,
            limit: 500,
        }),
        listSquarePayments(tid, {
            orderBy: "reporting_date",
            ascending: false,
            limit: 100,
        }),
    ]);
    const invoices = rawInvoices
        .filter((r) => r.family_id === familyId)
        .map((inv) => {
        var _a, _b, _c, _d, _e;
        const total = typeof inv.amount_cents === "number" ? inv.amount_cents : 0;
        const paid = typeof inv.amount_paid === "number" ? inv.amount_paid : 0;
        return {
            id: inv.id,
            tenant_id: inv.tenant_id,
            invoice_number: (_a = inv.invoice_number) !== null && _a !== void 0 ? _a : null,
            title: (_b = inv.title) !== null && _b !== void 0 ? _b : null,
            status: (_c = inv.status) !== null && _c !== void 0 ? _c : null,
            invoice_date: (_d = inv.invoice_date) !== null && _d !== void 0 ? _d : null,
            due_date: (_e = inv.due_date) !== null && _e !== void 0 ? _e : null,
            amount_cents: total,
            amount_paid_cents: paid,
            balance_cents: Math.max(0, total - paid),
            raw: inv,
        };
    });
    return { invoices, payments };
}
export async function getFamilyMessages(familyId, tenantId) {
    var _a;
    const tid = await resolveTenantForFamily(familyId, tenantId);
    const family = (await getFamilyById(familyId, tid));
    const profileId = (_a = family === null || family === void 0 ? void 0 : family.profile_id) !== null && _a !== void 0 ? _a : undefined;
    if (!profileId)
        return [];
    const rows = await listAIConversations(tid, { profile_id: profileId }, { orderBy: "updated_at", ascending: false, limit: 50 });
    return rows.map(toMessageItem);
}
function toMessageItem(c) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const meta = (_a = c["metadata"]) !== null && _a !== void 0 ? _a : {};
    const title = (_g = (_e = (_c = (_b = meta["title"]) !== null && _b !== void 0 ? _b : meta["subject"]) !== null && _c !== void 0 ? _c : ((_d = c.client_route) !== null && _d !== void 0 ? _d : undefined)) !== null && _e !== void 0 ? _e : ((_f = c.source) !== null && _f !== void 0 ? _f : undefined)) !== null && _g !== void 0 ? _g : "Conversation";
    const preview = ((_j = (_h = meta["last_message"]) !== null && _h !== void 0 ? _h : meta["preview"]) !== null && _j !== void 0 ? _j : "") ||
        null;
    return {
        id: c.id,
        tenant_id: c.tenant_id,
        title,
        preview,
        source: (_k = c.source) !== null && _k !== void 0 ? _k : null,
        client_route: (_l = c.client_route) !== null && _l !== void 0 ? _l : null,
        updated_at: (_m = c.updated_at) !== null && _m !== void 0 ? _m : null,
        created_at: (_o = c.created_at) !== null && _o !== void 0 ? _o : null,
        raw: c,
    };
}
export async function resolveCurrentFamilyId(profileId, tenantId) {
    if (!profileId)
        return null;
    const tid = tenantId !== null && tenantId !== void 0 ? tenantId : DEFAULT_TENANT_ID;
    const matches = await listFamilies(tid, { profile_id: profileId }, { limit: 5 });
    const first = matches[0];
    return first ? first.id : null;
}
