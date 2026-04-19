import type { ReactNode } from "react";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { listLocations } from "@/lib/director/queries";
import type { DirectorLocation } from "@/lib/director/types";
import { can } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { DirectorSidebar, DIRECTOR_NAV } from "./components/DirectorSidebar";
import { LocationSwitcher } from "./components/LocationSwitcher";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DirectorLayout({
  children,
  searchParams,
}: {
  children: ReactNode;
  searchParams?: Promise<SearchParams>;
}) {
  let activeSession: Awaited<ReturnType<typeof getSession>> = null;
  try {
    activeSession = await requireRole("director")();
  } catch {
    activeSession = null;
  }

  const tenantId = activeSession?.tenantId ?? DEFAULT_TENANT_ID;

  const resolved = (await searchParams) ?? {};
  const rawLocation = resolved.locationId;
  const selectedLocationId =
    typeof rawLocation === "string" && rawLocation.length > 0
      ? rawLocation
      : null;

  let locations: DirectorLocation[] = [];
  try {
    locations = await listLocations(tenantId);
  } catch {
    locations = [];
  }

  const activeLocationId =
    selectedLocationId ?? locations[0]?.id ?? "all";
  const activeLocation = locations.find((l) => l.id === activeLocationId);
  const locationName = activeLocation?.name ?? "All Locations";

  const session = activeSession ?? (await getSession());
  const allowedNavIds = session
    ? DIRECTOR_NAV.filter(
        (item) => !item.scope || can(session.role, item.scope),
      ).map((item) => item.id)
    : DIRECTOR_NAV.map((item) => item.id);

  return (
    <div className="flex h-full min-h-0 flex-col pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]">
      <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)] px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] font-bold text-sm">
            D
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Director Dashboard
            </div>
            <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
              Multi-location operations
            </div>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-3">
          <LocationSwitcher
            locations={locations}
            activeLocationId={activeLocationId}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <DirectorSidebar
          locationName={locationName}
          allowedNavIds={allowedNavIds}
        />
        <section className="min-h-0 min-w-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
