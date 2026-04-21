import { jsx as _jsx } from "react/jsx-runtime";
import { resolveLifecycleTenantScope } from "./_serverTenant";
import { LifecycleTabsClient } from "./_tabs-client";
export const dynamic = "force-dynamic";
export default async function LifecyclePage({ searchParams, }) {
    var _a;
    const scope = await resolveLifecycleTenantScope();
    const params = await (searchParams !== null && searchParams !== void 0 ? searchParams : Promise.resolve({}));
    const initialTab = (_a = params.tab) !== null && _a !== void 0 ? _a : "intake";
    return (_jsx(LifecycleTabsClient, { tenantId: scope.tenantId, locationId: scope.locationId, initialTab: initialTab }));
}
