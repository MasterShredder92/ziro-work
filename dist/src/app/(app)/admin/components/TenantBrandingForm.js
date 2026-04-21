"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { LogoUploader } from "./LogoUploader";
import { TimezoneSelector } from "./TimezoneSelector";
export function TenantBrandingForm({ tenantId, tenant, canWrite, onSaved, }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const [name, setName] = useState((_a = tenant === null || tenant === void 0 ? void 0 : tenant.name) !== null && _a !== void 0 ? _a : "");
    const [slug, setSlug] = useState((_b = tenant === null || tenant === void 0 ? void 0 : tenant.slug) !== null && _b !== void 0 ? _b : "");
    const [logoUrl, setLogoUrl] = useState((_c = tenant === null || tenant === void 0 ? void 0 : tenant.logo_url) !== null && _c !== void 0 ? _c : null);
    const [primaryColor, setPrimaryColor] = useState((_d = tenant === null || tenant === void 0 ? void 0 : tenant.primary_color) !== null && _d !== void 0 ? _d : "#00E0A4");
    const [accentColor, setAccentColor] = useState((_e = tenant === null || tenant === void 0 ? void 0 : tenant.accent_color) !== null && _e !== void 0 ? _e : "#66D9FF");
    const [timezone, setTimezone] = useState((_f = tenant === null || tenant === void 0 ? void 0 : tenant.timezone) !== null && _f !== void 0 ? _f : "America/New_York");
    const [locale, setLocale] = useState((_g = tenant === null || tenant === void 0 ? void 0 : tenant.locale) !== null && _g !== void 0 ? _g : "en-US");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [savedAt, setSavedAt] = useState(null);
    async function save() {
        var _a;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/tenant?tenantId=${encodeURIComponent(tenantId)}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    name,
                    slug: slug || null,
                    logo_url: logoUrl,
                    primary_color: primaryColor,
                    accent_color: accentColor,
                    timezone,
                    locale,
                }),
            });
            const data = (await res.json().catch(() => null));
            if (!res.ok)
                throw new Error((_a = data === null || data === void 0 ? void 0 : data.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
            if (data === null || data === void 0 ? void 0 : data.data)
                onSaved === null || onSaved === void 0 ? void 0 : onSaved(data.data);
            setSavedAt(new Date().toLocaleTimeString());
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save branding");
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Tenant name" }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm" })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Slug" }), _jsx("input", { value: slug !== null && slug !== void 0 ? slug : "", onChange: (e) => setSlug(e.target.value), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 font-mono text-sm" })] })] }), _jsx(LogoUploader, { value: logoUrl, onChange: setLogoUrl, disabled: !canWrite }), _jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [_jsx(ColorPicker, { label: "Primary color", value: primaryColor, onChange: setPrimaryColor, disabled: !canWrite }), _jsx(ColorPicker, { label: "Accent color", value: accentColor, onChange: setAccentColor, disabled: !canWrite })] }), _jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [_jsx(TimezoneSelector, { value: timezone, onChange: setTimezone, disabled: !canWrite }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Locale" }), _jsx("input", { value: locale, onChange: (e) => setLocale(e.target.value), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 font-mono text-sm" })] })] }), error ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400", children: error })) : null, _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { type: "button", disabled: !canWrite || saving, onClick: save, className: "h-9 rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-4 text-sm font-semibold text-black disabled:opacity-50", children: saving ? "Saving…" : "Save branding" }), savedAt ? (_jsxs("span", { className: "text-xs text-[var(--z-muted)]", children: ["Saved at ", savedAt] })) : null] })] }));
}
