import "server-only";
import { notFound } from "next/navigation";
import { getLocationDashboard } from "@/lib/locations/service";
import { resolveLocationsContext } from "../guard";
import {
  LocationDetail,
  LocationSchedule,
  RoomList,
} from "../components";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function LocationDashboardPage({ params }: Params) {
  await resolveLocationsContext();
  const { id } = await params;
  const locationId = id?.trim();
  if (!locationId) notFound();

  let data;
  try {
    data = await getLocationDashboard(locationId);
  } catch (err) {
    if (err instanceof Error && err.message === "LOCATION_NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <LocationDetail data={data} />
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Rooms
        </h2>
        <RoomList
          rooms={data.rooms}
          summaries={data.scheduleSummary.roomSummaries}
        />
      </section>
      <LocationSchedule blocks={data.upcomingBlocks} />
    </div>
  );
}
