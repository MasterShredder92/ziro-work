"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import * as React from "react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
const ACCENTS = [
    { value: "green", label: "Neon green" },
    { value: "blue", label: "Electric blue" },
    { value: "purple", label: "Ultraviolet" },
];
const DENSITY = [
    { value: "compact", label: "Compact" },
    { value: "default", label: "Default" },
    { value: "spacious", label: "Spacious" },
];
const ACCENT_HEX = {
    green: "#00ff88",
    blue: "#4dabff",
    purple: "#c56bff",
};
export default function SandboxThemeSettingsPage() {
    const [accent, setAccent] = React.useState("green");
    const [neon, setNeon] = React.useState(1);
    const [density, setDensity] = React.useState("default");
    React.useEffect(() => {
        var _a;
        const root = document.documentElement;
        root.style.setProperty("--z-accent-color", (_a = ACCENT_HEX[accent]) !== null && _a !== void 0 ? _a : ACCENT_HEX.green);
        root.style.setProperty("--z-neon-strength", String(neon));
        const scale = density === "compact" ? 0.9 : density === "spacious" ? 1.12 : 1;
        root.style.setProperty("--z-density-scale", String(scale));
    }, [accent, neon, density]);
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Theme (sandbox)" }), _jsx(Link, { className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox/settings", children: "Back" })] }), _jsx(SettingsSection, { title: "Theme controls", description: "Live CSS variables on the document root.", children: _jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-4)] lg:grid-cols-2", children: [_jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "space-y-[var(--z-space-4)]", children: [_jsx(Select, { label: "Accent", options: ACCENTS, value: accent, onChange: (e) => setAccent(e.target.value) }), _jsx(Slider, { label: "Neon strength", min: 0.35, max: 1.65, step: 0.05, value: neon, onValueChange: setNeon })] }), _jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "space-y-[var(--z-space-4)]", children: [_jsx(Select, { label: "Density", options: DENSITY, value: density, onChange: (e) => setDensity(e.target.value) }), _jsx("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-[calc(var(--z-space-4)*var(--z-density-scale,1))]", style: { fontSize: "calc(0.85rem * var(--z-density-scale, 1))" }, children: "Density preview card" })] })] }) })] }));
}
