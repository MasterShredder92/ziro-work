import { listLeads } from "@data/leads";
import { listStudents } from "@data/students";
import { getTeachersForTenant } from "@data/teachers";
import { listSquareInvoices } from "@data/squareInvoices";
import { listScheduleBlocks } from "@data/scheduleBlocks";
const ACTIVE_STUDENT_STATUSES = new Set(["active", "trialing", "onboarding"]);
const ACTIVE_LEAD_STAGES = new Set(["inquiry", "contacted", "scheduled"]);
const OUTSTANDING_INVOICE_STATUSES = new Set([
    "UNPAID",
    "PARTIALLY_PAID",
    "SCHEDULED",
    "PENDING",
    "DRAFT",
]);
const PAID_INVOICE_STATUSES = new Set(["PAID"]);
function isCalloutBlock(block) {
    return (Boolean(block.callout_id) ||
        Boolean(block.is_family_callout) ||
        block.block_type === "call_out");
}
function shouldCountScheduledBlock(block) {
    if (isCalloutBlock(block))
        return false;
    if (block.block_type === "open_time" || block.block_type === "not_bookable")
        return false;
    return true;
}
export async function getAdminLeads(tenantId) {
    return listLeads(tenantId, undefined, {
        orderBy: "created_at",
        ascending: false,
        limit: 250,
    });
}
export async function getAdminStudents(tenantId) {
    return listStudents(tenantId, undefined, {
        orderBy: "created_at",
        ascending: false,
        limit: 500,
    });
}
export async function getAdminTeachers(tenantId) {
    var _a;
    const result = await getTeachersForTenant(tenantId);
    if (result.error)
        throw new Error(result.error);
    return (_a = result.data) !== null && _a !== void 0 ? _a : [];
}
export async function getAdminInvoices(tenantId) {
    return listSquareInvoices(tenantId, undefined, {
        orderBy: "invoice_date",
        ascending: false,
        limit: 500,
    });
}
export async function getAdminSchedule(tenantId) {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    const end = new Date(today);
    end.setDate(end.getDate() + 21);
    return listScheduleBlocks(tenantId, {
        date_from: start.toISOString().slice(0, 10),
        date_to: end.toISOString().slice(0, 10),
    }, {
        orderBy: "block_date",
        ascending: true,
        limit: 1000,
    });
}
function startOfWeek(d) {
    const out = new Date(d);
    const day = out.getDay();
    out.setHours(0, 0, 0, 0);
    out.setDate(out.getDate() - day);
    return out;
}
function endOfWeek(d) {
    const start = startOfWeek(d);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
}
function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
export function computeAdminKpis(tenantId, leads, students, teachers, invoices, schedule) {
    var _a, _b, _c;
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const activeStudents = students.filter((s) => s.status ? ACTIVE_STUDENT_STATUSES.has(s.status) : false).length;
    const activeLeads = leads.filter((l) => l.stage ? ACTIVE_LEAD_STAGES.has(l.stage) : false).length;
    const convertedLeadsThisMonth = leads.filter((l) => {
        var _a;
        if (l.stage !== "enrolled")
            return false;
        const ts = (_a = l.updated_at) !== null && _a !== void 0 ? _a : l.created_at;
        if (!ts)
            return false;
        return new Date(ts) >= monthStart;
    }).length;
    const scheduledLessonsThisWeek = schedule.filter((b) => {
        if (!b.block_date)
            return false;
        if (!shouldCountScheduledBlock(b))
            return false;
        const d = new Date(`${b.block_date}T00:00:00`);
        return d >= weekStart && d <= weekEnd;
    }).length;
    let outstanding = 0;
    let paidThisMonth = 0;
    let overdueCount = 0;
    for (const inv of invoices) {
        const status = ((_a = inv.status) !== null && _a !== void 0 ? _a : "").toUpperCase();
        const total = (_b = inv.amount_cents) !== null && _b !== void 0 ? _b : 0;
        const paid = (_c = inv.amount_paid) !== null && _c !== void 0 ? _c : 0;
        const balance = Math.max(0, total - paid);
        if (OUTSTANDING_INVOICE_STATUSES.has(status)) {
            outstanding += balance;
            if (inv.due_date) {
                const due = new Date(`${inv.due_date}T00:00:00`);
                if (due < now && balance > 0)
                    overdueCount += 1;
            }
        }
        if (PAID_INVOICE_STATUSES.has(status) && inv.paid_at) {
            const paidAt = new Date(inv.paid_at);
            if (paidAt >= monthStart)
                paidThisMonth += paid;
        }
    }
    return {
        tenantId,
        activeStudents,
        totalStudents: students.length,
        activeLeads,
        convertedLeadsThisMonth,
        totalTeachers: teachers.length,
        scheduledLessonsThisWeek,
        outstandingInvoiceAmountCents: outstanding,
        paidInvoiceAmountThisMonthCents: paidThisMonth,
        overdueInvoiceCount: overdueCount,
        generatedAt: now.toISOString(),
    };
}
export async function getAdminKpis(tenantId) {
    const [leads, students, teachers, invoices, schedule] = await Promise.all([
        getAdminLeads(tenantId),
        getAdminStudents(tenantId),
        getAdminTeachers(tenantId),
        getAdminInvoices(tenantId),
        getAdminSchedule(tenantId),
    ]);
    return computeAdminKpis(tenantId, leads, students, teachers, invoices, schedule);
}
export function computeInvoiceAging(invoices) {
    var _a, _b, _c, _d;
    const buckets = [
        { label: "Current", minDays: -Infinity, maxDays: 0, count: 0, totalAmountCents: 0 },
        { label: "1-30", minDays: 1, maxDays: 30, count: 0, totalAmountCents: 0 },
        { label: "31-60", minDays: 31, maxDays: 60, count: 0, totalAmountCents: 0 },
        { label: "61-90", minDays: 61, maxDays: 90, count: 0, totalAmountCents: 0 },
        { label: "90+", minDays: 91, maxDays: null, count: 0, totalAmountCents: 0 },
    ];
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    for (const inv of invoices) {
        const status = ((_a = inv.status) !== null && _a !== void 0 ? _a : "").toUpperCase();
        if (!OUTSTANDING_INVOICE_STATUSES.has(status))
            continue;
        const total = (_b = inv.amount_cents) !== null && _b !== void 0 ? _b : 0;
        const paid = (_c = inv.amount_paid) !== null && _c !== void 0 ? _c : 0;
        const balance = Math.max(0, total - paid);
        if (balance <= 0)
            continue;
        const dueIso = (_d = inv.due_date) !== null && _d !== void 0 ? _d : inv.invoice_date;
        if (!dueIso)
            continue;
        const due = new Date(`${dueIso}T00:00:00`).getTime();
        const days = Math.floor((now - due) / DAY_MS);
        const bucket = buckets.find((b) => {
            const gteMin = b.minDays === -Infinity || days >= b.minDays;
            const lteMax = b.maxDays === null || days <= b.maxDays;
            return gteMin && lteMax;
        });
        if (!bucket)
            continue;
        bucket.count += 1;
        bucket.totalAmountCents += balance;
    }
    return buckets;
}
export function computeScheduleHeatmap(schedule) {
    const map = new Map();
    for (const block of schedule) {
        if (!block.block_date || !block.start_time)
            continue;
        if (!shouldCountScheduledBlock(block))
            continue;
        const date = new Date(`${block.block_date}T00:00:00`);
        const day = date.getDay();
        const hour = Number(block.start_time.slice(0, 2));
        if (!Number.isFinite(hour))
            continue;
        const key = `${day}:${hour}`;
        const existing = map.get(key);
        if (existing) {
            existing.count += 1;
        }
        else {
            map.set(key, { day, hour, count: 1 });
        }
    }
    return Array.from(map.values()).sort((a, b) => a.day === b.day ? a.hour - b.hour : a.day - b.day);
}
export function computeTeacherLoad(teachers, students, schedule) {
    var _a, _b, _c;
    const studentsByTeacher = new Map();
    for (const s of students) {
        const tid = s.teacher_id;
        if (!tid)
            continue;
        studentsByTeacher.set(tid, ((_a = studentsByTeacher.get(tid)) !== null && _a !== void 0 ? _a : 0) + 1);
    }
    const lessonsByTeacher = new Map();
    const hoursByTeacher = new Map();
    for (const b of schedule) {
        if (!shouldCountScheduledBlock(b))
            continue;
        const tid = b.teacher_id;
        if (!tid)
            continue;
        lessonsByTeacher.set(tid, ((_b = lessonsByTeacher.get(tid)) !== null && _b !== void 0 ? _b : 0) + 1);
        if (b.start_time && b.end_time) {
            const [sh, sm] = b.start_time.split(":").map(Number);
            const [eh, em] = b.end_time.split(":").map(Number);
            const minutes = eh * 60 + em - (sh * 60 + sm);
            if (Number.isFinite(minutes) && minutes > 0) {
                hoursByTeacher.set(tid, ((_c = hoursByTeacher.get(tid)) !== null && _c !== void 0 ? _c : 0) + minutes / 60);
            }
        }
    }
    return teachers
        .map((t) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const first = (_a = t["first_name"]) !== null && _a !== void 0 ? _a : "";
        const last = (_b = t["last_name"]) !== null && _b !== void 0 ? _b : "";
        const composed = `${first} ${last}`.trim();
        const explicit = (_c = t["full_name"]) !== null && _c !== void 0 ? _c : "";
        const email = (_d = t["email"]) !== null && _d !== void 0 ? _d : "";
        const fullName = explicit || composed || email || t.id;
        return {
            teacherId: t.id,
            teacherName: fullName,
            studentCount: (_e = studentsByTeacher.get(t.id)) !== null && _e !== void 0 ? _e : 0,
            lessonCount: (_f = lessonsByTeacher.get(t.id)) !== null && _f !== void 0 ? _f : 0,
            hoursScheduled: Number(((_g = hoursByTeacher.get(t.id)) !== null && _g !== void 0 ? _g : 0).toFixed(2)),
        };
    })
        .sort((a, b) => b.lessonCount - a.lessonCount);
}
