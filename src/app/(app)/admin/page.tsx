import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getAdminDashboard } from "@/lib/admin/service";
import { KpiCard } from "./components/KpiCard";
import { DataTable } from "./components/DataTable";
import type { DataTableColumn } from "./components/DataTable";
import { InvoiceAgingChart } from "./components/InvoiceAgingChart";
import { ScheduleHeatmap } from "./components/ScheduleHeatmap";
import { TeacherLoadChart } from "./components/TeacherLoadChart";
import type {
  Lead,
  Student,
  ScheduleBlock,
  SquareInvoice,
} from "@/lib/types/entities";
import type { Teacher } from "@data/teachers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AdminPageSearchParams {
  tenantId?: string;
}

function money(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function number(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function asString(v: unknown, fallback = "—"): string {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "string") return v.length > 0 ? v : fallback;
  return String(v);
}

async function resolveTenantId(
  searchParams: AdminPageSearchParams,
): Promise<string> {
  if (searchParams.tenantId && searchParams.tenantId.trim().length > 0) {
    return searchParams.tenantId.trim();
  }
  const h = await headers();
  const fromHeader = h.get("x-tenant-id");
  if (fromHeader && fromHeader.trim().length > 0) return fromHeader.trim();
  return DEFAULT_TENANT_ID;
}

const leadColumns: DataTableColumn<Lead>[] = [
  {
    id: "name",
    header: "Name",
    accessor: (l) => {
      const first = asString(l.first_name, "");
      const last = asString(l.last_name, "");
      const composed = `${first} ${last}`.trim();
      return composed.length > 0 ? composed : asString(l.student_name);
    },
  },
  {
    id: "stage",
    header: "Stage",
    accessor: (l) => (
      <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-xs capitalize text-[var(--z-muted)]">
        {asString(l.stage, "inquiry")}
      </span>
    ),
  },
  {
    id: "instrument",
    header: "Instrument",
    accessor: (l) => asString(l.instrument),
  },
  {
    id: "source",
    header: "Source",
    accessor: (l) => asString(l.source),
  },
  {
    id: "created",
    header: "Created",
    accessor: (l) => formatDate(l.created_at),
    align: "right",
  },
];

const studentColumns: DataTableColumn<Student>[] = [
  {
    id: "name",
    header: "Student",
    accessor: (s) =>
      `${asString(s.first_name, "")} ${asString(s.last_name, "")}`.trim() ||
      "—",
  },
  {
    id: "instrument",
    header: "Instrument",
    accessor: (s) => asString(s.instrument),
  },
  {
    id: "status",
    header: "Status",
    accessor: (s) => (
      <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-xs capitalize text-[var(--z-muted)]">
        {asString(s.status, "unknown")}
      </span>
    ),
  },
  {
    id: "enrollment",
    header: "Enrollment",
    accessor: (s) => asString(s.enrollment_type),
  },
  {
    id: "started",
    header: "First lesson",
    accessor: (s) => formatDate(s.first_lesson_date ?? s.created_at),
    align: "right",
  },
];

const teacherColumns: DataTableColumn<Teacher>[] = [
  {
    id: "name",
    header: "Teacher",
    accessor: (t) => {
      const full = asString(t["full_name"], "");
      if (full !== "—") return full;
      const first = asString(t["first_name"], "");
      const last = asString(t["last_name"], "");
      const composed = `${first} ${last}`.trim();
      return composed.length > 0 ? composed : asString(t["email"]);
    },
  },
  {
    id: "email",
    header: "Email",
    accessor: (t) => asString(t["email"]),
  },
  {
    id: "instruments",
    header: "Instruments",
    accessor: (t) => {
      const raw = t["instruments"];
      if (Array.isArray(raw)) return raw.join(", ") || "—";
      return asString(raw);
    },
  },
  {
    id: "status",
    header: "Status",
    accessor: (t) => asString(t["status"] ?? t["active"]),
  },
];

function latestInvoices(invoices: SquareInvoice[]): SquareInvoice[] {
  return invoices.slice(0, 10);
}

function upcomingBlocks(schedule: ScheduleBlock[]): ScheduleBlock[] {
  const today = new Date().toISOString().slice(0, 10);
  return schedule
    .filter((b) => b.block_date && b.block_date >= today)
    .slice(0, 8);
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<AdminPageSearchParams>;
}) {
  const params = await searchParams;
  const tenantId = await resolveTenantId(params);
  const data = await getAdminDashboard(tenantId);
  const { kpis, leads, students, teachers, invoices, schedule, aging, heatmap, teacherLoad } =
    data;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--z-fg)]">
          Admin dashboard
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          Real-time overview of leads, students, teachers, schedule, and
          billing.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Active students"
          value={number(kpis.activeStudents)}
          sublabel={`${number(kpis.totalStudents)} total enrolled`}
          accent="success"
        />
        <KpiCard
          label="Active leads"
          value={number(kpis.activeLeads)}
          sublabel={`${number(kpis.convertedLeadsThisMonth)} converted this month`}
        />
        <KpiCard
          label="Teachers"
          value={number(kpis.totalTeachers)}
          sublabel="Across all locations"
        />
        <KpiCard
          label="Lessons this week"
          value={number(kpis.scheduledLessonsThisWeek)}
          sublabel="Scheduled, non-cancelled"
        />
        <KpiCard
          label="Outstanding AR"
          value={money(kpis.outstandingInvoiceAmountCents)}
          sublabel={`${number(kpis.overdueInvoiceCount)} overdue invoices`}
          accent={kpis.overdueInvoiceCount > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InvoiceAgingChart buckets={aging} />
        <ScheduleHeatmap cells={heatmap} />
      </div>

      <TeacherLoadChart entries={teacherLoad} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DataTable
          caption={`Leads (${number(leads.length)})`}
          columns={leadColumns}
          rows={leads}
          getRowKey={(l) => l.id}
          maxRows={10}
          emptyLabel="No leads yet."
        />
        <DataTable
          caption={`Students (${number(students.length)})`}
          columns={studentColumns}
          rows={students}
          getRowKey={(s) => s.id}
          maxRows={10}
          emptyLabel="No students yet."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DataTable
          caption={`Teachers (${number(teachers.length)})`}
          columns={teacherColumns}
          rows={teachers}
          getRowKey={(t) => t.id}
          maxRows={10}
          emptyLabel="No teachers yet."
        />
        <DataTable
          caption={`Recent invoices (${number(invoices.length)} total)`}
          columns={[
            {
              id: "number",
              header: "Invoice",
              accessor: (inv) =>
                asString(inv.invoice_number ?? inv.square_invoice_id),
            },
            {
              id: "customer",
              header: "Customer",
              accessor: (inv) => asString(inv.customer_name),
            },
            {
              id: "status",
              header: "Status",
              accessor: (inv) => (
                <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-xs capitalize text-[var(--z-muted)]">
                  {asString(inv.status).toLowerCase()}
                </span>
              ),
            },
            {
              id: "amount",
              header: "Amount",
              accessor: (inv) => money(inv.amount_cents ?? 0),
              align: "right",
            },
            {
              id: "due",
              header: "Due",
              accessor: (inv) => formatDate(inv.due_date),
              align: "right",
            },
          ]}
          rows={latestInvoices(invoices)}
          getRowKey={(inv) => inv.id ?? inv.square_invoice_id}
          emptyLabel="No invoices yet."
        />
      </div>

      <DataTable
        caption="Upcoming schedule"
        columns={[
          {
            id: "date",
            header: "Date",
            accessor: (b) => formatDate(b.block_date),
          },
          {
            id: "time",
            header: "Time",
            accessor: (b) =>
              `${b.start_time?.slice(0, 5) ?? "--:--"} – ${
                b.end_time?.slice(0, 5) ?? "--:--"
              }`,
          },
          {
            id: "type",
            header: "Type",
            accessor: (b) => asString(b.block_type),
          },
          {
            id: "status",
            header: "Status",
            accessor: (b) => asString(b.status),
          },
          {
            id: "teacher",
            header: "Teacher",
            accessor: (b) => asString(b.teacher_id),
          },
          {
            id: "room",
            header: "Room",
            accessor: (b) => asString(b.room_id),
          },
        ]}
        rows={upcomingBlocks(schedule)}
        getRowKey={(b) => b.id}
        emptyLabel="No upcoming schedule."
      />

      <div className="text-right text-xs text-[var(--z-muted)]">
        Tenant: {tenantId} · Generated {new Date(kpis.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
