import { listLeads } from "@data/leads";
import { listStudents } from "@data/students";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import { listSquareInvoices, listSquarePayments, } from "@data/squareInvoices";
import { clientFor } from "@data/_client";
const DAY_MS = 1000 * 60 * 60 * 24;
function daysBetween(fromIso, to) {
    if (!fromIso)
        return 0;
    const from = new Date(fromIso).getTime();
    if (!Number.isFinite(from))
        return 0;
    return Math.max(0, Math.floor((to.getTime() - from) / DAY_MS));
}
function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addDays(d, n) {
    const copy = new Date(d.getTime());
    copy.setDate(copy.getDate() + n);
    return copy;
}
function toISODate(d) {
    return d.toISOString().slice(0, 10);
}
function parseTimeToMinutes(t) {
    if (!t)
        return null;
    const parts = t.split(":");
    if (parts.length < 2)
        return null;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isFinite(h) || !Number.isFinite(m))
        return null;
    return h * 60 + m;
}
function blockDurationMinutes(block) {
    const start = parseTimeToMinutes(block.start_time);
    const end = parseTimeToMinutes(block.end_time);
    if (start === null || end === null)
        return 0;
    return Math.max(0, end - start);
}
export async function getDirectorLocation(tenantId, locationId) {
    var _a;
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from("locations")
        .select("id,name,tenant_id")
        .eq("tenant_id", tenantId)
        .eq("id", locationId)
        .maybeSingle();
    if (error)
        throw error;
    if (data && data.id && data.name) {
        return {
            id: data.id,
            name: data.name,
            tenant_id: (_a = data.tenant_id) !== null && _a !== void 0 ? _a : tenantId,
        };
    }
    return { id: locationId, name: "All Locations", tenant_id: tenantId };
}
export async function listLocations(tenantId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from("locations")
        .select("id,name,is_active,tenant_id")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : [])
        .filter((r) => r.is_active !== false)
        .map((r) => {
        var _a;
        return ({
            id: r.id,
            name: r.name,
            tenant_id: (_a = r.tenant_id) !== null && _a !== void 0 ? _a : tenantId,
        });
    });
}
export async function getDirectorLeads(tenantId, locationId) {
    const rows = await listLeads(tenantId, { location_id: locationId }, { orderBy: "created_at", ascending: false, limit: 500 });
    const now = new Date();
    return rows.map((lead) => (Object.assign(Object.assign({}, lead), { age_days: daysBetween(lead.created_at, now) })));
}
export async function getDirectorStudents(tenantId, locationId) {
    const rows = await listStudents(tenantId, { location_id: locationId }, { orderBy: "created_at", ascending: false, limit: 1000 });
    const now = new Date();
    return rows.map((student) => (Object.assign(Object.assign({}, student), { days_since_created: daysBetween(student.created_at, now) })));
}
export async function getDirectorTeachers(tenantId, locationId) {
    var _a, _b, _c;
    const supabase = clientFor(tenantId);
    const { data: linkRows, error: linkErr } = await supabase
        .from("teacher_locations")
        .select("teacher_id")
        .eq("location_id", locationId);
    if (linkErr)
        throw linkErr;
    const teacherIds = Array.from(new Set((linkRows !== null && linkRows !== void 0 ? linkRows : []).map((r) => r.teacher_id).filter(Boolean)));
    let teachers = [];
    if (teacherIds.length > 0) {
        const { data: teacherRows, error: teacherErr } = await supabase
            .from("teachers")
            .select("*")
            .eq("tenant_id", tenantId)
            .in("id", teacherIds);
        if (teacherErr)
            throw teacherErr;
        teachers = (teacherRows !== null && teacherRows !== void 0 ? teacherRows : []);
    }
    const weekStart = addDays(new Date(), -7);
    const weekEnd = new Date();
    const blocks = await listScheduleBlocks(tenantId, {
        location_id: locationId,
        date_from: toISODate(weekStart),
        date_to: toISODate(weekEnd),
    }, { limit: 2000 });
    const { data: studentRows } = await supabase
        .from("students")
        .select("id,teacher_id,status")
        .eq("tenant_id", tenantId)
        .eq("location_id", locationId);
    const studentsByTeacher = new Map();
    for (const s of studentRows !== null && studentRows !== void 0 ? studentRows : []) {
        if (s.status !== "active")
            continue;
        const tid = (_a = s.teacher_id) !== null && _a !== void 0 ? _a : null;
        if (!tid)
            continue;
        studentsByTeacher.set(tid, ((_b = studentsByTeacher.get(tid)) !== null && _b !== void 0 ? _b : 0) + 1);
    }
    const blocksByTeacher = new Map();
    for (const b of blocks) {
        const tid = b.teacher_id;
        if (!tid)
            continue;
        const arr = (_c = blocksByTeacher.get(tid)) !== null && _c !== void 0 ? _c : [];
        arr.push(b);
        blocksByTeacher.set(tid, arr);
    }
    const maxMinutes = Math.max(1, ...Array.from(blocksByTeacher.values()).map((list) => list.reduce((sum, b) => sum + blockDurationMinutes(b), 0)));
    return teachers.map((t) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const teacherBlocks = (_a = blocksByTeacher.get(t.id)) !== null && _a !== void 0 ? _a : [];
        const weeklyMinutes = teacherBlocks.reduce((sum, b) => sum + blockDurationMinutes(b), 0);
        const firstName = (_b = t.first_name) !== null && _b !== void 0 ? _b : "";
        const lastName = (_c = t.last_name) !== null && _c !== void 0 ? _c : "";
        const displayName = (_e = (_d = t.display_name) !== null && _d !== void 0 ? _d : `${firstName} ${lastName}`.trim()) !== null && _e !== void 0 ? _e : "Teacher";
        const email = (_f = t.email) !== null && _f !== void 0 ? _f : null;
        const isActive = t.is_active;
        return {
            id: t.id,
            tenant_id: t.tenant_id,
            name: displayName || "Teacher",
            email,
            status: isActive === false ? "inactive" : "active",
            activeStudents: (_g = studentsByTeacher.get(t.id)) !== null && _g !== void 0 ? _g : 0,
            weeklyLessons: teacherBlocks.length,
            weeklyMinutes,
            utilizationPct: Math.round((weeklyMinutes / maxMinutes) * 100),
        };
    });
}
export async function getDirectorSchedule(tenantId, locationId) {
    var _a, _b;
    const now = new Date();
    const start = addDays(now, -7);
    const end = addDays(now, 21);
    const blocks = await listScheduleBlocks(tenantId, {
        location_id: locationId,
        date_from: toISODate(start),
        date_to: toISODate(end),
    }, { limit: 5000 });
    const heatmapMap = new Map();
    for (const b of blocks) {
        if (!b.block_date || !b.start_time)
            continue;
        const date = new Date(`${b.block_date}T${b.start_time}`);
        if (Number.isNaN(date.getTime()))
            continue;
        const dow = date.getDay();
        const hour = date.getHours();
        const key = `${dow}:${hour}`;
        const existing = heatmapMap.get(key);
        if (existing) {
            existing.count += 1;
        }
        else {
            heatmapMap.set(key, { dayOfWeek: dow, hour, count: 1 });
        }
    }
    const heatmap = Array.from(heatmapMap.values());
    let peak = null;
    for (const cell of heatmap) {
        if (!peak || cell.count > peak.count)
            peak = cell;
    }
    return {
        startDate: toISODate(start),
        endDate: toISODate(end),
        blocks,
        heatmap,
        peakHour: (_a = peak === null || peak === void 0 ? void 0 : peak.hour) !== null && _a !== void 0 ? _a : null,
        peakDayOfWeek: (_b = peak === null || peak === void 0 ? void 0 : peak.dayOfWeek) !== null && _b !== void 0 ? _b : null,
    };
}
export async function getDirectorBilling(tenantId, locationId) {
    var _a, _b, _c, _d;
    const [invoicesAll, paymentsAll] = await Promise.all([
        listSquareInvoices(tenantId, undefined, { limit: 500 }),
        listSquarePayments(tenantId, { limit: 500 }),
    ]);
    const invoices = invoicesAll.filter((inv) => !inv.location_id || inv.location_id === locationId);
    const payments = paymentsAll.filter((p) => !p.location_id || p.location_id === locationId);
    const now = new Date();
    const monthStart = startOfMonth(now);
    let totalOutstandingCents = 0;
    let totalPaidCents = 0;
    let overdueCount = 0;
    let overdueAmountCents = 0;
    let invoiceSumCents = 0;
    let invoiceCount = 0;
    for (const inv of invoices) {
        const amount = (_a = inv.amount_cents) !== null && _a !== void 0 ? _a : 0;
        const paid = (_b = inv.amount_paid) !== null && _b !== void 0 ? _b : 0;
        invoiceSumCents += amount;
        invoiceCount += 1;
        const outstanding = Math.max(0, amount - paid);
        totalPaidCents += paid;
        totalOutstandingCents += outstanding;
        if (outstanding > 0 && inv.due_date) {
            const due = new Date(inv.due_date);
            if (!Number.isNaN(due.getTime()) && due.getTime() < now.getTime()) {
                overdueCount += 1;
                overdueAmountCents += outstanding;
            }
        }
    }
    let monthToDateRevenueCents = 0;
    for (const pay of payments) {
        const refDate = pay.reporting_date ? new Date(pay.reporting_date) : null;
        if (refDate && refDate.getTime() >= monthStart.getTime()) {
            monthToDateRevenueCents += (_d = (_c = pay.net_total_cents) !== null && _c !== void 0 ? _c : pay.total_money_cents) !== null && _d !== void 0 ? _d : 0;
        }
    }
    const averageInvoiceCents = invoiceCount > 0 ? Math.round(invoiceSumCents / invoiceCount) : 0;
    return {
        invoices,
        payments,
        totalOutstandingCents,
        totalPaidCents,
        overdueCount,
        overdueAmountCents,
        monthToDateRevenueCents,
        averageInvoiceCents,
    };
}
export async function getDirectorKpis(tenantId, locationId, parts) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const activeStudents = parts.students.filter((s) => s.status === "active").length;
    const inactiveStudents = parts.students.length - activeStudents;
    const newStudentsThisMonth = parts.students.filter((s) => {
        if (!s.created_at)
            return false;
        const d = new Date(s.created_at);
        return !Number.isNaN(d.getTime()) && d.getTime() >= monthStart.getTime();
    }).length;
    const convertedLeads = parts.leads.filter((l) => l.converted_student_id != null).length;
    const openLeads = parts.leads.filter((l) => l.converted_student_id == null && l.stage !== "lost").length;
    const conversionRate = parts.leads.length > 0
        ? Math.round((convertedLeads / parts.leads.length) * 100)
        : 0;
    const weeklyLessonCount = parts.teachers.reduce((sum, t) => sum + t.weeklyLessons, 0);
    const weeklyLessonMinutes = parts.teachers.reduce((sum, t) => sum + t.weeklyMinutes, 0);
    void locationId;
    return {
        totalStudents: parts.students.length,
        activeStudents,
        inactiveStudents,
        newStudentsThisMonth,
        totalLeads: parts.leads.length,
        openLeads,
        convertedLeads,
        conversionRate,
        totalTeachers: parts.teachers.length,
        weeklyLessonCount,
        weeklyLessonMinutes,
        outstandingInvoiceAmountCents: parts.billing.totalOutstandingCents,
        paidInvoiceAmountCents: parts.billing.totalPaidCents,
        monthToDateRevenueCents: parts.billing.monthToDateRevenueCents,
    };
}
