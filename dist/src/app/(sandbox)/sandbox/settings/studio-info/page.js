"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import * as React from "react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
const TIMEZONES = [
    { value: "America/New_York", label: "Eastern (US)" },
    { value: "America/Los_Angeles", label: "Pacific (US)" },
];
const BILLING = [
    { value: "monthly", label: "Monthly" },
    { value: "weekly", label: "Weekly" },
];
export default function SandboxStudioInfoSettingsPage() {
    const [name, setName] = React.useState("Northwind Music Lab");
    const [tz, setTz] = React.useState("America/New_York");
    const [cycle, setCycle] = React.useState("monthly");
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Studio Info (sandbox)" }), _jsx(Link, { className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox/settings", children: "Back" })] }), _jsxs(SettingsSection, { title: "Studio identity", description: "Static fixture\u2014no tenant fetch.", children: [_jsxs(SettingsGroup, { title: "Basics", children: [_jsx(Input, { label: "Studio name", value: name, onChange: (e) => setName(e.target.value) }), _jsx(Select, { label: "Timezone", options: TIMEZONES, value: tz, onChange: (e) => setTz(e.target.value) }), _jsx(Select, { label: "Billing cycle", options: BILLING, value: cycle, onChange: (e) => setCycle(e.target.value) })] }), _jsx(SettingsGroup, { title: "Logo (UI only)", children: _jsx(Button, { type: "button", variant: "secondary", size: "sm", children: "Choose file" }) })] })] }));
}
