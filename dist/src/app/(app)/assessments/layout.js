import { jsx as _jsx } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import { resolveAssessmentsContext } from "./guard";
import { AssessmentsShell } from "./components";
export const dynamic = "force-dynamic";
export default async function AssessmentsLayout({ children, }) {
    var _a;
    let tenantId = DEFAULT_TENANT_ID;
    let tenantLabel = "Workspace";
    try {
        const ctx = await resolveAssessmentsContext();
        tenantId = ctx.tenantId;
        tenantLabel = ctx.session.tenantId ? ctx.session.tenantId : "Workspace";
    }
    catch (_b) {
        const session = await getSession();
        tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
        tenantLabel = "Workspace";
    }
    void tenantId;
    return (_jsx(AssessmentsShell, { tenantLabel: tenantLabel, children: children }));
}
