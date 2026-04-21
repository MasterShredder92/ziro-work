import { jsx as _jsx } from "react/jsx-runtime";
import "server-only";
import { listLocations } from "@/lib/locations/queries";
import { resolveLocationsContext } from "./guard";
import { LocationsShell, LocationsSidebar } from "./components";
export const dynamic = "force-dynamic";
export default async function LocationsLayout({ children, }) {
    const { tenantId } = await resolveLocationsContext();
    const locations = await listLocations(tenantId);
    return (_jsx(LocationsShell, { sidebar: _jsx(LocationsSidebar, { locations: locations }), children: children }));
}
