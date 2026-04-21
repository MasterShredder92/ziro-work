import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getBrandingDashboard } from "@/lib/branding";
import { resolveBrandingAdminSurfaceContext } from "../guard";
import { resolveBrandingTenantId } from "../tenant";
import { BrandingForbidden } from "../BrandingForbidden";
import { DomainManagerClient } from "../components/DomainManagerClient";
export const dynamic = "force-dynamic";
export default async function DomainManagerPage({ searchParams, }) {
    const params = await searchParams;
    const tenantId = await resolveBrandingTenantId(params);
    let ctx;
    try {
        ctx = await resolveBrandingAdminSurfaceContext({ tenantId });
    }
    catch (_a) {
        ctx = undefined;
    }
    if (!ctx)
        return _jsx(BrandingForbidden, { variant: "compact" });
    const data = await getBrandingDashboard(ctx.tenantId);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Custom domains" }), _jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "CNAME verification & activation" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Point your DNS to the verification target, then verify and activate." })] }), _jsx(DomainManagerClient, { tenantId: ctx.tenantId, canWrite: ctx.canWrite, domains: data.domains })] }));
}
