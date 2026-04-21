import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getBrandingDashboard } from "@/lib/branding";
import { resolveBrandingAdminSurfaceContext } from "../guard";
import { resolveBrandingTenantId } from "../tenant";
import { BrandingForbidden } from "../BrandingForbidden";
import { ThemeEditor } from "../components/ThemeEditor";
export const dynamic = "force-dynamic";
export default async function ThemeEditorPage({ searchParams, }) {
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
    if (!data.profile) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Theme editor" }), _jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Colors, typography & component tokens" })] }), _jsx("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]", children: "No branding profile exists for this tenant yet. Seed a profile row or create one via the API." })] }));
    }
    return (_jsx(ThemeEditor, { tenantId: ctx.tenantId, canWrite: ctx.canWrite, profile: data.profile, themes: data.themes }));
}
