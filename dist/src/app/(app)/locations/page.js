import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "server-only";
import { listLocations } from "@/lib/locations/queries";
import { resolveLocationsContext } from "./guard";
import { LocationList } from "./components";
export const dynamic = "force-dynamic";
export default async function LocationsIndexPage() {
    const { tenantId } = await resolveLocationsContext();
    const locations = await listLocations(tenantId);
    return (_jsxs("section", { className: "flex flex-col gap-5", children: [_jsxs("header", { className: "flex flex-col gap-1", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Rooms & Locations" }), _jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "All locations" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Select a studio to view its room dashboard, scheduling load, and utilization KPIs." })] }), _jsx(LocationList, { locations: locations })] }));
}
