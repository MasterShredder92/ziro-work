import "server-only";
import type { ReactNode } from "react";
import { listLocations } from "@/lib/locations/queries";
import { resolveLocationsContext } from "./guard";
import { LocationsShell, LocationsSidebar } from "./components";

export const dynamic = "force-dynamic";

export default async function LocationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { tenantId } = await resolveLocationsContext();
  const locations = await listLocations(tenantId);

  return (
    <LocationsShell sidebar={<LocationsSidebar locations={locations} />}>
      {children}
    </LocationsShell>
  );
}
