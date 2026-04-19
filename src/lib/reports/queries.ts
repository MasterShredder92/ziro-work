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
import {
  listSquareInvoices,
  listSquarePayments,
} from "@data/squareInvoices";
import { listLeads } from "@data/leads";

import type {
  Family,
  Lead,
  ScheduleBlock,
  SquareInvoice,
  SquarePayment,
  Student,
} from "@/lib/types/entities";
import type { ReportRange } from "./types";

const MS_DAY = 24 * 60 * 60 * 1000;

function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function blockDurationMinutes(block: ScheduleBlock): number {
  const start = parseTimeToMinutes(block.start_time);
  const end = parseTimeToMinutes(block.end_time);
  if (start === null || end === null) return 0;
  return Math.max(0, end - start);
}

function monthKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function inRange(iso: string | null | undefined, range: ReportRange): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  const from = new Date(`${range.from}T00:00:00Z`).getTime();
  const to = new Date(`${range.to}T23:59:59Z`).getTime();
  return t >= from && t <= to;
}

// ---------------------------------------------------------------------------
// Enrollment
// ---------------------------------------------------------------------------

export type EnrollmentData = {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  newStudents: number;
  byMonth: Array<{ month: string; newStudents: number }>;
  byInstrument: Array<{ instrument: string; count: number }>;
  byLocation: Array<{ locationId: string; count: number }>;
  families: number;
  students: Student[];
};

export async function getEnrollmentData(
  tenantId: string,
  range: ReportRange,
): Promise<EnrollmentData> {
  const [students, families] = await Promise.all([
    listStudents(tenantId, undefined, { limit: 2000 }),
    listFamilies(tenantId, undefined, { limit: 2000 }),
  ]);

  const activeStudents = students.filter((s) => s.status === "active").length;
  const inactiveStudents = students.length - activeStudents;
  const newStudents = students.filter((s) => inRange(s.created_at, range)).length;

  const monthMap = new Map<string, number>();
  for (const s of students) {
    const key = monthKey(s.created_at);
    if (!key) continue;
    if (!inRange(s.created_at, range)) continue;
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }
  const byMonth = Array.from(monthMap.entries())
    .map(([month, newStudents]) => ({ month, newStudents }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const instrumentMap = new Map<string, number>();
  for (const s of students) {
    const k = (s.instrument ?? "unspecified").trim() || "unspecified";
    instrumentMap.set(k, (instrumentMap.get(k) ?? 0) + 1);
  }
  const byInstrument = Array.from(instrumentMap.entries())
    .map(([instrument, count]) => ({ instrument, count }))
    .sort((a, b) => b.count - a.count);

  const locationMap = new Map<string, number>();
  for (const s of students) {
    const k = (s.location_id ?? "").trim();
    if (!k) continue;
    locationMap.set(k, (locationMap.get(k) ?? 0) + 1);
  }
  const byLocation = Array.from(locationMap.entries())
    .map(([locationId, count]) => ({ locationId, count }))
    .sort((a, b) => b.count - a.count);

  const familyCount = (families as Family[]).length;

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

// ---------------------------------------------------------------------------
// Revenue
// ---------------------------------------------------------------------------

export type RevenueData = {
  grossRevenueCents: number;
  netRevenueCents: number;
  outstandingCents: number;
  overdueCents: number;
  overdueCount: number;
  paidCount: number;
  invoiceCount: number;
  byMonth: Array<{
    month: string;
    grossCents: number;
    netCents: number;
    invoiceCount: number;
  }>;
  invoices: SquareInvoice[];
  payments: SquarePayment[];
};

export async function getRevenueData(
  tenantId: string,
  range: ReportRange,
): Promise<RevenueData> {
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

  const invoicesInRange = invoices.filter((inv: SquareInvoice) =>
    inRange(inv.invoice_date ?? inv.square_created_at ?? inv.synced_at, range),
  );
  const paymentsInRange = payments.filter((p: SquarePayment) =>
    inRange(p.reporting_date ?? p.synced_at, range),
  );

  let outstandingCents = 0;
  let overdueCents = 0;
  let overdueCount = 0;
  let paidCount = 0;
  const now = Date.now();
  for (const inv of invoices) {
    const amount = inv.amount_cents ?? 0;
    const paid = inv.amount_paid ?? 0;
    const outstanding = Math.max(0, amount - paid);
    outstandingCents += outstanding;
    if (paid > 0 && outstanding === 0) paidCount += 1;
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
  const monthMap = new Map<
    string,
    { grossCents: number; netCents: number; invoiceCount: number }
  >();

  for (const p of paymentsInRange) {
    const gross = p.total_money_cents ?? 0;
    const net = p.net_total_cents ?? gross;
    grossRevenueCents += gross;
    netRevenueCents += net;
    const key = monthKey(p.reporting_date ?? p.synced_at);
    if (!key) continue;
    const bucket = monthMap.get(key) ?? {
      grossCents: 0,
      netCents: 0,
      invoiceCount: 0,
    };
    bucket.grossCents += gross;
    bucket.netCents += net;
    monthMap.set(key, bucket);
  }

  for (const inv of invoicesInRange) {
    const key = monthKey(inv.invoice_date ?? inv.square_created_at ?? inv.synced_at);
    if (!key) continue;
    const bucket = monthMap.get(key) ?? {
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

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export type AttendanceData = {
  totalBlocks: number;
  heldBlocks: number;
  checkedInBlocks: number;
  calloutBlocks: number;
  makeupBlocks: number;
  attendanceRatePct: number;
  byDayOfWeek: Array<{ dayOfWeek: number; count: number; checkedIn: number }>;
  byWeek: Array<{ week: string; count: number; checkedIn: number }>;
};

function weekKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getUTCDay();
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

export async function getAttendanceData(
  tenantId: string,
  range: ReportRange,
): Promise<AttendanceData> {
  const blocks = await listScheduleBlocks(
    tenantId,
    { date_from: range.from, date_to: range.to },
    { limit: 5000 },
  );

  let checkedInBlocks = 0;
  let calloutBlocks = 0;
  let makeupBlocks = 0;
  const dowMap = new Map<number, { count: number; checkedIn: number }>();
  const weekMap = new Map<string, { count: number; checkedIn: number }>();

  const isCallout = (block: ScheduleBlock): boolean =>
    Boolean(block.callout_id) ||
    Boolean(block.is_family_callout) ||
    block.block_type === "call_out";

  for (const b of blocks) {
    if (b.checked_in) checkedInBlocks += 1;
    if (isCallout(b)) calloutBlocks += 1;
    if (b.is_makeup_session || b.block_type === "makeup_session") makeupBlocks += 1;
    if (b.block_date) {
      const day = new Date(`${b.block_date}T00:00:00Z`).getUTCDay();
      const dow = dowMap.get(day) ?? { count: 0, checkedIn: 0 };
      dow.count += 1;
      if (b.checked_in) dow.checkedIn += 1;
      dowMap.set(day, dow);

      const wk = weekKey(b.block_date);
      if (wk) {
        const w = weekMap.get(wk) ?? { count: 0, checkedIn: 0 };
        w.count += 1;
        if (b.checked_in) w.checkedIn += 1;
        weekMap.set(wk, w);
      }
    }
  }

  const heldBlocks = blocks.length - calloutBlocks;
  const attendanceRatePct =
    heldBlocks > 0 ? Math.round((checkedInBlocks / heldBlocks) * 100) : 0;

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

// ---------------------------------------------------------------------------
// Teacher Load
// ---------------------------------------------------------------------------

export type TeacherLoadRow = {
  teacherId: string;
  weeklyLessons: number;
  weeklyMinutes: number;
  activeStudents: number;
  utilizationPct: number;
};

export type TeacherLoadData = {
  teachers: TeacherLoadRow[];
  totalLessons: number;
  totalMinutes: number;
  averageUtilizationPct: number;
};

export async function getTeacherLoadData(
  tenantId: string,
  range: ReportRange,
): Promise<TeacherLoadData> {
  const [blocks, students] = await Promise.all([
    listScheduleBlocks(
      tenantId,
      { date_from: range.from, date_to: range.to },
      { limit: 5000 },
    ),
    listStudents(tenantId, { status: "active" }, { limit: 2000 }),
  ]);

  const studentsByTeacher = new Map<string, number>();
  for (const s of students) {
    const tid = (s.teacher_id ?? "").trim();
    if (!tid) continue;
    studentsByTeacher.set(tid, (studentsByTeacher.get(tid) ?? 0) + 1);
  }

  const perTeacher = new Map<string, { lessons: number; minutes: number }>();
  for (const b of blocks) {
    const tid = (b.teacher_id ?? "").trim();
    if (!tid) continue;
    const entry = perTeacher.get(tid) ?? { lessons: 0, minutes: 0 };
    entry.lessons += 1;
    entry.minutes += blockDurationMinutes(b);
    perTeacher.set(tid, entry);
  }

  const rangeFromT = new Date(`${range.from}T00:00:00Z`).getTime();
  const rangeToT = new Date(`${range.to}T23:59:59Z`).getTime();
  const weeks = Math.max(
    1,
    Math.ceil((rangeToT - rangeFromT) / (7 * MS_DAY)),
  );
  const maxMinutes = Math.max(
    1,
    ...Array.from(perTeacher.values()).map((v) => v.minutes),
  );

  const rows: TeacherLoadRow[] = Array.from(perTeacher.entries()).map(
    ([teacherId, v]) => ({
      teacherId,
      weeklyLessons: Math.round(v.lessons / weeks),
      weeklyMinutes: Math.round(v.minutes / weeks),
      activeStudents: studentsByTeacher.get(teacherId) ?? 0,
      utilizationPct: Math.round((v.minutes / maxMinutes) * 100),
    }),
  );
  rows.sort((a, b) => b.weeklyMinutes - a.weeklyMinutes);

  const totalLessons = rows.reduce((sum, r) => sum + r.weeklyLessons, 0);
  const totalMinutes = rows.reduce((sum, r) => sum + r.weeklyMinutes, 0);
  const averageUtilizationPct =
    rows.length > 0
      ? Math.round(
          rows.reduce((s, r) => s + r.utilizationPct, 0) / rows.length,
        )
      : 0;

  return {
    teachers: rows,
    totalLessons,
    totalMinutes,
    averageUtilizationPct,
  };
}

// ---------------------------------------------------------------------------
// Lead Conversion
// ---------------------------------------------------------------------------

export type LeadConversionData = {
  totalLeads: number;
  converted: number;
  lost: number;
  open: number;
  conversionRatePct: number;
  byStage: Array<{ stage: string; count: number }>;
  bySource: Array<{ source: string; count: number; converted: number }>;
  byMonth: Array<{
    month: string;
    created: number;
    converted: number;
  }>;
  leads: Lead[];
};

export async function getLeadConversionData(
  tenantId: string,
  range: ReportRange,
): Promise<LeadConversionData> {
  const leads = await listLeads(tenantId, undefined, { limit: 2000 });

  const leadsInRange = leads.filter((l) => inRange(l.created_at, range));

  let converted = 0;
  let lost = 0;
  let open = 0;
  for (const l of leadsInRange) {
    if (l.converted_student_id) converted += 1;
    else if (l.stage === "lost") lost += 1;
    else open += 1;
  }
  const conversionRatePct =
    leadsInRange.length > 0
      ? Math.round((converted / leadsInRange.length) * 100)
      : 0;

  const stageMap = new Map<string, number>();
  for (const l of leadsInRange) {
    const stage = (l.stage ?? "new") as string;
    stageMap.set(stage, (stageMap.get(stage) ?? 0) + 1);
  }
  const byStage = Array.from(stageMap.entries())
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);

  const sourceMap = new Map<string, { count: number; converted: number }>();
  for (const l of leadsInRange) {
    const src = (l.source ?? "unknown").trim() || "unknown";
    const entry = sourceMap.get(src) ?? { count: 0, converted: 0 };
    entry.count += 1;
    if (l.converted_student_id) entry.converted += 1;
    sourceMap.set(src, entry);
  }
  const bySource = Array.from(sourceMap.entries())
    .map(([source, v]) => ({
      source,
      count: v.count,
      converted: v.converted,
    }))
    .sort((a, b) => b.count - a.count);

  const monthMap = new Map<string, { created: number; converted: number }>();
  for (const l of leadsInRange) {
    const key = monthKey(l.created_at);
    if (!key) continue;
    const entry = monthMap.get(key) ?? { created: 0, converted: 0 };
    entry.created += 1;
    if (l.converted_student_id) entry.converted += 1;
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
