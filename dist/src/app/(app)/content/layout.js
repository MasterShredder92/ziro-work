import { jsx as _jsx } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import { resolveContentContext } from "./guard";
import { ContentShell, CONTENT_NAV } from "./components";
export const dynamic = "force-dynamic";
export default async function ContentLayout({ children, }) {
    var _a;
    let tenantId = DEFAULT_TENANT_ID;
    let tenantLabel = "Workspace";
    let allowedNavIds = null;
    try {
        const ctx = await resolveContentContext();
        tenantId = ctx.tenantId;
        tenantLabel = ctx.session.tenantId ? ctx.session.tenantId : "Workspace";
        const permissions = getPermissionsForRole(ctx.session.role);
        allowedNavIds = CONTENT_NAV.filter((item) => !item.scope || permissions.includes(item.scope)).map((item) => item.id);
    }
    catch (_b) {
        const session = await getSession();
        tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    }
    void tenantId;
    return (_jsx(ContentShell, { tenantLabel: tenantLabel, allowedNavIds: allowedNavIds, children: children }));
}
