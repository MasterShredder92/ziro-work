import { Suspense } from "react";
import { resolveScheduleContext } from "./guard";
import { EmptyState } from "@/components/system/SurfaceStates";
import { PageShell } from "@/components/layouts/PageShell";
import { weekWindowFromToday } from "@/lib/schedule/window";
import { loadWindowedScheduleData } from "@/lib/schedule/windowedData";
import { MultiLocationScheduleClient } from "./components/MultiLocationScheduleClient";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const dynamic = "force-dynamic";


export default async function ScheduleDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string | string[] }>;
}) {
  let ctx;
  try {
    ctx = await resolveScheduleContext();
  } catch {
    return (
      <EmptyState
        title="Forbidden"
        description="You do not have permission to view the schedule."
      />
    );
  }

  // Direct query — all active locations, ghost excluded, no profile_locations filter
  const supabase = getServiceClient();
  const tenantId = ctx.tenantId || DEFAULT_TENANT_ID;
  const { data: rawLocations } = await supabase
    .from("locations")
    .select("id,name")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  const locations = (rawLocations ?? []).map((l) => ({
    id: String(l.id),
    name: String(l.name ?? l.id),
  }));

  if (locations.length === 0) {
    return (
      <EmptyState
        title="No locations configured"
        description="Create at least one active location to use the schedule."
      />
    );
  }

  const window = weekWindowFromToday();

  const sp = await searchParams;
  const rawLoc = sp.locationId;
  const urlLocId = Array.isArray(rawLoc) ? rawLoc[0] : rawLoc;
  const ssrLocationId =
    urlLocId && locations.some((l) => l.id === urlLocId) ? urlLocId : locations[0]!.id;

  let locationDataMap: Record<string, Awaited<ReturnType<typeof loadWindowedScheduleData>>>;
  try {
    const data = await loadWindowedScheduleData({
      tenantId,
      locationId: ssrLocationId,
      start: window.start,
      end: window.end,
      includeRooms: true,
      includeStudents: true,
    });
    locationDataMap = { [ssrLocationId]: data };
  } catch (e) {
    console.error("[schedule/page] loadWindowedScheduleData", e);
    return (
      <EmptyState
        title="Couldn’t load schedule"
        description="Something went wrong loading studio data. Refresh the page or try again in a moment."
      />
    );
  }

  return (
    <Suspense fallback={<PageShell />}>
      <MultiLocationScheduleClient
        locations={locations}
        locationDataMap={locationDataMap}
        initialWindow={window}
        canWriteSchedule={ctx.canWrite}
      />
    </Suspense>
  );
}
