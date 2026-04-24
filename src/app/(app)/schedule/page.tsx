import { resolveScheduleContext } from "./guard";
import { EmptyState } from "@/components/system/SurfaceStates";
import { weekWindowFromToday } from "@/lib/schedule/window";
import { loadWindowedScheduleData } from "@/lib/schedule/windowedData";
import { MultiLocationScheduleClient } from "./components/MultiLocationScheduleClient";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const dynamic = "force-dynamic";

const GHOST_LOCATION_ID = "3a7a997c-7c93-44ef-aec5-a6d706967e5b";

export default async function ScheduleDashboardPage() {
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

  // Log current session for debugging
  console.log(
    "CURRENT DEV SESSION ROLE:",
    (ctx.session as Record<string, unknown>).role ?? "unknown",
    (ctx.session as Record<string, unknown>).email ?? ctx.session.userId,
  );

  // Direct query — all active locations, ghost excluded, no profile_locations filter
  const supabase = getServiceClient();
  const tenantId = ctx.tenantId || DEFAULT_TENANT_ID;
  const { data: rawLocations } = await supabase
    .from("locations")
    .select("id,name")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .neq("id", GHOST_LOCATION_ID)
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

  // Load all locations in parallel
  const locationDataEntries = await Promise.all(
    locations.map(async (loc) => {
      const data = await loadWindowedScheduleData({
        tenantId,
        locationId: loc.id,
        start: window.start,
        end: window.end,
        includeRooms: true,
        includeStudents: true,
      }).catch(() => ({
        teachers: [],
        students: [],
        families: [],
        availability: [],
        blocks: [],
        rooms: [],
        locationHours: {},
      }));
      return [loc.id, data] as const;
    }),
  );

  const locationDataMap = Object.fromEntries(locationDataEntries);

  return (
    <MultiLocationScheduleClient
      locations={locations}
      locationDataMap={locationDataMap}
      initialWindow={window}
    />
  );
}
