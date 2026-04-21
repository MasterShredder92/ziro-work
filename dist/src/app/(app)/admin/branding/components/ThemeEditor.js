"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState, useTransition } from "react";
import { PortalPreview } from "@/components/branding/PortalPreview";
import { PreviewDeviceSegmentedControl } from "@/components/branding/PreviewDeviceSegmentedControl";
import { PreviewSurfaceModeControl } from "@/components/branding/PreviewSurfaceModeControl";
import { brandingCssVars, serializeCssVars, } from "@/lib/branding/runtime";
import { ColorPicker } from "./ColorPicker";
import { LogoUploader } from "./LogoUploader";
import { FaviconUploader } from "./FaviconUploader";
import { ThemePreviewCard } from "./ThemePreviewCard";
import { BrandingPreview } from "./BrandingPreview";
function toDraft(profile) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return {
        name: (_a = profile === null || profile === void 0 ? void 0 : profile.name) !== null && _a !== void 0 ? _a : "Default brand",
        theme_key: (_b = profile === null || profile === void 0 ? void 0 : profile.theme_key) !== null && _b !== void 0 ? _b : null,
        colors: (_c = profile === null || profile === void 0 ? void 0 : profile.colors) !== null && _c !== void 0 ? _c : {
            primary: "#00ff88",
            secondary: "#00cc6e",
            accent: "#00ff88",
            background: "#080808",
            surface: "#101012",
        },
        typography: (_d = profile === null || profile === void 0 ? void 0 : profile.typography) !== null && _d !== void 0 ? _d : {
            headingFamily: "Inter, system-ui, sans-serif",
            bodyFamily: "Inter, system-ui, sans-serif",
            baseSizePx: 16,
            headingScale: 1.125,
            lineHeight: 1.5,
        },
        components: (_e = profile === null || profile === void 0 ? void 0 : profile.components) !== null && _e !== void 0 ? _e : {
            buttonRadius: "0.75rem",
            cardRadius: "1rem",
        },
        logo: (_f = profile === null || profile === void 0 ? void 0 : profile.logo) !== null && _f !== void 0 ? _f : {
            light: null,
            dark: null,
            monochrome: null,
        },
        icons: (_g = profile === null || profile === void 0 ? void 0 : profile.icons) !== null && _g !== void 0 ? _g : {
            favicon: null,
            appIcon192: null,
            appIcon512: null,
        },
        header_footer: (_h = profile === null || profile === void 0 ? void 0 : profile.header_footer) !== null && _h !== void 0 ? _h : { footerLinks: [] },
        login_page: (_j = profile === null || profile === void 0 ? void 0 : profile.login_page) !== null && _j !== void 0 ? _j : {},
        pdf_export: (_k = profile === null || profile === void 0 ? void 0 : profile.pdf_export) !== null && _k !== void 0 ? _k : { logo: null, pageNumbers: true },
        public_pages: (_l = profile === null || profile === void 0 ? void 0 : profile.public_pages) !== null && _l !== void 0 ? _l : { showPoweredBy: true },
    };
}
function Section({ title, description, children, }) {
    return (_jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: title }), description ? (_jsx("div", { className: "text-[11px] text-[var(--z-muted)] mt-0.5", children: description })) : null] }), children] }));
}
export function ThemeEditor({ tenantId, profile, themes, canWrite, }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    const [draft, setDraft] = useState(() => toDraft(profile));
    const [previewDevice, setPreviewDevice] = useState("desktop");
    const [previewSurface, setPreviewSurface] = useState("theme");
    const [savedAt, setSavedAt] = useState(null);
    const [error, setError] = useState(null);
    const [isPending, startTransition] = useTransition();
    const patchColors = (patch) => setDraft((d) => (Object.assign(Object.assign({}, d), { colors: Object.assign(Object.assign({}, d.colors), patch) })));
    const patchTypography = (patch) => setDraft((d) => (Object.assign(Object.assign({}, d), { typography: Object.assign(Object.assign({}, d.typography), patch) })));
    const patchComponents = (patch) => setDraft((d) => (Object.assign(Object.assign({}, d), { components: Object.assign(Object.assign({}, d.components), patch) })));
    const patchLogo = (patch) => setDraft((d) => (Object.assign(Object.assign({}, d), { logo: Object.assign(Object.assign({}, d.logo), patch) })));
    const patchIcons = (patch) => setDraft((d) => (Object.assign(Object.assign({}, d), { icons: Object.assign(Object.assign({}, d.icons), patch) })));
    const patchHeaderFooter = (patch) => setDraft((d) => (Object.assign(Object.assign({}, d), { header_footer: Object.assign(Object.assign({}, d.header_footer), patch) })));
    const patchLoginPage = (patch) => setDraft((d) => (Object.assign(Object.assign({}, d), { login_page: Object.assign(Object.assign({}, d.login_page), patch) })));
    const patchPdf = (patch) => setDraft((d) => (Object.assign(Object.assign({}, d), { pdf_export: Object.assign(Object.assign({}, d.pdf_export), patch) })));
    const patchPublic = (patch) => setDraft((d) => (Object.assign(Object.assign({}, d), { public_pages: Object.assign(Object.assign({}, d.public_pages), patch) })));
    const applyTheme = (themeKey) => {
        const theme = themes.find((t) => t.theme_key === themeKey);
        if (!theme)
            return;
        setDraft((d) => (Object.assign(Object.assign({}, d), { theme_key: theme.theme_key, colors: Object.assign(Object.assign({}, d.colors), theme.tokens.colors), typography: Object.assign(Object.assign({}, d.typography), theme.tokens.typography), components: Object.assign(Object.assign({}, d.components), theme.tokens.components) })));
    };
    const previewCss = useMemo(() => {
        var _a, _b;
        const vars = brandingCssVars(Object.assign(Object.assign(Object.assign({}, (profile !== null && profile !== void 0 ? profile : {})), draft), { id: (_a = profile === null || profile === void 0 ? void 0 : profile.id) !== null && _a !== void 0 ? _a : "preview", tenant_id: tenantId, name: draft.name, status: "draft", theme_key: draft.theme_key, draft: null, published_at: null, published_by: null, created_at: (_b = profile === null || profile === void 0 ? void 0 : profile.created_at) !== null && _b !== void 0 ? _b : new Date().toISOString(), updated_at: new Date().toISOString() }));
        return serializeCssVars(vars, "[data-branding-preview]");
    }, [draft, profile, tenantId]);
    const save = (opts) => {
        if (!canWrite)
            return;
        setError(null);
        startTransition(async () => {
            var _a, _b;
            try {
                const res = await fetch(`/api/branding/profile?tenantId=${encodeURIComponent(tenantId)}`, {
                    method: "PATCH",
                    headers: {
                        "content-type": "application/json",
                        "x-tenant-id": tenantId,
                    },
                    body: JSON.stringify({
                        patch: {
                            id: profile === null || profile === void 0 ? void 0 : profile.id,
                            name: draft.name,
                            theme_key: draft.theme_key,
                            colors: draft.colors,
                            typography: draft.typography,
                            components: draft.components,
                            logo: draft.logo,
                            icons: draft.icons,
                            header_footer: draft.header_footer,
                            login_page: draft.login_page,
                            pdf_export: draft.pdf_export,
                            public_pages: draft.public_pages,
                            status: (opts === null || opts === void 0 ? void 0 : opts.publish) ? "published" : "draft",
                            published_at: (opts === null || opts === void 0 ? void 0 : opts.publish)
                                ? new Date().toISOString()
                                : ((_a = profile === null || profile === void 0 ? void 0 : profile.published_at) !== null && _a !== void 0 ? _a : null),
                        },
                    }),
                });
                const json = (await res.json().catch(() => null));
                if (!res.ok) {
                    setError((_b = json === null || json === void 0 ? void 0 : json.error) !== null && _b !== void 0 ? _b : `HTTP ${res.status}`);
                    return;
                }
                setSavedAt(new Date().toISOString());
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
            }
        });
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("header", { className: "flex flex-col sm:flex-row sm:items-center gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Theme editor" }), _jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Colors, typography & component tokens" })] }), _jsxs("div", { className: "sm:ml-auto flex items-center gap-2", children: [savedAt ? (_jsxs("span", { className: "text-[11px] text-[var(--z-muted)]", children: ["Saved ", new Date(savedAt).toLocaleTimeString()] })) : null, _jsx("button", { type: "button", disabled: !canWrite || isPending, onClick: () => save({ publish: false }), className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-xs text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50", children: isPending ? "Saving…" : "Save draft" }), _jsx("button", { type: "button", disabled: !canWrite || isPending, onClick: () => save({ publish: true }), className: "h-9 rounded-[var(--z-radius-sm)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50", children: "Publish" })] })] }), error ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 px-3 py-2 text-xs text-[#ff3b6b]", children: error })) : null, _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [_jsxs("div", { className: "lg:col-span-2 space-y-4", children: [_jsx(Section, { title: "Brand name", description: "Workspace-level display name.", children: _jsx("input", { type: "text", value: draft.name, onChange: (e) => setDraft(Object.assign(Object.assign({}, draft), { name: e.target.value })), disabled: !canWrite, className: "h-9 w-full rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" }) }), _jsx(Section, { title: "Theme presets", description: "Pick a preset and customise below.", children: _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: themes.map((t) => (_jsx(ThemePreviewCard, { theme: t, active: draft.theme_key === t.theme_key, onSelect: applyTheme }, t.theme_key))) }) }), _jsx(Section, { title: "Color palette", children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: [_jsx(ColorPicker, { label: "Primary", value: draft.colors.primary, onChange: (v) => patchColors({ primary: v }), disabled: !canWrite }), _jsx(ColorPicker, { label: "Secondary", value: draft.colors.secondary, onChange: (v) => patchColors({ secondary: v }), disabled: !canWrite }), _jsx(ColorPicker, { label: "Accent", value: draft.colors.accent, onChange: (v) => patchColors({ accent: v }), disabled: !canWrite }), _jsx(ColorPicker, { label: "Background", value: draft.colors.background, onChange: (v) => patchColors({ background: v }), disabled: !canWrite }), _jsx(ColorPicker, { label: "Surface", value: draft.colors.surface, onChange: (v) => patchColors({ surface: v }), disabled: !canWrite }), _jsx(ColorPicker, { label: "Danger", value: (_a = draft.colors.danger) !== null && _a !== void 0 ? _a : "#ff3b6b", onChange: (v) => patchColors({ danger: v }), disabled: !canWrite })] }) }), _jsx(Section, { title: "Typography", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Heading family" }), _jsx("input", { type: "text", value: draft.typography.headingFamily, onChange: (e) => patchTypography({ headingFamily: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono" })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Body family" }), _jsx("input", { type: "text", value: draft.typography.bodyFamily, onChange: (e) => patchTypography({ bodyFamily: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono" })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Base size (px)" }), _jsx("input", { type: "number", value: draft.typography.baseSizePx, onChange: (e) => patchTypography({
                                                        baseSizePx: Number(e.target.value) || 16,
                                                    }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Heading scale" }), _jsx("input", { type: "number", step: "0.05", value: draft.typography.headingScale, onChange: (e) => patchTypography({
                                                        headingScale: Number(e.target.value) || 1.125,
                                                    }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] })] }) }), _jsx(Section, { title: "Component tokens", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Button radius" }), _jsx("input", { type: "text", value: draft.components.buttonRadius, onChange: (e) => patchComponents({ buttonRadius: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono" })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Card radius" }), _jsx("input", { type: "text", value: draft.components.cardRadius, onChange: (e) => patchComponents({ cardRadius: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono" })] }), _jsx(ColorPicker, { label: "Nav background", value: (_b = draft.components.navBackground) !== null && _b !== void 0 ? _b : "#101012", onChange: (v) => patchComponents({ navBackground: v }), disabled: !canWrite }), _jsx(ColorPicker, { label: "Sidebar background", value: (_c = draft.components.sidebarBackground) !== null && _c !== void 0 ? _c : "#0b0b0d", onChange: (v) => patchComponents({ sidebarBackground: v }), disabled: !canWrite })] }) }), _jsx(Section, { title: "Logos", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsx(LogoUploader, { label: "Logo (dark bg)", value: (_d = draft.logo.dark) !== null && _d !== void 0 ? _d : null, onChange: (v) => patchLogo({ dark: v }), disabled: !canWrite, backgroundStyle: "dark" }), _jsx(LogoUploader, { label: "Logo (light bg)", value: (_e = draft.logo.light) !== null && _e !== void 0 ? _e : null, onChange: (v) => patchLogo({ light: v }), disabled: !canWrite, backgroundStyle: "light" }), _jsx(LogoUploader, { label: "Monochrome", value: (_f = draft.logo.monochrome) !== null && _f !== void 0 ? _f : null, onChange: (v) => patchLogo({ monochrome: v }), disabled: !canWrite, backgroundStyle: "dark" })] }) }), _jsx(Section, { title: "Icons", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: [_jsx(FaviconUploader, { size: "favicon", value: draft.icons.favicon, onChange: (v) => patchIcons({ favicon: v }), disabled: !canWrite }), _jsx(FaviconUploader, { size: "icon192", label: "App icon 192", value: draft.icons.appIcon192, onChange: (v) => patchIcons({ appIcon192: v }), disabled: !canWrite }), _jsx(FaviconUploader, { size: "icon512", label: "App icon 512", value: draft.icons.appIcon512, onChange: (v) => patchIcons({ appIcon512: v }), disabled: !canWrite })] }) }), _jsx(Section, { title: "Header & footer", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Header tagline" }), _jsx("input", { type: "text", value: (_g = draft.header_footer.headerTagline) !== null && _g !== void 0 ? _g : "", onChange: (e) => patchHeaderFooter({ headerTagline: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Footer text" }), _jsx("input", { type: "text", value: (_h = draft.header_footer.footerText) !== null && _h !== void 0 ? _h : "", onChange: (e) => patchHeaderFooter({ footerText: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Support email" }), _jsx("input", { type: "email", value: (_j = draft.header_footer.supportEmail) !== null && _j !== void 0 ? _j : "", onChange: (e) => patchHeaderFooter({ supportEmail: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Support URL" }), _jsx("input", { type: "url", value: (_k = draft.header_footer.supportUrl) !== null && _k !== void 0 ? _k : "", onChange: (e) => patchHeaderFooter({ supportUrl: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] })] }) }), _jsx(Section, { title: "Login page", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Hero headline" }), _jsx("input", { type: "text", value: (_l = draft.login_page.heroHeadline) !== null && _l !== void 0 ? _l : "", onChange: (e) => patchLoginPage({ heroHeadline: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Hero subline" }), _jsx("input", { type: "text", value: (_m = draft.login_page.heroSubline) !== null && _m !== void 0 ? _m : "", onChange: (e) => patchLoginPage({ heroSubline: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsx(LogoUploader, { label: "Hero image", value: (_o = draft.login_page.heroImage) !== null && _o !== void 0 ? _o : null, onChange: (v) => patchLoginPage({ heroImage: v }), disabled: !canWrite }), _jsx(ColorPicker, { label: "Hero background", value: (_p = draft.login_page.backgroundColor) !== null && _p !== void 0 ? _p : draft.colors.background, onChange: (v) => patchLoginPage({ backgroundColor: v }), disabled: !canWrite })] }) }), _jsx(Section, { title: "PDF export branding", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsx(LogoUploader, { label: "PDF logo", value: (_q = draft.pdf_export.logo) !== null && _q !== void 0 ? _q : null, onChange: (v) => patchPdf({ logo: v }), disabled: !canWrite }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Footer text" }), _jsx("input", { type: "text", value: (_r = draft.pdf_export.footerText) !== null && _r !== void 0 ? _r : "", onChange: (e) => patchPdf({ footerText: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Watermark" }), _jsx("input", { type: "text", value: (_s = draft.pdf_export.watermark) !== null && _s !== void 0 ? _s : "", onChange: (e) => patchPdf({ watermark: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex items-center gap-2 pt-6", children: [_jsx("input", { type: "checkbox", checked: draft.pdf_export.pageNumbers, onChange: (e) => patchPdf({ pageNumbers: e.target.checked }), disabled: !canWrite }), _jsx("span", { className: "text-sm text-[var(--z-fg)]", children: "Show page numbers" })] })] }) }), _jsx(Section, { title: "Public pages", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: draft.public_pages.showPoweredBy, onChange: (e) => patchPublic({ showPoweredBy: e.target.checked }), disabled: !canWrite }), _jsx("span", { className: "text-sm text-[var(--z-fg)]", children: "Show \u201CPowered by\u201D badge" })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Share header text" }), _jsx("input", { type: "text", value: (_t = draft.public_pages.shareHeaderText) !== null && _t !== void 0 ? _t : "", onChange: (e) => patchPublic({ shareHeaderText: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex flex-col gap-1 md:col-span-2", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Signature footer text" }), _jsx("input", { type: "text", value: (_u = draft.public_pages.signatureFooterText) !== null && _u !== void 0 ? _u : "", onChange: (e) => patchPublic({ signatureFooterText: e.target.value }), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] })] }) })] }), _jsx("aside", { className: "space-y-3 lg:sticky lg:top-2 lg:self-start", children: _jsxs(Section, { title: "Live preview", description: "Reflects your draft as you edit \u2014 scoped to this panel only.", children: [_jsx("style", { dangerouslySetInnerHTML: { __html: previewCss } }), _jsxs("div", { className: "space-y-3", children: [_jsx(PreviewSurfaceModeControl, { value: previewSurface, onChange: setPreviewSurface }), _jsx(PreviewDeviceSegmentedControl, { value: previewDevice, onChange: setPreviewDevice }), previewSurface === "theme" ? (_jsx(BrandingPreview, { device: previewDevice, logo: draft.logo, colors: draft.colors, typography: draft.typography, headerFooter: draft.header_footer })) : (_jsx(PortalPreview, { device: previewDevice, tenantName: draft.name }))] })] }) })] })] }));
}
