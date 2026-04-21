import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "server-only";
import { notFound } from "next/navigation";
import { getRoomSurface } from "@/lib/locations/service";
import { resolveLocationsContext } from "../../guard";
import { RoomDetail, RoomSchedule } from "../../components";
export const dynamic = "force-dynamic";
export default async function RoomSurfacePage({ params }) {
    await resolveLocationsContext();
    const { id } = await params;
    const roomId = id === null || id === void 0 ? void 0 : id.trim();
    if (!roomId)
        notFound();
    let data;
    try {
        data = await getRoomSurface(roomId);
    }
    catch (err) {
        if (err instanceof Error && err.message === "ROOM_NOT_FOUND") {
            notFound();
        }
        throw err;
    }
    return (_jsxs("div", { className: "flex flex-col gap-6", children: [_jsx(RoomDetail, { data: data }), _jsx(RoomSchedule, { blocks: data.upcomingBlocks })] }));
}
