"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { ThemePreviewCard } from "./ThemePreviewCard";
export function ThemeEditorClient({ tenantId, canWrite, profile, themes, activeThemeKey, }) {
    var _a, _b, _c, _d, _e;
    const initial = profile === null || profile === void 0 ? void 0 : profile.colors;
    const [primary, setPrimary] = useState((_a = initial === null || initial === void 0 ? void 0 : initial.primary) !== null && _a !== void 0 ? _a : "#00ff88");
    const [secondary, setSecondary] = useState((_b = initial === null || initial === void 0 ? void 0 : initial.secondary) !== null && _b !== void 0 ? _b : "#00cc6e");
    const [accent, setAccent] = useState((_c = initial === null || initial === void 0 ? void 0 : initial.accent) !== null && _c !== void 0 ? _c : "#00ff88");
    const [background, setBackground] = useState((_d = initial === null || initial === void 0 ? void 0 : initial.background) !== null && _d !== void 0 ? _d : "#080808");
    const [surface, setSurface] = useState((_e = initial === null || initial === void 0 ? void 0 : initial.surface) !== null && _e !== void 0 ? _e : "#101012");
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    const qs = useMemo(() => `tenantId=${encodeURIComponent(tenantId)}`, [tenantId]);
    if (!profile) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]", children: "No branding profile exists for this tenant yet. Seed a profile row or create one via the API." }));
    }
    async function saveColors() {
        var _a;
        if (!canWrite || !profile)
            return;
        setBusy(true);
        setMsg(null);
        try {
            const res = await fetch(`/api/branding/profile?${qs}`, {
                method: "PATCH",
                headers: {
                    "content-type": "application/json",
                    "x-tenant-id": tenantId,
                },
                body: JSON.stringify({
                    patch: {
                        id: profile.id,
                        colors: Object.assign(Object.assign({}, profile.colors), { primary,
                            secondary,
                            accent,
                            background,
                            surface }),
                    },
                }),
            });
            const j = (await res.json().catch(() => null));
            if (!res.ok) {
                setMsg((_a = j === null || j === void 0 ? void 0 : j.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                return;
            }
            setMsg("Saved.");
        }
        finally {
            setBusy(false);
        }
    }
    async function applyTheme(themeKey) {
        var _a;
        if (!canWrite)
            return;
        setBusy(true);
        setMsg(null);
        try {
            const res = await fetch(`/api/branding/theme?${qs}`, {
                method: "PATCH",
                headers: {
                    "content-type": "application/json",
                    "x-tenant-id": tenantId,
                },
                body: JSON.stringify({ action: "apply", theme_key: themeKey }),
            });
            const j = (await res.json().catch(() => null));
            if (!res.ok) {
                setMsg((_a = j === null || j === void 0 ? void 0 : j.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                return;
            }
            setMsg(`Applied theme ${themeKey}.`);
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "space-y-8", children: [_jsx("section", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: themes.map((t) => (_jsx(ThemePreviewCard, { theme: t, active: activeThemeKey === t.theme_key, disabled: !canWrite || busy, onSelect: applyTheme }, t.theme_key))) }), _jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-4", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Palette" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: [_jsx(ColorPicker, { label: "Primary", value: primary, onChange: setPrimary, disabled: !canWrite }), _jsx(ColorPicker, { label: "Secondary", value: secondary, onChange: setSecondary, disabled: !canWrite }), _jsx(ColorPicker, { label: "Accent", value: accent, onChange: setAccent, disabled: !canWrite }), _jsx(ColorPicker, { label: "Background", value: background, onChange: setBackground, disabled: !canWrite }), _jsx(ColorPicker, { label: "Surface", value: surface, onChange: setSurface, disabled: !canWrite })] }), _jsx("button", { type: "button", disabled: !canWrite || !profile || busy, onClick: saveColors, className: "rounded-[var(--z-radius-md)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-4 py-2 text-sm font-semibold text-[#00ff88] disabled:opacity-50", children: busy ? "Saving…" : "Save palette to profile" }), msg ? _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: msg }) : null] })] }));
}
