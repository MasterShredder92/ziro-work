import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { listStudents } from "@data/students";
import { listLocations } from "@data/locations";
import { getNextLessonLabelsForStudents, } from "@/lib/crm";
import { parseTableSort, STUDENT_SORT_KEYS, studentSortOrder, } from "@/lib/crm/crmListSortMaps";
import { getCRMTenantId } from "../_tenant";
import { CRMLayout, CRMNav, EmptyState } from "../_components";
import { StudentsListClient } from "./students-list-client";
export const dynamic = "force-dynamic";
export default async function StudentsIndexPage({ searchParams, }) {
    var _a, _b, _c;
    const tenantId = await getCRMTenantId();
    const params = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const parsed = parseTableSort(params.sort, params.dir, STUDENT_SORT_KEYS);
    const order = studentSortOrder(parsed.key, parsed.dir);
    const locationId = ((_b = params.location_id) === null || _b === void 0 ? void 0 : _b.trim()) || "";
    const [locations, rows] = await Promise.all([
        listLocations(tenantId, { is_active: true }, { limit: 200 }),
        listStudents(tenantId, Object.assign({ status: params.status }, (locationId ? { location_id: locationId } : {})), {
            limit: 500,
            orderBy: order.orderBy,
            ascending: order.ascending,
        }),
    ]);
    const locationNameById = Object.fromEntries(locations.map((l) => { var _a; return [l.id, (_a = l.name) !== null && _a !== void 0 ? _a : l.id]; }));
    const ids = rows.map((r) => r.id);
    const nextLessons = await getNextLessonLabelsForStudents(tenantId, ids);
    return (_jsxs(CRMLayout, { title: "Students", subtitle: "Active and prospective learners across the studio.", children: [_jsx(CRMNav, { current: "students" }), _jsxs("form", { className: "mb-4 flex flex-wrap items-center gap-2", method: "get", children: [params.sort ? (_jsx("input", { type: "hidden", name: "sort", value: params.sort })) : null, params.dir ? (_jsx("input", { type: "hidden", name: "dir", value: params.dir })) : null, _jsxs("select", { name: "status", defaultValue: (_c = params.status) !== null && _c !== void 0 ? _c : "", className: "h-9 rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] px-3 text-sm text-[var(--z-fg,#f0f0f0)]", children: [_jsx("option", { value: "", children: "All statuses" }), _jsx("option", { value: "enrolled", children: "Enrolled" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "inactive", children: "Inactive" }), _jsx("option", { value: "prospect", children: "Prospect" })] }), _jsx("button", { type: "submit", className: "h-9 rounded-md bg-[var(--z-accent,#00ff88)]/10 px-3 text-sm font-semibold text-[var(--z-accent,#00ff88)] hover:bg-[var(--z-accent,#00ff88)]/20", children: "Filter" })] }), rows.length === 0 ? (_jsx(EmptyState, { title: "No students found", body: `Tenant ${tenantId}. If Supabase has students under a different tenant_id, update this user’s profile.tenant_id (or sign in with the matching account). Clear the status filter if you chose “Enrolled” or another bucket that doesn’t match your studio’s status labels.` })) : (_jsx(StudentsListClient, { rows: rows, nextLessons: nextLessons, locationNameById: locationNameById }))] }));
}
