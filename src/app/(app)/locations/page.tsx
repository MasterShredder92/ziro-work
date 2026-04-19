import "server-only";
import { listLocations } from "@/lib/locations/queries";
import { resolveLocationsContext } from "./guard";
import { LocationList } from "./components";

export const dynamic = "force-dynamic";

export default async function LocationsIndexPage() {
  const { tenantId } = await resolveLocationsContext();
  const locations = await listLocations(tenantId);

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Rooms &amp; Locations
        </p>
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
          All locations
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          Select a studio to view its room dashboard, scheduling load, and
          utilization KPIs.
        </p>
      </header>
      <LocationList locations={locations} />
    </section>
  );
}
