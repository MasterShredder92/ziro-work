/**
 * Reporting OS — built-in report definition registry.
 *
 * Every report implements the `ReportDefinition` contract:
 *   { id, name, description, parameters[], run(context) }
 *
 * Definitions are pure: they don't enforce auth, permissions, or logging.
 * That's the responsibility of `service.ts`. This keeps report logic
 * unit-testable in isolation.
 */

import type {
  AttendanceReport,
  EnrollmentReport,
  LeadConversionReport,
  ReportColumn,
  ReportContext,
  ReportDefinition,
  ReportKind,
  ReportResult,
  RevenueReport,
  TeacherLoadReport,
} from "./types";
import {
  getAttendanceData,
  getEnrollmentData,
  getLeadConversionData,
  getRevenueData,
  getTeacherLoadData,
} from "./queries";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function resolveRange(context: ReportContext) {
  const today = new Date();
  const defaultTo = today.toISOString().slice(0, 10);
  const defaultFromDate = new Date(today.getTime());
  defaultFromDate.setUTCMonth(defaultFromDate.getUTCMonth() - 3);
  const defaultFrom = defaultFromDate.toISOString().slice(0, 10);

  const from =
    (context.range?.from && context.range.from.trim().length > 0
      ? context.range.from
      : (context.params?.from as string | undefined)) ?? defaultFrom;
  const to =
    (context.range?.to && context.range.to.trim().length > 0
      ? context.range.to
      : (context.params?.to as string | undefined)) ?? defaultTo;
  return { from, to };
}

function baseShell<TKind extends ReportKind>(
  kind: TKind,
  name: string,
  context: ReportContext,
): {
  reportId: TKind;
  reportKind: TKind;
  name: string;
  generatedAt: string;
  range: ReportResult["range"];
  tenantId: string;
} {
  return {
    reportId: kind,
    reportKind: kind,
    name,
    generatedAt: new Date().toISOString(),
    range: resolveRange(context),
    tenantId: context.tenantId,
  };
}

const rangeParameters = [
  {
    key: "from",
    label: "From",
    type: "date" as const,
    required: false,
    description: "Start of reporting window.",
  },
  {
    key: "to",
    label: "To",
    type: "date" as const,
    required: false,
    description: "End of reporting window (inclusive).",
  },
];

// ---------------------------------------------------------------------------
// Enrollment
// ---------------------------------------------------------------------------

const enrollmentColumns: ReportColumn[] = [
  { key: "month", label: "Month", align: "left", format: "text" },
  {
    key: "newStudents",
    label: "New students",
    align: "right",
    format: "number",
  },
];

const enrollment: ReportDefinition = {
  id: "enrollment",
  name: "Enrollment Report",
  description:
    "New, active, and inactive students over time, broken down by instrument and location.",
  parameters: rangeParameters,
  async run(context): Promise<EnrollmentReport> {
    const range = resolveRange(context);
    const data = await getEnrollmentData(context.tenantId, range);
    const shell = baseShell("enrollment", "Enrollment Report", {
      ...context,
      range,
    });
    return {
      ...shell,
      summary: [
        {
          key: "total",
          label: "Total students",
          value: data.totalStudents,
          format: "number",
        },
        {
          key: "active",
          label: "Active",
          value: data.activeStudents,
          format: "number",
          sublabel: `${data.inactiveStudents} inactive`,
        },
        {
          key: "newInRange",
          label: "New in range",
          value: data.newStudents,
          format: "number",
        },
        {
          key: "families",
          label: "Families",
          value: data.families,
          format: "number",
        },
      ],
      columns: enrollmentColumns,
      rows: data.byMonth.map((m) => ({
        month: m.month,
        newStudents: m.newStudents,
      })),
      chart: {
        type: "bar",
        title: "New students by month",
        xLabel: "Month",
        yLabel: "Students",
        series: [
          {
            id: "newStudents",
            label: "New students",
            data: data.byMonth.map((m) => ({ x: m.month, y: m.newStudents })),
          },
        ],
      },
      meta: {
        byInstrument: data.byInstrument,
        byLocation: data.byLocation,
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Revenue
// ---------------------------------------------------------------------------

const revenueColumns: ReportColumn[] = [
  { key: "month", label: "Month", align: "left" },
  { key: "grossCents", label: "Gross", align: "right", format: "currency" },
  { key: "netCents", label: "Net", align: "right", format: "currency" },
  { key: "invoiceCount", label: "Invoices", align: "right", format: "number" },
];

const revenue: ReportDefinition = {
  id: "revenue",
  name: "Revenue Report",
  description:
    "Gross / net revenue, outstanding balances, and month-over-month trends.",
  parameters: rangeParameters,
  async run(context): Promise<RevenueReport> {
    const range = resolveRange(context);
    const data = await getRevenueData(context.tenantId, range);
    const shell = baseShell("revenue", "Revenue Report", { ...context, range });
    return {
      ...shell,
      summary: [
        {
          key: "gross",
          label: "Gross revenue",
          value: data.grossRevenueCents,
          format: "currency",
        },
        {
          key: "net",
          label: "Net revenue",
          value: data.netRevenueCents,
          format: "currency",
        },
        {
          key: "outstanding",
          label: "Outstanding",
          value: data.outstandingCents,
          format: "currency",
          sublabel: `${data.overdueCount} overdue`,
        },
        {
          key: "overdue",
          label: "Overdue",
          value: data.overdueCents,
          format: "currency",
        },
      ],
      columns: revenueColumns,
      rows: data.byMonth.map((m) => ({
        month: m.month,
        grossCents: m.grossCents,
        netCents: m.netCents,
        invoiceCount: m.invoiceCount,
      })),
      chart: {
        type: "line",
        title: "Net revenue by month",
        xLabel: "Month",
        yLabel: "Net (¢)",
        series: [
          {
            id: "net",
            label: "Net",
            data: data.byMonth.map((m) => ({ x: m.month, y: m.netCents })),
          },
          {
            id: "gross",
            label: "Gross",
            data: data.byMonth.map((m) => ({ x: m.month, y: m.grossCents })),
          },
        ],
      },
      meta: {
        invoiceCount: data.invoiceCount,
        paidCount: data.paidCount,
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

const attendanceColumns: ReportColumn[] = [
  { key: "dayOfWeekLabel", label: "Day of week", align: "left" },
  { key: "count", label: "Scheduled", align: "right", format: "number" },
  { key: "checkedIn", label: "Checked in", align: "right", format: "number" },
  {
    key: "attendancePct",
    label: "Attendance",
    align: "right",
    format: "percent",
  },
];

const attendance: ReportDefinition = {
  id: "attendance",
  name: "Attendance Report",
  description:
    "Schedule block check-in rates, callouts, and make-ups across the week.",
  parameters: rangeParameters,
  async run(context): Promise<AttendanceReport> {
    const range = resolveRange(context);
    const data = await getAttendanceData(context.tenantId, range);
    const shell = baseShell("attendance", "Attendance Report", {
      ...context,
      range,
    });
    return {
      ...shell,
      summary: [
        {
          key: "total",
          label: "Total blocks",
          value: data.totalBlocks,
          format: "number",
        },
        {
          key: "checkedIn",
          label: "Checked in",
          value: data.checkedInBlocks,
          format: "number",
        },
        {
          key: "attendanceRate",
          label: "Attendance rate",
          value: data.attendanceRatePct,
          format: "percent",
        },
        {
          key: "callouts",
          label: "Callouts",
          value: data.calloutBlocks,
          format: "number",
          sublabel: `${data.makeupBlocks} makeups`,
        },
      ],
      columns: attendanceColumns,
      rows: data.byDayOfWeek.map((d) => ({
        dayOfWeekLabel: DAYS_OF_WEEK[d.dayOfWeek] ?? `DOW ${d.dayOfWeek}`,
        count: d.count,
        checkedIn: d.checkedIn,
        attendancePct:
          d.count > 0 ? Math.round((d.checkedIn / d.count) * 100) : 0,
      })),
      chart: {
        type: "bar",
        title: "Attendance by day of week",
        xLabel: "Day",
        yLabel: "Blocks",
        series: [
          {
            id: "scheduled",
            label: "Scheduled",
            data: data.byDayOfWeek.map((d) => ({
              x: DAYS_OF_WEEK[d.dayOfWeek] ?? `DOW ${d.dayOfWeek}`,
              y: d.count,
            })),
          },
          {
            id: "checkedIn",
            label: "Checked in",
            data: data.byDayOfWeek.map((d) => ({
              x: DAYS_OF_WEEK[d.dayOfWeek] ?? `DOW ${d.dayOfWeek}`,
              y: d.checkedIn,
            })),
          },
        ],
      },
      meta: {
        byWeek: data.byWeek,
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Teacher Load
// ---------------------------------------------------------------------------

const teacherLoadColumns: ReportColumn[] = [
  { key: "teacherId", label: "Teacher", align: "left" },
  {
    key: "weeklyLessons",
    label: "Weekly lessons",
    align: "right",
    format: "number",
  },
  {
    key: "weeklyHours",
    label: "Weekly hours",
    align: "right",
    format: "number",
  },
  {
    key: "activeStudents",
    label: "Active students",
    align: "right",
    format: "number",
  },
  {
    key: "utilizationPct",
    label: "Utilization",
    align: "right",
    format: "percent",
  },
];

const teacherLoad: ReportDefinition = {
  id: "teacherLoad",
  name: "Teacher Load Report",
  description:
    "Weekly lesson count, hours, student load, and utilization per teacher.",
  parameters: rangeParameters,
  async run(context): Promise<TeacherLoadReport> {
    const range = resolveRange(context);
    const data = await getTeacherLoadData(context.tenantId, range);
    const shell = baseShell("teacherLoad", "Teacher Load Report", {
      ...context,
      range,
    });
    return {
      ...shell,
      summary: [
        {
          key: "teachers",
          label: "Teachers",
          value: data.teachers.length,
          format: "number",
        },
        {
          key: "totalLessons",
          label: "Weekly lessons",
          value: data.totalLessons,
          format: "number",
        },
        {
          key: "totalHours",
          label: "Weekly hours",
          value: Math.round(data.totalMinutes / 60),
          format: "number",
        },
        {
          key: "avgUtilization",
          label: "Avg utilization",
          value: data.averageUtilizationPct,
          format: "percent",
        },
      ],
      columns: teacherLoadColumns,
      rows: data.teachers.map((t) => ({
        teacherId: t.teacherId,
        weeklyLessons: t.weeklyLessons,
        weeklyHours: Math.round((t.weeklyMinutes / 60) * 10) / 10,
        activeStudents: t.activeStudents,
        utilizationPct: t.utilizationPct,
      })),
      chart: {
        type: "bar",
        title: "Weekly hours per teacher",
        xLabel: "Teacher",
        yLabel: "Hours",
        series: [
          {
            id: "hours",
            label: "Hours",
            data: data.teachers.map((t) => ({
              x: t.teacherId,
              y: Math.round((t.weeklyMinutes / 60) * 10) / 10,
            })),
          },
        ],
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Lead Conversion
// ---------------------------------------------------------------------------

const leadConversionColumns: ReportColumn[] = [
  { key: "source", label: "Source", align: "left" },
  { key: "count", label: "Leads", align: "right", format: "number" },
  { key: "converted", label: "Converted", align: "right", format: "number" },
  {
    key: "conversionPct",
    label: "Conv %",
    align: "right",
    format: "percent",
  },
];

const leadConversion: ReportDefinition = {
  id: "leadConversion",
  name: "Lead Conversion Report",
  description:
    "Lead volume, stage breakdown, and source-level conversion performance.",
  parameters: rangeParameters,
  async run(context): Promise<LeadConversionReport> {
    const range = resolveRange(context);
    const data = await getLeadConversionData(context.tenantId, range);
    const shell = baseShell("leadConversion", "Lead Conversion Report", {
      ...context,
      range,
    });
    return {
      ...shell,
      summary: [
        {
          key: "total",
          label: "Total leads",
          value: data.totalLeads,
          format: "number",
        },
        {
          key: "converted",
          label: "Converted",
          value: data.converted,
          format: "number",
        },
        {
          key: "open",
          label: "Open",
          value: data.open,
          format: "number",
          sublabel: `${data.lost} lost`,
        },
        {
          key: "conversionRate",
          label: "Conversion rate",
          value: data.conversionRatePct,
          format: "percent",
        },
      ],
      columns: leadConversionColumns,
      rows: data.bySource.map((s) => ({
        source: s.source,
        count: s.count,
        converted: s.converted,
        conversionPct:
          s.count > 0 ? Math.round((s.converted / s.count) * 100) : 0,
      })),
      chart: {
        type: "bar",
        title: "Leads by stage",
        xLabel: "Stage",
        yLabel: "Leads",
        series: [
          {
            id: "byStage",
            label: "Leads",
            data: data.byStage.map((s) => ({ x: s.stage, y: s.count })),
          },
        ],
      },
      meta: {
        byMonth: data.byMonth,
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const REPORT_DEFINITIONS: Record<ReportKind, ReportDefinition> = {
  enrollment,
  revenue,
  attendance,
  teacherLoad,
  leadConversion,
};

export function listReportDefinitions(): ReportDefinition[] {
  return Object.values(REPORT_DEFINITIONS);
}

export function getReportDefinitionById(
  id: string,
): ReportDefinition | null {
  const key = id as ReportKind;
  return REPORT_DEFINITIONS[key] ?? null;
}
