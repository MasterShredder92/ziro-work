import { listLeads } from "@data/leads";
import { listStudents } from "@data/students";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import {
  listSquareInvoices,
  listSquarePayments,
} from "@data/squareInvoices";
import { clientFor } from "@data/_client";
import type {
  Lead,
  Student,
  Teacher,
  ScheduleBlock,
  SquareInvoice,
  SquarePayment,
} from "@/lib/types/entities";
import type {
  DirectorBillingData,
  DirectorKpis,
  DirectorLeadRow,
  DirectorLocation,
  DirectorScheduleCell,
  DirectorScheduleData,
  DirectorStudentRow,
  DirectorTeacherRow,
} from "./types";

const DAY_MS = 1000 * 60 * 60 * 24;

function daysBetween(fromIso: string | null | undefined, to: Date): number {
  if (!fromIso) return 0;
  const from = new Date(fromIso).getTime();
  if (!Number.isFinite(from)) return 0;
  return Math.max(0, Math.floor((to.getTime() - from) / DAY_MS));
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d.getTime());
  copy.setDate(copy.getDate() + n);
  return copy;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

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

export async function getDirectorLocation(
  tenantId: string,
  locationId: string,
): Promise<DirectorLocation> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from("locations")
    .select("id,name,tenant_id")
    .eq("tenant_id", tenantId)
    .eq("id", locationId)
    .maybeSingle();
  if (error) throw error;
  if (data && data.id && data.name) {
    return {
      id: data.id as string,
      name: data.name as string,
      tenant_id: (data.tenant_id as string) ?? tenantId,
    };
  }
  return { id: locationId, name: "All Locations", tenant_id: tenantId };
}

export async function listLocations(
  tenantId: string,
): Promise<DirectorLocation[]> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from("locations")
    .select("id,name,is_active,tenant_id")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? [])
    .filter((r) => r.is_active !== false)
    .map((r) => ({
      id: r.id as string,
      name: r.name as string,
      tenant_id: (r.tenant_id as string) ?? tenantId,
    }));
}

export async function getDirectorLeads(
  tenantId: string,
  locationId: string,
): Promise<DirectorLeadRow[]> {
  const rows = await listLeads(
    tenantId,
    { location_id: locationId },
    { orderBy: "created_at", ascending: false, limit: 500 },
  );
  const now = new Date();
  return rows.map((lead: Lead) => ({
    ...lead,
    age_days: daysBetween(lead.created_at, now),
  }));
}

export async function getDirectorStudents(
  tenantId: string,
  locationId: string,
): Promise<DirectorStudentRow[]> {
  const rows = await listStudents(
    tenantId,
    { location_id: locationId },
    { orderBy: "created_at", ascending: false, limit: 1000 },
  );
  const now = new Date();
  return rows.map((student: Student) => ({
    ...student,
    days_since_created: daysBetween(student.created_at, now),
  }));
}

export async function getDirectorTeachers(
  tenantId: string,
  locationId: string,
): Promise<DirectorTeacherRow[]> {
  const supabase = clientFor(tenantId);

  const { data: linkRows, error: linkErr } = await supabase
    .from("teacher_locations")
    .select("teacher_id")
    .eq("location_id", locationId);
  if (linkErr) throw linkErr;

  const teacherIds = Array.from(
    new Set((linkRows ?? []).map((r) => r.teacher_id as string).filter(Boolean)),
  );

  let teachers: Teacher[] = [];
  if (teacherIds.length > 0) {
    const { data: teacherRows, error: teacherErr } = await supabase
      .from("teachers")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("id", teacherIds);
    if (teacherErr) throw teacherErr;
    teachers = (teacherRows ?? []) as Teacher[];
  }

  const weekStart = addDays(new Date(), -7);
  const weekEnd = new Date();
  const blocks = await listScheduleBlocks(
    tenantId,
    {
      location_id: locationId,
      date_from: toISODate(weekStart),
      date_to: toISODate(weekEnd),
    },
    { limit: 2000 },
  );

  const { data: studentRows } = await supabase
    .from("students")
    .select("id,teacher_id,status")
    .eq("tenant_id", tenantId)
    .eq("location_id", locationId);
  const studentsByTeacher = new Map<string, number>();
  for (const s of studentRows ?? []) {
    if (s.status !== "active") continue;
    const tid = (s.teacher_id as string | null) ?? null;
    if (!tid) continue;
    studentsByTeacher.set(tid, (studentsByTeacher.get(tid) ?? 0) + 1);
  }

  const blocksByTeacher = new Map<string, ScheduleBlock[]>();
  for (const b of blocks) {
    const tid = b.teacher_id;
    if (!tid) continue;
    const arr = blocksByTeacher.get(tid) ?? [];
    arr.push(b);
    blocksByTeacher.set(tid, arr);
  }

  const maxMinutes = Math.max(
    1,
    ...Array.from(blocksByTeacher.values()).map((list) =>
      list.reduce((sum, b) => sum + blockDurationMinutes(b), 0),
    ),
  );

  return teachers.map((t) => {
    const teacherBlocks = blocksByTeacher.get(t.id) ?? [];
    const weeklyMinutes = teacherBlocks.reduce(
      (sum, b) => sum + blockDurationMinutes(b),
      0,
    );
    const firstName = (t as { first_name?: string | null }).first_name ?? "";
    const lastName = (t as { last_name?: string | null }).last_name ?? "";
    const displayName =
      (t as { display_name?: string | null }).display_name ??
      `${firstName} ${lastName}`.trim() ??
      "Teacher";
    const email = (t as { email?: string | null }).email ?? null;
    const isActive = (t as { is_active?: boolean }).is_active;
    return {
      id: t.id,
      tenant_id: t.tenant_id,
      name: displayName || "Teacher",
      email,
      status: isActive === false ? "inactive" : "active",
      activeStudents: studentsByTeacher.get(t.id) ?? 0,
      weeklyLessons: teacherBlocks.length,
      weeklyMinutes,
      utilizationPct: Math.round((weeklyMinutes / maxMinutes) * 100),
    } satisfies DirectorTeacherRow;
  });
}

export async function getDirectorSchedule(
  tenantId: string,
  locationId: string,
): Promise<DirectorScheduleData> {
  const now = new Date();
  const start = addDays(now, -7);
  const end = addDays(now, 21);

  const blocks = await listScheduleBlocks(
    tenantId,
    {
      location_id: locationId,
      date_from: toISODate(start),
      date_to: toISODate(end),
    },
    { limit: 5000 },
  );

  const heatmapMap = new Map<string, DirectorScheduleCell>();
  for (const b of blocks) {
    if (!b.block_date || !b.start_time) continue;
    const date = new Date(`${b.block_date}T${b.start_time}`);
    if (Number.isNaN(date.getTime())) continue;
    const dow = date.getDay();
    const hour = date.getHours();
    const key = `${dow}:${hour}`;
    const existing = heatmapMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      heatmapMap.set(key, { dayOfWeek: dow, hour, count: 1 });
    }
  }
  const heatmap = Array.from(heatmapMap.values());

  let peak: DirectorScheduleCell | null = null;
  for (const cell of heatmap) {
    if (!peak || cell.count > peak.count) peak = cell;
  }

  return {
    startDate: toISODate(start),
    endDate: toISODate(end),
    blocks,
    heatmap,
    peakHour: peak?.hour ?? null,
    peakDayOfWeek: peak?.dayOfWeek ?? null,
  };
}

export async function getDirectorBilling(
  tenantId: string,
  locationId: string,
): Promise<DirectorBillingData> {
  const [invoicesAll, paymentsAll] = await Promise.all([
    listSquareInvoices(tenantId, undefined, { limit: 500 }),
    listSquarePayments(tenantId, { limit: 500 }),
  ]);

  const invoices = invoicesAll.filter(
    (inv: SquareInvoice) =>
      !inv.location_id || inv.location_id === locationId,
  );
  const payments = paymentsAll.filter(
    (p: SquarePayment) => !p.location_id || p.location_id === locationId,
  );

  const now = new Date();
  const monthStart = startOfMonth(now);

  let totalOutstandingCents = 0;
  let totalPaidCents = 0;
  let overdueCount = 0;
  let overdueAmountCents = 0;
  let invoiceSumCents = 0;
  let invoiceCount = 0;

  for (const inv of invoices) {
    const amount = inv.amount_cents ?? 0;
    const paid = inv.amount_paid ?? 0;
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
      monthToDateRevenueCents += pay.net_total_cents ?? pay.total_money_cents ?? 0;
    }
  }

  const averageInvoiceCents =
    invoiceCount > 0 ? Math.round(invoiceSumCents / invoiceCount) : 0;

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

export async function getDirectorKpis(
  tenantId: string,
  locationId: string,
  parts: {
    leads: DirectorLeadRow[];
    students: DirectorStudentRow[];
    teachers: DirectorTeacherRow[];
    schedule: DirectorScheduleData;
    billing: DirectorBillingData;
  },
): Promise<DirectorKpis> {
  const now = new Date();
  const monthStart = startOfMonth(now);

  const activeStudents = parts.students.filter(
    (s) => s.status === "active",
  ).length;
  const inactiveStudents = parts.students.length - activeStudents;
  const newStudentsThisMonth = parts.students.filter((s) => {
    if (!s.created_at) return false;
    const d = new Date(s.created_at);
    return !Number.isNaN(d.getTime()) && d.getTime() >= monthStart.getTime();
  }).length;

  const convertedLeads = parts.leads.filter(
    (l) => l.converted_student_id != null,
  ).length;
  const openLeads = parts.leads.filter(
    (l) => l.converted_student_id == null && l.stage !== "lost",
  ).length;
  const conversionRate =
    parts.leads.length > 0
      ? Math.round((convertedLeads / parts.leads.length) * 100)
      : 0;

  const weeklyLessonCount = parts.teachers.reduce(
    (sum, t) => sum + t.weeklyLessons,
    0,
  );
  const weeklyLessonMinutes = parts.teachers.reduce(
    (sum, t) => sum + t.weeklyMinutes,
    0,
  );

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
