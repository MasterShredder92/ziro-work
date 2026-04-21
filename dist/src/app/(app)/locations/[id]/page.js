import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "server-only";
import { notFound } from "next/navigation";
import { getLocationDashboard } from "@/lib/locations/service";
import { resolveLocationsContext } from "../guard";
import { LocationDetail, LocationSchedule, RoomList, } from "../components";
export const dynamic = "force-dynamic";
export default async function LocationDashboardPage({ params }) {
    await resolveLocationsContext();
    const { id } = await params;
    const locationId = id === null || id === void 0 ? void 0 : id.trim();
    if (!locationId)
        notFound();
    let data;
    try {
        data = await getLocationDashboard(locationId);
    }
    catch (err) {
        if (err instanceof Error && err.message === "LOCATION_NOT_FOUND") {
            notFound();
        }
        throw err;
    }
    return (_jsxs("div", { className: "flex flex-col gap-6", children: [_jsx(LocationDetail, { data: data }), _jsxs("section", { className: "flex flex-col gap-3", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Rooms" }), _jsx(RoomList, { rooms: data.rooms, summaries: data.scheduleSummary.roomSummaries })] }), _jsx(LocationSchedule, { blocks: data.upcomingBlocks })] }));
}
