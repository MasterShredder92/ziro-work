"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
const THEME_KEY = "zirowork.theme.v1";
const ACCENTS = {
    green: "#00ff88",
    blue: "#4dabff",
    purple: "#c56bff",
};
const ACCENT_OPTIONS = [
    { value: "green", label: "Neon green" },
    { value: "blue", label: "Electric blue" },
    { value: "purple", label: "Ultraviolet" },
];
const DENSITY_OPTIONS = [
    { value: "compact", label: "Compact" },
    { value: "default", label: "Default" },
    { value: "spacious", label: "Spacious" },
];
function densityScale(d) {
    if (d === "compact")
        return 0.9;
    if (d === "spacious")
        return 1.12;
    return 1;
}
function applyTheme(next) {
    const root = document.documentElement;
    root.style.setProperty("--z-accent-color", ACCENTS[next.accent]);
    root.style.setProperty("--z-neon-strength", String(next.neon));
    root.style.setProperty("--z-density-scale", String(densityScale(next.density)));
}
export function ThemeSettingsClient() {
    const [accent, setAccent] = React.useState("green");
    const [neon, setNeon] = React.useState(1);
    const [density, setDensity] = React.useState("default");
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem(THEME_KEY);
            if (!raw)
                return;
            const parsed = JSON.parse(raw);
            if (parsed.accent)
                setAccent(parsed.accent);
            if (typeof parsed.neon === "number")
                setNeon(parsed.neon);
            if (parsed.density)
                setDensity(parsed.density);
        }
        catch (_a) {
            /* ignore */
        }
    }, []);
    React.useEffect(() => {
        applyTheme({ accent, neon, density });
        try {
            localStorage.setItem(THEME_KEY, JSON.stringify({ accent, neon, density }));
        }
        catch (_a) {
            /* ignore */
        }
    }, [accent, neon, density]);
    return (_jsxs(PageShell, { title: "Theme", children: [_jsx("div", { className: "mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: _jsx(Link, { className: "text-[var(--z-accent)] hover:underline", href: "/settings", children: "\u2190 All settings" }) }), _jsx(SettingsSection, { title: "Charcoal + neon controls", description: "Variables bind to `--z-accent-color`, `--z-neon-strength`, and `--z-density-scale` on the document root.", children: _jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-4)] lg:grid-cols-2", children: [_jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "space-y-[var(--z-space-4)]", children: [_jsx(Select, { label: "Accent color", options: ACCENT_OPTIONS, value: accent, onChange: (e) => setAccent(e.target.value) }), _jsx(Slider, { label: "Neon intensity", min: 0.35, max: 1.65, step: 0.05, value: neon, onValueChange: setNeon, hint: "Multiplies glow strength on switches + focus rings." })] }), _jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "space-y-[var(--z-space-4)]", children: [_jsx(Select, { label: "Density", options: DENSITY_OPTIONS, value: density, onChange: (e) => setDensity(e.target.value) }), _jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-[calc(var(--z-space-4)*var(--z-density-scale,1))]", style: { fontSize: "calc(0.85rem * var(--z-density-scale, 1))" }, children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Preview" }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-fg)]", children: "Density scales padding + type rhythm for future surfaces\u2014tokens stay centralized." })] })] })] }) })] }));
}
