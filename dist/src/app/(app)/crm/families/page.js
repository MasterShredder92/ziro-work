import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { countStudentsByFamilyIds, listFamilies } from "@data/families";
import { listStudents } from "@data/students";
import { listLocations } from "@data/locations";
import { parseTableSort, FAMILY_SORT_KEYS, familySortOrder, } from "@/lib/crm/crmListSortMaps";
import { getCRMTenantId } from "../_tenant";
import { CRMLayout, CRMNav, EmptyState } from "../_components";
import { FamiliesListClient } from "./families-list-client";
export const dynamic = "force-dynamic";
export default async function FamiliesIndexPage({ searchParams, }) {
    var _a, _b, _c, _d;
    const tenantId = await getCRMTenantId();
    const params = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const parsed = parseTableSort(params.sort, params.dir, FAMILY_SORT_KEYS);
    const order = familySortOrder(parsed.key, parsed.dir);
    const locationId = ((_b = params.location_id) === null || _b === void 0 ? void 0 : _b.trim()) || "";
    const scope = ((_c = params.family_location_scope) !== null && _c !== void 0 ? _c : "primary").trim();
    const [locations, rows] = await Promise.all([
        listLocations(tenantId, { is_active: true }, { limit: 200 }),
        (async () => {
            if (!locationId) {
                return (await listFamilies(tenantId, { search: params.search }, {
                    limit: 500,
                    orderBy: order.orderBy,
                    ascending: order.ascending,
                }));
            }
            if (scope === "students") {
                const studs = await listStudents(tenantId, { location_id: locationId }, { limit: 5000, orderBy: "created_at", ascending: false });
                const familyIds = [
                    ...new Set(studs.map((s) => s.family_id).filter((id) => Boolean(id))),
                ];
                if (familyIds.length === 0)
                    return [];
                return (await listFamilies(tenantId, { search: params.search, family_ids: familyIds }, {
                    limit: 500,
                    orderBy: order.orderBy,
                    ascending: order.ascending,
                }));
            }
            return (await listFamilies(tenantId, { search: params.search, primary_location_id: locationId }, {
                limit: 500,
                orderBy: order.orderBy,
                ascending: order.ascending,
            }));
        })(),
    ]);
    const locationNameById = Object.fromEntries(locations.map((l) => { var _a; return [l.id, (_a = l.name) !== null && _a !== void 0 ? _a : l.id]; }));
    const counts = await countStudentsByFamilyIds(tenantId, rows.map((r) => r.id));
    return (_jsxs(CRMLayout, { title: "Families", subtitle: "Household accounts and billing units.", children: [_jsx(CRMNav, { current: "families" }), _jsxs("form", { className: "mb-4 flex flex-wrap items-end gap-2", method: "get", children: [params.sort ? (_jsx("input", { type: "hidden", name: "sort", value: params.sort })) : null, params.dir ? (_jsx("input", { type: "hidden", name: "dir", value: params.dir })) : null, _jsxs("label", { className: "flex flex-col gap-1 text-xs text-[var(--z-muted,#909098)]", children: ["Studio", _jsxs("select", { name: "location_id", defaultValue: locationId, className: "h-9 min-w-[10rem] rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] px-2 text-sm text-[var(--z-fg,#f0f0f0)]", children: [_jsx("option", { value: "", children: "All studios" }), locations.map((l) => {
                                        var _a;
                                        return (_jsx("option", { value: l.id, children: (_a = l.name) !== null && _a !== void 0 ? _a : l.id }, l.id));
                                    })] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs text-[var(--z-muted,#909098)]", children: ["Match families by", _jsxs("select", { name: "family_location_scope", defaultValue: scope, className: "h-9 min-w-[12rem] rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] px-2 text-sm text-[var(--z-fg,#f0f0f0)]", children: [_jsx("option", { value: "primary", children: "Home studio (family record)" }), _jsx("option", { value: "students", children: "Any student at this studio" })] })] }), _jsx("input", { type: "search", name: "search", defaultValue: (_d = params.search) !== null && _d !== void 0 ? _d : "", placeholder: "Search families\u2026", className: "h-9 w-64 rounded-md border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] px-3 text-sm text-[var(--z-fg,#f0f0f0)] placeholder:text-[var(--z-muted-2,#606068)]" }), _jsx("button", { type: "submit", className: "h-9 rounded-md bg-[var(--z-accent,#00ff88)]/10 px-3 text-sm font-semibold text-[var(--z-accent,#00ff88)] hover:bg-[var(--z-accent,#00ff88)]/20", children: "Apply" })] }), rows.length === 0 ? (_jsx(EmptyState, { title: "No families found", body: `Tenant ${tenantId}. If families exist in Supabase under another tenant_id, update profile.tenant_id for this login to match your Lessonpreneur tenant.` })) : (_jsx(FamiliesListClient, { rows: rows, counts: counts, locationNameById: locationNameById }))] }));
}
