import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getBrandingRuntime } from "@/lib/branding";
import { resolveBrandingContext } from "../guard";
import { resolveBrandingTenantId } from "../tenant";
import { BrandingForbidden } from "../BrandingForbidden";
export const dynamic = "force-dynamic";
export default async function BrandingPreviewPage({ searchParams, }) {
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
    const runtime = await getBrandingRuntime(ctx.tenantId);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Live preview" }), _jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Tenant theme preview" })] }), _jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] p-6 space-y-4", style: Object.assign(Object.assign({}, Object.fromEntries(Object.entries(runtime.cssVariables).map(([k, v]) => [k, v]))), { background: "var(--brand-background, var(--z-bg))", color: "var(--brand-nav-fg, var(--z-fg))" }), children: [_jsx("div", { className: "text-2xl font-bold", style: { fontFamily: "var(--brand-font-heading, inherit)" }, children: runtime.logo.light || runtime.logo.dark ? "Logo loaded" : "Your studio" }), _jsx("p", { style: { fontFamily: "var(--brand-font-body, inherit)" }, children: "Primary buttons and cards pick up component tokens when published." }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", className: "px-4 py-2 font-semibold", style: {
                                    borderRadius: "var(--brand-button-radius, 0.5rem)",
                                    background: "var(--brand-primary, var(--z-accent))",
                                    color: "#000",
                                }, children: "Primary" }), _jsx("div", { className: "px-4 py-2 border", style: {
                                    borderRadius: "var(--brand-card-radius, 0.75rem)",
                                    borderColor: "var(--brand-card-border, var(--z-border))",
                                    background: "var(--brand-surface, var(--z-surface))",
                                }, children: "Card" })] })] }), runtime.cssText ? (_jsxs("details", { className: "text-xs text-[var(--z-muted)]", children: [_jsx("summary", { className: "cursor-pointer", children: "CSS variables" }), _jsx("pre", { className: "mt-2 overflow-auto rounded border border-[var(--z-border)] p-2 bg-[var(--z-surface-2)] max-h-48", children: runtime.cssText })] })) : null] }));
}
