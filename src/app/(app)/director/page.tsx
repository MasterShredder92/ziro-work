import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requireRole, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getDirectorLocation, listLocations } from "@/lib/director/queries";
import { getDirectorDashboard } from "@/lib/director/service";
import type {
  DirectorLeadRow,
  DirectorStudentRow,
  DirectorTeacherRow,
} from "@/lib/director/types";
import { KpiCard } from "./components/KpiCard";
import { DataTable, type DataTableColumn } from "./components/DataTable";
import { BillingSummary } from "./components/BillingSummary";
import { ScheduleHeatmap } from "./components/ScheduleHeatmap";
import { TeacherLoadChart } from "./components/TeacherLoadChart";
import { StudentMessagesInbox } from "./components/StudentMessagesInbox";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatCurrencyCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StageBadge({ stage }: { stage: string | null | undefined }) {
  const label = stage ?? "new";
  const tone =
    label === "enrolled"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : label === "lost"
        ? "bg-red-500/15 text-red-300 border-red-500/30"
        : label === "trial"
          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
          : "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const label = status ?? "—";
  const tone =
    label === "active"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : label === "inactive"
        ? "bg-red-500/15 text-red-300 border-red-500/30"
        : "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

export default async function DirectorDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  let session = null;
  try {
    session = await requireRole("director")();
  } catch {
    session = null;
  }

  const tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;

  const resolved = (await searchParams) ?? {};
  const rawLocation = resolved.locationId;
  let locationId =
    typeof rawLocation === "string" && rawLocation.length > 0
      ? rawLocation
      : null;

  if (!locationId) {
    try {
      const locations = await listLocations(tenantId);
      locationId = locations[0]?.id ?? null;
    } catch {
      locationId = null;
    }
  }

  if (!locationId) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          No locations found
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          Configure at least one active location to view the director dashboard.
        </div>
      </div>
    );
  }

  const location = await getDirectorLocation(tenantId, locationId);

  try {
    await assertTenantAccess(location.tenant_id);
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You do not have access to this location.
        </div>
      </div>
    );
  }

  const data = await getDirectorDashboard(location.id, location.tenant_id);

  await logAudit("director.dashboard.view", {
    locationId: location.id,
    tenantId: location.tenant_id,
    profileId: session?.userId ?? null,
    generatedAt: data.generatedAt,
    source: "page",
  });

  const leadColumns: Array<DataTableColumn<DirectorLeadRow>> = [
    {
      id: "name",
      header: "Lead",
      cell: (row) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-[var(--z-fg)] truncate">
            {[row.first_name, row.last_name].filter(Boolean).join(" ") ||
              row.parent_name ||
              "Unnamed"}
          </div>
          <div className="text-xs text-[var(--z-muted)] truncate">
            {row.email ?? row.phone ?? "—"}
          </div>
        </div>
      ),
    },
    {
      id: "instrument",
      header: "Instrument",
      width: "140px",
      cell: (row) => row.instrument ?? "—",
    },
    {
      id: "source",
      header: "Source",
      width: "140px",
      cell: (row) => row.source ?? row.how_heard ?? "—",
    },
    {
      id: "stage",
      header: "Stage",
      width: "120px",
      cell: (row) => <StageBadge stage={row.stage} />,
    },
    {
      id: "age",
      header: "Age",
      width: "80px",
      align: "right",
      cell: (row) => `${row.age_days}d`,
    },
    {
      id: "created",
      header: "Created",
      width: "120px",
      align: "right",
      cell: (row) => formatDate(row.created_at),
    },
  ];

  const studentColumns: Array<DataTableColumn<DirectorStudentRow>> = [
    {
      id: "name",
      header: "Student",
      cell: (row) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-[var(--z-fg)] truncate">
            {`${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "Unnamed"}
          </div>
          <div className="text-xs text-[var(--z-muted)] truncate">
            {row.email ?? "—"}
          </div>
        </div>
      ),
    },
    {
      id: "instrument",
      header: "Instrument",
      width: "140px",
      cell: (row) => row.instrument ?? "—",
    },
    {
      id: "enrollment",
      header: "Type",
      width: "120px",
      cell: (row) =>
        (row as unknown as { enrollment_type?: string | null })
          .enrollment_type ?? "—",
    },
    {
      id: "blocks",
      header: "Blocks/wk",
      width: "100px",
      align: "right",
      cell: (row) =>
        String(
          (row as unknown as { blocks_per_week?: number }).blocks_per_week ?? 0,
        ),
    },
    {
      id: "status",
      header: "Status",
      width: "110px",
      cell: (row) => <StatusBadge status={row.status ?? undefined} />,
    },
    {
      id: "created",
      header: "Enrolled",
      width: "120px",
      align: "right",
      cell: (row) => formatDate(row.created_at),
    },
  ];

  const teacherColumns: Array<DataTableColumn<DirectorTeacherRow>> = [
    {
      id: "name",
      header: "Teacher",
      cell: (row) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-[var(--z-fg)] truncate">
            {row.name}
          </div>
          <div className="text-xs text-[var(--z-muted)] truncate">
            {row.email ?? "—"}
          </div>
        </div>
      ),
    },
    {
      id: "students",
      header: "Active students",
      width: "150px",
      align: "right",
      cell: (row) => formatNumber(row.activeStudents),
    },
    {
      id: "lessons",
      header: "Weekly lessons",
      width: "150px",
      align: "right",
      cell: (row) => formatNumber(row.weeklyLessons),
    },
    {
      id: "hours",
      header: "Weekly hours",
      width: "140px",
      align: "right",
      cell: (row) =>
        `${(row.weeklyMinutes / 60).toFixed(1)}h`,
    },
    {
      id: "utilization",
      header: "Utilization",
      width: "130px",
      align: "right",
      cell: (row) => `${row.utilizationPct}%`,
    },
    {
      id: "status",
      header: "Status",
      width: "110px",
      cell: (row) => <StatusBadge status={row.status ?? undefined} />,
    },
  ];

  return (
    <div className="space-y-6">
      <section id="overview" className="space-y-4 scroll-mt-24">
        <header className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Overview
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
              {data.location.name}
            </h1>
            <div className="text-xs text-[var(--z-muted)]">
              Updated {new Date(data.generatedAt).toLocaleTimeString()}
            </div>
          </div>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard
            label="Active students"
            value={formatNumber(data.kpis.activeStudents)}
            sublabel={`${formatNumber(data.kpis.totalStudents)} total`}
            accent="success"
          />
          <KpiCard
            label="New this month"
            value={formatNumber(data.kpis.newStudentsThisMonth)}
            trend={data.kpis.newStudentsThisMonth > 0 ? "up" : "flat"}
            trendLabel={
              data.kpis.newStudentsThisMonth > 0
                ? `${data.kpis.newStudentsThisMonth} enrolled`
                : "No enrollments yet"
            }
          />
          <KpiCard
            label="Open leads"
            value={formatNumber(data.kpis.openLeads)}
            sublabel={`${formatNumber(data.kpis.totalLeads)} total`}
            accent={data.kpis.openLeads > 10 ? "warning" : "default"}
          />
          <KpiCard
            label="Conversion rate"
            value={`${data.kpis.conversionRate}%`}
            sublabel={`${formatNumber(data.kpis.convertedLeads)} converted`}
            accent={
              data.kpis.conversionRate >= 30
                ? "success"
                : data.kpis.conversionRate >= 15
                  ? "default"
                  : "warning"
            }
          />
          <KpiCard
            label="Weekly lessons"
            value={formatNumber(data.kpis.weeklyLessonCount)}
            sublabel={`${(data.kpis.weeklyLessonMinutes / 60).toFixed(1)}h total`}
          />
          <KpiCard
            label="MTD revenue"
            value={formatCurrencyCents(data.kpis.monthToDateRevenueCents)}
            sublabel={`${formatCurrencyCents(
              data.kpis.outstandingInvoiceAmountCents,
            )} outstanding`}
            accent={
              data.kpis.monthToDateRevenueCents > 0 ? "success" : "default"
            }
          />
        </div>
      </section>

      <section id="leads" className="space-y-3 scroll-mt-24">
        <header className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Pipeline
            </div>
            <h2 className="text-lg font-semibold text-[var(--z-fg)]">
              Leads
            </h2>
          </div>
          <div className="text-xs text-[var(--z-muted)]">
            Showing {Math.min(data.leads.length, 100)} of{" "}
            {formatNumber(data.leads.length)}
          </div>
        </header>
        <DataTable
          columns={leadColumns}
          rows={data.leads.slice(0, 100)}
          getRowKey={(row) => row.id}
          emptyMessage="No leads for this location."
        />
      </section>

      <section id="students" className="space-y-3 scroll-mt-24">
        <header className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Enrollment
            </div>
            <h2 className="text-lg font-semibold text-[var(--z-fg)]">
              Students
            </h2>
          </div>
          <div className="text-xs text-[var(--z-muted)]">
            {formatNumber(data.kpis.activeStudents)} active ·{" "}
            {formatNumber(data.kpis.inactiveStudents)} inactive
          </div>
        </header>
        <DataTable
          columns={studentColumns}
          rows={data.students.slice(0, 200)}
          getRowKey={(row) => row.id}
          emptyMessage="No students for this location."
        />
      </section>

      <section
        id="teachers"
        className="grid grid-cols-1 lg:grid-cols-5 gap-4 scroll-mt-24"
      >
        <div className="lg:col-span-3 space-y-3">
          <header>
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Roster
            </div>
            <h2 className="text-lg font-semibold text-[var(--z-fg)]">
              Teachers
            </h2>
          </header>
          <DataTable
            columns={teacherColumns}
            rows={data.teachers}
            getRowKey={(row) => row.id}
            emptyMessage="No teachers assigned to this location."
          />
        </div>
        <div className="lg:col-span-2">
          <TeacherLoadChart teachers={data.teachers} />
        </div>
      </section>

      <section id="schedule" className="space-y-3 scroll-mt-24">
        <ScheduleHeatmap schedule={data.schedule} />
      </section>

      <section id="billing" className="space-y-3 scroll-mt-24">
        <BillingSummary billing={data.billing} />
      </section>
      <section id="student-messages" className="space-y-3 scroll-mt-24">
        <StudentMessagesInbox />
      </section>
    </div>
  );
}
