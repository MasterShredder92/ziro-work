import { jsx as _jsx } from "react/jsx-runtime";
import { EmptyState } from "@/components/system/SurfaceStates";
import { resolveScheduleContext } from "../schedule/guard";
import { twoWeekWindowFromToday } from "@/lib/schedule/window";
import { StudioMapClient } from "./_client";
import { resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import { getServiceClient } from "@/lib/supabase";
export default async function StudioMapPage({ searchParams, }) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    let ctx;
    try {
        ctx = await resolveScheduleContext();
    }
    catch (_j) {
        return (_jsx(EmptyState, { title: "Forbidden", description: "You do not have permission to view Studio Map." }));
    }
    const resolved = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const locationParam = typeof resolved.locationId === "string" ? resolved.locationId.trim() : "";
    const access = await resolveUserLocationAccess({
        session: ctx.session,
        preferredLocationId: locationParam || null,
        autoRepairProfileLocation: true,
    }).catch(() => ({
        tenantId: ctx.tenantId,
        profileId: ctx.session.profileId || ctx.session.userId,
        locations: [],
        selectedLocationId: null,
    }));
    if (access.locations.length === 0) {
        return (_jsx(EmptyState, { title: "No locations configured", description: "Create at least one active location to use Studio Map." }));
    }
    const activeLocationId = access.selectedLocationId;
    const initialWindow = twoWeekWindowFromToday();
    const supabase = getServiceClient();
    const [tenantResult, studentsResult, teachersResult] = await Promise.all([
        supabase.from("tenants").select("name").eq("id", ctx.tenantId).maybeSingle(),
        supabase
            .from("students")
            .select("id, rate")
            .eq("tenant_id", ctx.tenantId)
            .eq("status", "active"),
        supabase
            .from("teachers")
            .select("id")
            .eq("tenant_id", ctx.tenantId)
            .eq("status", "active"),
    ]);
    const companyName = ((_c = (_b = tenantResult.data) === null || _b === void 0 ? void 0 : _b.name) === null || _c === void 0 ? void 0 : _c.trim()) || "Your studio";
    const totalStudents = (_e = (_d = studentsResult.data) === null || _d === void 0 ? void 0 : _d.length) !== null && _e !== void 0 ? _e : 0;
    const totalTeachers = (_g = (_f = teachersResult.data) === null || _f === void 0 ? void 0 : _f.length) !== null && _g !== void 0 ? _g : 0;
    const monthlyRevenue = ((_h = studentsResult.data) !== null && _h !== void 0 ? _h : []).reduce((sum, s) => { var _a; return sum + ((_a = s.rate) !== null && _a !== void 0 ? _a : 0); }, 0);
    return (_jsx(StudioMapClient, { companyName: companyName, locations: access.locations, initialFocusLocationId: activeLocationId, initialWindow: initialWindow, totalStudents: totalStudents, totalTeachers: totalTeachers, monthlyRevenue: monthlyRevenue }));
}
