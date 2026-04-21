import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { listLocations } from "@/lib/director/queries";
import { can } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { DirectorSidebar, DIRECTOR_NAV } from "./components/DirectorSidebar";
import { LocationSwitcher } from "./components/LocationSwitcher";
export default async function DirectorLayout({ children, searchParams, }) {
    var _a, _b, _c, _d, _e;
    let activeSession = null;
    try {
        activeSession = await requireRole("director")();
    }
    catch (_f) {
        activeSession = null;
    }
    const tenantId = (_a = activeSession === null || activeSession === void 0 ? void 0 : activeSession.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    const resolved = (_b = (await searchParams)) !== null && _b !== void 0 ? _b : {};
    const rawLocation = resolved.locationId;
    const selectedLocationId = typeof rawLocation === "string" && rawLocation.length > 0
        ? rawLocation
        : null;
    let locations = [];
    try {
        locations = await listLocations(tenantId);
    }
    catch (_g) {
        locations = [];
    }
    const activeLocationId = (_d = selectedLocationId !== null && selectedLocationId !== void 0 ? selectedLocationId : (_c = locations[0]) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : "all";
    const activeLocation = locations.find((l) => l.id === activeLocationId);
    const locationName = (_e = activeLocation === null || activeLocation === void 0 ? void 0 : activeLocation.name) !== null && _e !== void 0 ? _e : "All Locations";
    const session = activeSession !== null && activeSession !== void 0 ? activeSession : (await getSession());
    const allowedNavIds = session
        ? DIRECTOR_NAV.filter((item) => !item.scope || can(session.role, item.scope)).map((item) => item.id)
        : DIRECTOR_NAV.map((item) => item.id);
    return (_jsxs("div", { className: "flex h-full min-h-0 flex-col pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]", children: [_jsxs("div", { className: "flex shrink-0 flex-col gap-3 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)] px-4 py-3 sm:flex-row sm:items-center sm:px-6", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx("div", { className: "h-8 w-8 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] font-bold text-sm", children: "D" }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Director Dashboard" }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)] truncate", children: "Multi-location operations" })] })] }), _jsx("div", { className: "sm:ml-auto flex items-center gap-3", children: _jsx(LocationSwitcher, { locations: locations, activeLocationId: activeLocationId }) })] }), _jsxs("div", { className: "flex-1 min-h-0 flex flex-col md:flex-row", children: [_jsx(DirectorSidebar, { locationName: locationName, allowedNavIds: allowedNavIds }), _jsx("section", { className: "min-h-0 min-w-0 flex-1 overflow-auto", children: _jsx("div", { className: "mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6", children: children }) })] })] }));
}
