import "server-only";
import { notFound } from "next/navigation";
import { getRoomSurface } from "@/lib/locations/service";
import { resolveLocationsContext } from "../../guard";
import { RoomDetail, RoomSchedule } from "../../components";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function RoomSurfacePage({ params }: Params) {
  await resolveLocationsContext();
  const { id } = await params;
  const roomId = id?.trim();
  if (!roomId) notFound();

  let data;
  try {
    data = await getRoomSurface(roomId);
  } catch (err) {
    if (err instanceof Error && err.message === "ROOM_NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <RoomDetail data={data} />
      <RoomSchedule blocks={data.upcomingBlocks} />
    </div>
  );
}
