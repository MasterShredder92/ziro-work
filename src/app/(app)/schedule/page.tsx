import { resolveScheduleContext } from "./guard";
import { EmptyState } from "@/components/system/SurfaceStates";
import { clampWindowLength, twoWeekWindowFromToday } from "@/lib/schedule/window";
import { loadWindowedScheduleData } from "@/lib/schedule/windowedData";
import { WindowedScheduleClient } from "./components/WindowedScheduleClient";
import { resolveUserLocationAccess } from "@/lib/auth/locationAccess";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ScheduleDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
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

  const resolved = (await searchParams) ?? {};
  const startParam = typeof resolved.start === "string" ? resolved.start : undefined;
  const endParam = typeof resolved.end === "string" ? resolved.end : undefined;
  const locationParam =
    typeof resolved.locationId === "string" ? resolved.locationId.trim() : "";
  const defaultWindow = twoWeekWindowFromToday();
  const requestedWindow =
    startParam && endParam
      ? { start: startParam, end: endParam }
      : defaultWindow;
  const window = clampWindowLength(requestedWindow, 14)
    ? requestedWindow
    : defaultWindow;

  const access = await resolveUserLocationAccess({
    session: ctx.session,
    preferredLocationId: locationParam || null,
    autoRepairProfileLocation: true,
  }).catch(() => ({
    tenantId: ctx.tenantId,
    profileId: ctx.session.profileId || ctx.session.userId,
    locations: [],
    selectedLocationId: null,
  }));
  const activeLocationId = access.selectedLocationId;
  const activeLocation = access.locations.find((l) => l.id === activeLocationId) ?? null;

  if (!activeLocationId) {
    return (
      <EmptyState
        title="No locations configured"
        description="Create at least one active location to use the schedule."
      />
    );
  }

  const data = await loadWindowedScheduleData({
    tenantId: ctx.tenantId,
    locationId: activeLocationId,
    start: window.start,
    end: window.end,
    includeRooms: true,
  });

  return (
    <WindowedScheduleClient
      locationId={activeLocationId}
      locationLabel={activeLocation?.name ?? "Location"}
      locations={access.locations}
      initialWindow={window}
      initialBlocks={data.blocks}
      teachers={data.teachers}
      students={data.students}
      families={data.families}
      availability={data.availability}
      rooms={data.rooms}
    />
  );
}
