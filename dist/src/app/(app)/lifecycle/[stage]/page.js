import { jsx as _jsx } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import { isLifecycleStageId } from "@/lib/lifecycle/helpers";
import { StageSurfaceClient } from "./_client";
import { resolveLifecycleTenantScope } from "../_serverTenant";
export default async function LifecycleDynamicStagePage({ params, searchParams, }) {
    var _a, _b;
    const { stage } = await params;
    const resolvedSearch = (_a = (await searchParams)) !== null && _a !== void 0 ? _a : {};
    const locationId = ((_b = resolvedSearch.locationId) === null || _b === void 0 ? void 0 : _b.trim()) || "";
    if (!isLifecycleStageId(stage))
        notFound();
    const scope = await resolveLifecycleTenantScope(locationId || null);
    return (_jsx("div", { className: "h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]", children: _jsx(StageSurfaceClient, { stageId: stage, tenantId: scope.tenantId, locationId: scope.locationId }) }));
}
