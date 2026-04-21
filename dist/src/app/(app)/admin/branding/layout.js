import { jsx as _jsx } from "react/jsx-runtime";
import { BrandingShell } from "./components/BrandingShell";
import { resolveBrandingDashboardContext } from "./guard";
export const dynamic = "force-dynamic";
export default async function BrandingSectionLayout({ children, }) {
    var _a;
    let tenantLabel = "Workspace";
    let canWrite = false;
    let generatedAt = null;
    try {
        const ctx = await resolveBrandingDashboardContext();
        tenantLabel = (_a = ctx.session.tenantId) !== null && _a !== void 0 ? _a : tenantLabel;
        canWrite = ctx.canWrite;
        generatedAt = new Date().toISOString();
    }
    catch (_b) {
        /* shell still renders; pages show forbidden */
    }
    return (_jsx(BrandingShell, { tenantLabel: tenantLabel, canWrite: canWrite, generatedAt: generatedAt, children: children }));
}
