import { EmptyState } from "@/components/system/SurfaceStates";
import { resolveScheduleContext } from "../schedule/guard";
import { twoWeekWindowFromToday } from "@/lib/schedule/window";
import { StudioMapClient } from "./_client";
import { resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import { getServiceClient } from "@/lib/supabase";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function StudioMapPage({
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
        description="You do not have permission to view Studio Map."
      />
    );
  }

  const resolved = (await searchParams) ?? {};
  const locationParam =
    typeof resolved.locationId === "string" ? resolved.locationId.trim() : "";

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

  if (access.locations.length === 0) {
    return (
      <EmptyState
        title="No locations configured"
        description="Create at least one active location to use Studio Map."
      />
    );
  }

  const activeLocationId = access.selectedLocationId;
  const initialWindow = twoWeekWindowFromToday();

  const supabase = getServiceClient();
  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", ctx.tenantId)
    .maybeSingle();
  const companyName = (tenantRow?.name as string | undefined)?.trim() || "Your studio";

  return (
    <StudioMapClient
      companyName={companyName}
      locations={access.locations}
      initialFocusLocationId={activeLocationId}
      initialWindow={initialWindow}
    />
  );
}
