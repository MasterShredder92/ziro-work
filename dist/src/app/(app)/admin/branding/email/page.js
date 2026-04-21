import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getBrandingDashboard } from "@/lib/branding";
import { resolveBrandingContext } from "../guard";
import { resolveBrandingTenantId } from "../tenant";
import { BrandingForbidden } from "../BrandingForbidden";
import { EmailIdentityClient } from "../components/EmailIdentityClient";
export const dynamic = "force-dynamic";
export default async function EmailIdentityPage({ searchParams, }) {
    var _a, _b;
    const params = await searchParams;
    const tenantId = await resolveBrandingTenantId(params);
    let ctx;
    try {
        ctx = await resolveBrandingContext({ tenantId });
    }
    catch (_c) {
        ctx = undefined;
    }
    if (!ctx)
        return _jsx(BrandingForbidden, { variant: "compact" });
    const data = await getBrandingDashboard(ctx.tenantId);
    const primary = (_b = (_a = data.primaryEmailIdentity) !== null && _a !== void 0 ? _a : data.emailIdentities[0]) !== null && _b !== void 0 ? _b : null;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Email identity" }), _jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "From name, from address, reply-to" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Used by Messaging OS for outbound email deliveries (metadata stub)." })] }), _jsx(EmailIdentityClient, { tenantId: ctx.tenantId, canWrite: ctx.canWrite, identity: primary })] }));
}
