import { jsx as _jsx } from "react/jsx-runtime";
import { resolveScheduleContext } from "./guard";
import { EmptyState } from "@/components/system/SurfaceStates";
import { weekWindowFromToday } from "@/lib/schedule/window";
import { loadWindowedScheduleData } from "@/lib/schedule/windowedData";
import { MultiLocationScheduleClient } from "./components/MultiLocationScheduleClient";
import { resolveUserLocationAccess } from "@/lib/auth/locationAccess";
export const dynamic = "force-dynamic";
export default async function ScheduleDashboardPage() {
    let ctx;
    try {
        ctx = await resolveScheduleContext();
    }
    catch (_a) {
        return (_jsx(EmptyState, { title: "Forbidden", description: "You do not have permission to view the schedule." }));
    }
    const access = await resolveUserLocationAccess({
        session: ctx.session,
        preferredLocationId: null,
        autoRepairProfileLocation: true,
    }).catch(() => ({
        tenantId: ctx.tenantId,
        profileId: ctx.session.profileId || ctx.session.userId,
        locations: [],
        selectedLocationId: null,
    }));
    const locations = access.locations;
    if (locations.length === 0) {
        return (_jsx(EmptyState, { title: "No locations configured", description: "Create at least one active location to use the schedule." }));
    }
    const window = weekWindowFromToday();
    // Load all locations in parallel
    const locationDataEntries = await Promise.all(locations.map(async (loc) => {
        const data = await loadWindowedScheduleData({
            tenantId: ctx.tenantId,
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
        return [loc.id, data];
    }));
    const locationDataMap = Object.fromEntries(locationDataEntries);
    return (_jsx(MultiLocationScheduleClient, { locations: locations, locationDataMap: locationDataMap, initialWindow: window }));
}
