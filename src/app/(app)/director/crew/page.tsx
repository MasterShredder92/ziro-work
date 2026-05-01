import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requireRole } from "@/lib/auth/guards";
import { getCrewDashboard, getFilterPeriods } from "@/lib/agents/service";
import { CrewBoard } from "./components/CrewBoard";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CrewPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  // Check PLATFORM_SUPABASE_URL is configured
  if (!process.env.PLATFORM_SUPABASE_URL) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Agent crew not connected yet.
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          Configure PLATFORM_SUPABASE_URL to get started.
        </div>
      </div>
    );
  }

  let session = null;
  try {
    session = await requireRole("director")();
  } catch {
    session = null;
  }

  const tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;

  const resolved = (await searchParams) ?? {};
  const rawPeriod = resolved.period;
  const selectedPeriod =
    typeof rawPeriod === "string" && rawPeriod.length > 0
      ? rawPeriod
      : "this_month";

  const periods = getFilterPeriods();
  const period = periods.find((p) => p.value === selectedPeriod) ?? periods[0];

  const data = await getCrewDashboard(
    tenantId,
    period.startDate,
    period.endDate,
  );

  return (
    <CrewBoard
      data={data}
      periods={periods}
      selectedPeriod={selectedPeriod}
    />
  );
}
