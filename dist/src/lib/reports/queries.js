/**
 * Reporting OS — data fetchers.
 *
 * Thin aggregation helpers that sit on top of the @data/* facades.
 * They never talk to Supabase directly — legacy query logic stays
 * behind the facades.
 */
import { listStudents } from "@data/students";
import { listFamilies } from "@data/families";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import { listSquareInvoices, listSquarePayments, } from "@data/squareInvoices";
import { listLeads } from "@data/leads";
const MS_DAY = 24 * 60 * 60 * 1000;
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
function monthKey(iso) {
    if (!iso)
        return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return null;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}
function inRange(iso, range) {
    if (!iso)
        return false;
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t))
        return false;
    const from = new Date(`${range.from}T00:00:00Z`).getTime();
    const to = new Date(`${range.to}T23:59:59Z`).getTime();
    return t >= from && t <= to;
}
export async function getEnrollmentData(tenantId, range) {
    var _a, _b, _c, _d, _e;
    const [students, families] = await Promise.all([
        listStudents(tenantId, undefined, { limit: 2000 }),
        listFamilies(tenantId, undefined, { limit: 2000 }),
    ]);
    const activeStudents = students.filter((s) => s.status === "active").length;
    const inactiveStudents = students.length - activeStudents;
    const newStudents = students.filter((s) => inRange(s.created_at, range)).length;
    const monthMap = new Map();
    for (const s of students) {
        const key = monthKey(s.created_at);
        if (!key)
            continue;
        if (!inRange(s.created_at, range))
            continue;
        monthMap.set(key, ((_a = monthMap.get(key)) !== null && _a !== void 0 ? _a : 0) + 1);
    }
    const byMonth = Array.from(monthMap.entries())
        .map(([month, newStudents]) => ({ month, newStudents }))
        .sort((a, b) => a.month.localeCompare(b.month));
    const instrumentMap = new Map();
    for (const s of students) {
        const k = ((_b = s.instrument) !== null && _b !== void 0 ? _b : "unspecified").trim() || "unspecified";
        instrumentMap.set(k, ((_c = instrumentMap.get(k)) !== null && _c !== void 0 ? _c : 0) + 1);
    }
    const byInstrument = Array.from(instrumentMap.entries())
        .map(([instrument, count]) => ({ instrument, count }))
        .sort((a, b) => b.count - a.count);
    const locationMap = new Map();
    for (const s of students) {
        const k = ((_d = s.location_id) !== null && _d !== void 0 ? _d : "").trim();
        if (!k)
            continue;
        locationMap.set(k, ((_e = locationMap.get(k)) !== null && _e !== void 0 ? _e : 0) + 1);
    }
    const byLocation = Array.from(locationMap.entries())
        .map(([locationId, count]) => ({ locationId, count }))
        .sort((a, b) => b.count - a.count);
    const familyCount = families.length;
    return {
        totalStudents: students.length,
        activeStudents,
        inactiveStudents,
        newStudents,
        byMonth,
        byInstrument,
        byLocation,
        families: familyCount,
        students,
    };
}
export async function getRevenueData(tenantId, range) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const [invoices, payments] = await Promise.all([
        listSquareInvoices(tenantId, undefined, {
            limit: 1000,
            orderBy: "invoice_date",
            ascending: false,
        }),
        listSquarePayments(tenantId, {
            limit: 1000,
            orderBy: "reporting_date",
            ascending: false,
        }),
    ]);
    const invoicesInRange = invoices.filter((inv) => { var _a, _b; return inRange((_b = (_a = inv.invoice_date) !== null && _a !== void 0 ? _a : inv.square_created_at) !== null && _b !== void 0 ? _b : inv.synced_at, range); });
    const paymentsInRange = payments.filter((p) => { var _a; return inRange((_a = p.reporting_date) !== null && _a !== void 0 ? _a : p.synced_at, range); });
    let outstandingCents = 0;
    let overdueCents = 0;
    let overdueCount = 0;
    let paidCount = 0;
    const now = Date.now();
    for (const inv of invoices) {
        const amount = (_a = inv.amount_cents) !== null && _a !== void 0 ? _a : 0;
        const paid = (_b = inv.amount_paid) !== null && _b !== void 0 ? _b : 0;
        const outstanding = Math.max(0, amount - paid);
        outstandingCents += outstanding;
        if (paid > 0 && outstanding === 0)
            paidCount += 1;
        if (outstanding > 0 && inv.due_date) {
            const due = new Date(inv.due_date).getTime();
            if (Number.isFinite(due) && due < now) {
                overdueCount += 1;
                overdueCents += outstanding;
            }
        }
    }
    let grossRevenueCents = 0;
    let netRevenueCents = 0;
    const monthMap = new Map();
    for (const p of paymentsInRange) {
        const gross = (_c = p.total_money_cents) !== null && _c !== void 0 ? _c : 0;
        const net = (_d = p.net_total_cents) !== null && _d !== void 0 ? _d : gross;
        grossRevenueCents += gross;
        netRevenueCents += net;
        const key = monthKey((_e = p.reporting_date) !== null && _e !== void 0 ? _e : p.synced_at);
        if (!key)
            continue;
        const bucket = (_f = monthMap.get(key)) !== null && _f !== void 0 ? _f : {
            grossCents: 0,
            netCents: 0,
            invoiceCount: 0,
        };
        bucket.grossCents += gross;
        bucket.netCents += net;
        monthMap.set(key, bucket);
    }
    for (const inv of invoicesInRange) {
        const key = monthKey((_h = (_g = inv.invoice_date) !== null && _g !== void 0 ? _g : inv.square_created_at) !== null && _h !== void 0 ? _h : inv.synced_at);
        if (!key)
            continue;
        const bucket = (_j = monthMap.get(key)) !== null && _j !== void 0 ? _j : {
            grossCents: 0,
            netCents: 0,
            invoiceCount: 0,
        };
        bucket.invoiceCount += 1;
        monthMap.set(key, bucket);
    }
    const byMonth = Array.from(monthMap.entries())
        .map(([month, v]) => ({
        month,
        grossCents: v.grossCents,
        netCents: v.netCents,
        invoiceCount: v.invoiceCount,
    }))
        .sort((a, b) => a.month.localeCompare(b.month));
    return {
        grossRevenueCents,
        netRevenueCents,
        outstandingCents,
        overdueCents,
        overdueCount,
        paidCount,
        invoiceCount: invoices.length,
        byMonth,
        invoices: invoicesInRange,
        payments: paymentsInRange,
    };
}
function weekKey(iso) {
    if (!iso)
        return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return null;
    const day = d.getUTCDay();
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
    return monday.toISOString().slice(0, 10);
}
export async function getAttendanceData(tenantId, range) {
    var _a, _b;
    const blocks = await listScheduleBlocks(tenantId, { date_from: range.from, date_to: range.to }, { limit: 5000 });
    let checkedInBlocks = 0;
    let calloutBlocks = 0;
    let makeupBlocks = 0;
    const dowMap = new Map();
    const weekMap = new Map();
    const isCallout = (block) => Boolean(block.callout_id) ||
        Boolean(block.is_family_callout) ||
        block.block_type === "call_out";
    for (const b of blocks) {
        if (b.checked_in)
            checkedInBlocks += 1;
        if (isCallout(b))
            calloutBlocks += 1;
        if (b.is_makeup_session || b.block_type === "makeup_session")
            makeupBlocks += 1;
        if (b.block_date) {
            const day = new Date(`${b.block_date}T00:00:00Z`).getUTCDay();
            const dow = (_a = dowMap.get(day)) !== null && _a !== void 0 ? _a : { count: 0, checkedIn: 0 };
            dow.count += 1;
            if (b.checked_in)
                dow.checkedIn += 1;
            dowMap.set(day, dow);
            const wk = weekKey(b.block_date);
            if (wk) {
                const w = (_b = weekMap.get(wk)) !== null && _b !== void 0 ? _b : { count: 0, checkedIn: 0 };
                w.count += 1;
                if (b.checked_in)
                    w.checkedIn += 1;
                weekMap.set(wk, w);
            }
        }
    }
    const heldBlocks = blocks.length - calloutBlocks;
    const attendanceRatePct = heldBlocks > 0 ? Math.round((checkedInBlocks / heldBlocks) * 100) : 0;
    const byDayOfWeek = Array.from(dowMap.entries())
        .map(([dayOfWeek, v]) => ({
        dayOfWeek,
        count: v.count,
        checkedIn: v.checkedIn,
    }))
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    const byWeek = Array.from(weekMap.entries())
        .map(([week, v]) => ({ week, count: v.count, checkedIn: v.checkedIn }))
        .sort((a, b) => a.week.localeCompare(b.week));
    return {
        totalBlocks: blocks.length,
        heldBlocks,
        checkedInBlocks,
        calloutBlocks,
        makeupBlocks,
        attendanceRatePct,
        byDayOfWeek,
        byWeek,
    };
}
export async function getTeacherLoadData(tenantId, range) {
    var _a, _b, _c, _d;
    const [blocks, students] = await Promise.all([
        listScheduleBlocks(tenantId, { date_from: range.from, date_to: range.to }, { limit: 5000 }),
        listStudents(tenantId, { status: "active" }, { limit: 2000 }),
    ]);
    const studentsByTeacher = new Map();
    for (const s of students) {
        const tid = ((_a = s.teacher_id) !== null && _a !== void 0 ? _a : "").trim();
        if (!tid)
            continue;
        studentsByTeacher.set(tid, ((_b = studentsByTeacher.get(tid)) !== null && _b !== void 0 ? _b : 0) + 1);
    }
    const perTeacher = new Map();
    for (const b of blocks) {
        const tid = ((_c = b.teacher_id) !== null && _c !== void 0 ? _c : "").trim();
        if (!tid)
            continue;
        const entry = (_d = perTeacher.get(tid)) !== null && _d !== void 0 ? _d : { lessons: 0, minutes: 0 };
        entry.lessons += 1;
        entry.minutes += blockDurationMinutes(b);
        perTeacher.set(tid, entry);
    }
    const rangeFromT = new Date(`${range.from}T00:00:00Z`).getTime();
    const rangeToT = new Date(`${range.to}T23:59:59Z`).getTime();
    const weeks = Math.max(1, Math.ceil((rangeToT - rangeFromT) / (7 * MS_DAY)));
    const maxMinutes = Math.max(1, ...Array.from(perTeacher.values()).map((v) => v.minutes));
    const rows = Array.from(perTeacher.entries()).map(([teacherId, v]) => {
        var _a;
        return ({
            teacherId,
            weeklyLessons: Math.round(v.lessons / weeks),
            weeklyMinutes: Math.round(v.minutes / weeks),
            activeStudents: (_a = studentsByTeacher.get(teacherId)) !== null && _a !== void 0 ? _a : 0,
            utilizationPct: Math.round((v.minutes / maxMinutes) * 100),
        });
    });
    rows.sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);
    const totalLessons = rows.reduce((sum, r) => sum + r.weeklyLessons, 0);
    const totalMinutes = rows.reduce((sum, r) => sum + r.weeklyMinutes, 0);
    const averageUtilizationPct = rows.length > 0
        ? Math.round(rows.reduce((s, r) => s + r.utilizationPct, 0) / rows.length)
        : 0;
    return {
        teachers: rows,
        totalLessons,
        totalMinutes,
        averageUtilizationPct,
    };
}
export async function getLeadConversionData(tenantId, range) {
    var _a, _b, _c, _d, _e;
    const leads = await listLeads(tenantId, undefined, { limit: 2000 });
    const leadsInRange = leads.filter((l) => inRange(l.created_at, range));
    let converted = 0;
    let lost = 0;
    let open = 0;
    for (const l of leadsInRange) {
        if (l.converted_student_id)
            converted += 1;
        else if (l.stage === "lost")
            lost += 1;
        else
            open += 1;
    }
    const conversionRatePct = leadsInRange.length > 0
        ? Math.round((converted / leadsInRange.length) * 100)
        : 0;
    const stageMap = new Map();
    for (const l of leadsInRange) {
        const stage = ((_a = l.stage) !== null && _a !== void 0 ? _a : "new");
        stageMap.set(stage, ((_b = stageMap.get(stage)) !== null && _b !== void 0 ? _b : 0) + 1);
    }
    const byStage = Array.from(stageMap.entries())
        .map(([stage, count]) => ({ stage, count }))
        .sort((a, b) => b.count - a.count);
    const sourceMap = new Map();
    for (const l of leadsInRange) {
        const src = ((_c = l.source) !== null && _c !== void 0 ? _c : "unknown").trim() || "unknown";
        const entry = (_d = sourceMap.get(src)) !== null && _d !== void 0 ? _d : { count: 0, converted: 0 };
        entry.count += 1;
        if (l.converted_student_id)
            entry.converted += 1;
        sourceMap.set(src, entry);
    }
    const bySource = Array.from(sourceMap.entries())
        .map(([source, v]) => ({
        source,
        count: v.count,
        converted: v.converted,
    }))
        .sort((a, b) => b.count - a.count);
    const monthMap = new Map();
    for (const l of leadsInRange) {
        const key = monthKey(l.created_at);
        if (!key)
            continue;
        const entry = (_e = monthMap.get(key)) !== null && _e !== void 0 ? _e : { created: 0, converted: 0 };
        entry.created += 1;
        if (l.converted_student_id)
            entry.converted += 1;
        monthMap.set(key, entry);
    }
    const byMonth = Array.from(monthMap.entries())
        .map(([month, v]) => ({
        month,
        created: v.created,
        converted: v.converted,
    }))
        .sort((a, b) => a.month.localeCompare(b.month));
    return {
        totalLeads: leadsInRange.length,
        converted,
        lost,
        open,
        conversionRatePct,
        byStage,
        bySource,
        byMonth,
        leads: leadsInRange,
    };
}
