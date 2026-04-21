import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PORTAL_SCOPES } from "@data/brandingLayoutConfigs";
import { getBrandingDashboard } from "@/lib/branding";
import { resolveBrandingContext } from "../guard";
import { resolveBrandingTenantId } from "../tenant";
import { BrandingForbidden } from "../BrandingForbidden";
import { PortalLayoutPreview } from "../components/PortalLayoutPreview";
export const dynamic = "force-dynamic";
export default async function PortalLayoutPage({ searchParams, }) {
    const params = await searchParams;
    const tenantId = await resolveBrandingTenantId(params);
    let ctx;
    try {
        ctx = await resolveBrandingContext({ tenantId });
    }
    catch (_a) {
        ctx = undefined;
    }
    if (!ctx)
        return _jsx(BrandingForbidden, { variant: "compact" });
    const data = await getBrandingDashboard(ctx.tenantId);
    const byScope = new Map(data.layouts.map((l) => [l.scope, l]));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Portal layouts" }), _jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Presets, sidebars & dashboard widgets" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Per-portal overrides for student, family, teacher, director, and admin portals." })] }), _jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: PORTAL_SCOPES.map((scope) => {
                    var _a;
                    const layout = (_a = byScope.get(scope)) !== null && _a !== void 0 ? _a : {
                        id: `virtual-${scope}`,
                        tenant_id: ctx.tenantId,
                        scope,
                        preset: "classic",
                        sidebar_variant: "icons_labels",
                        dashboard_preset: "grid",
                        widgets: [],
                        header_extras: [],
                        footer_extras: [],
                        created_at: "",
                        updated_at: "",
                    };
                    return (_jsx(PortalLayoutPreview, { layout: layout, scopeLabel: `${scope} portal` }, scope));
                }) })] }));
}
