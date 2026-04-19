import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getLeadDashboard } from "@/lib/leads/service";
import type { LeadFilters } from "@/lib/leads/types";
import { LeadTable, LeadSourceChart } from "./components";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function parseFilters(params: SearchParams): LeadFilters {
  const filters: LeadFilters = {};
  if (typeof params.stage === "string") filters.stage = params.stage;
  if (typeof params.source === "string") filters.source = params.source;
  if (typeof params.assignedTo === "string")
    filters.assignedTo = params.assignedTo;
  if (typeof params.locationId === "string")
    filters.locationId = params.locationId;
  if (typeof params.q === "string") filters.search = params.q;
  return filters;
}

function Kpi({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: "success" | "warning" | "danger" | "default";
}) {
  const tone =
    accent === "success"
      ? "border-emerald-500/30"
      : accent === "warning"
        ? "border-amber-500/30"
        : accent === "danger"
          ? "border-red-500/30"
          : "border-[var(--z-border)]";
  return (
    <div
      className={`rounded-[var(--z-radius-lg)] border ${tone} bg-[var(--z-surface)] p-4`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-[var(--z-fg)]">
        {value}
      </div>
      {sublabel ? (
        <div className="mt-1 text-xs text-[var(--z-muted)]">{sublabel}</div>
      ) : null}
    </div>
  );
}

export default async function LeadsDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  let session;
  try {
    session = await requirePermission("leads.read")();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You need the leads.read permission to view this page.
        </div>
      </div>
    );
  }

  const tenantId = session.tenantId ?? DEFAULT_TENANT_ID;
  await assertTenantAccess(tenantId);

  const resolved = (await searchParams) ?? {};
  const filters = parseFilters(resolved);
  const data = await getLeadDashboard(tenantId, filters);

  await logAudit("leads.dashboard.view", {
    tenantId,
    profileId: session.userId,
    filters,
    generatedAt: data.generatedAt,
    source: "page",
  });

  return (
    <div className="space-y-6">
      <section id="overview" className="space-y-4 scroll-mt-24">
        <header className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Overview
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
              Lead dashboard
            </h1>
            <div className="text-xs text-[var(--z-muted)]">
              Updated {new Date(data.generatedAt).toLocaleTimeString()}
            </div>
          </div>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Kpi label="Total" value={data.totals.all} />
          <Kpi
            label="Open"
            value={data.totals.open}
            accent={data.totals.open > 10 ? "warning" : "default"}
          />
          <Kpi
            label="Converted"
            value={data.totals.converted}
            accent="success"
          />
          <Kpi label="Hot" value={data.totals.hot} accent="danger" />
          <Kpi label="Warm" value={data.totals.warm} accent="warning" />
          <Kpi label="Cold" value={data.totals.cold} />
        </div>
      </section>

      <section
        id="pipeline"
        className="grid grid-cols-1 lg:grid-cols-5 gap-4 scroll-mt-24"
      >
        <div className="lg:col-span-3 space-y-3">
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
              Showing {Math.min(data.leads.length, 200)} of{" "}
              {data.leads.length.toLocaleString()}
            </div>
          </header>
          <LeadTable leads={data.leads} />
        </div>
        <div id="sources" className="lg:col-span-2 scroll-mt-24">
          <LeadSourceChart stats={data.sourceStats} />
        </div>
      </section>

      <section
        id="qualification"
        className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 scroll-mt-24"
      >
        <header className="mb-3">
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Qualification mix
          </div>
          <h2 className="text-lg font-semibold text-[var(--z-fg)]">
            Pipeline quality
          </h2>
        </header>
        <div className="grid grid-cols-3 gap-3">
          <Kpi label="Hot" value={data.totals.hot} accent="danger" />
          <Kpi label="Warm" value={data.totals.warm} accent="warning" />
          <Kpi label="Cold" value={data.totals.cold} />
        </div>
      </section>
    </div>
  );
}
