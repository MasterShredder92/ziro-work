"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useTenantSettings } from "@/hooks/data/useTenantSettings";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
function asRecord(v) {
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
const TIMEZONES = [
    { value: "America/New_York", label: "Eastern (US)" },
    { value: "America/Chicago", label: "Central (US)" },
    { value: "America/Denver", label: "Mountain (US)" },
    { value: "America/Los_Angeles", label: "Pacific (US)" },
    { value: "UTC", label: "UTC" },
];
const BILLING_CYCLES = [
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Bi-weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
];
export function StudioInfoSettingsClient() {
    const settings = useTenantSettings(DEFAULT_TENANT_ID);
    const row = settings.data;
    const schedule = React.useMemo(() => asRecord(row === null || row === void 0 ? void 0 : row.schedule), [row === null || row === void 0 ? void 0 : row.schedule]);
    const kpi = React.useMemo(() => asRecord(row === null || row === void 0 ? void 0 : row.kpi_settings), [row === null || row === void 0 ? void 0 : row.kpi_settings]);
    const [studioName, setStudioName] = React.useState("");
    const [timezone, setTimezone] = React.useState("America/New_York");
    const [billingCycle, setBillingCycle] = React.useState("monthly");
    const [logoName, setLogoName] = React.useState(null);
    const [logoUrl, setLogoUrl] = React.useState(null);
    const [logoUploading, setLogoUploading] = React.useState(false);
    const [logoError, setLogoError] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    const [saveStatus, setSaveStatus] = React.useState("idle");
    const [saveError, setSaveError] = React.useState(null);
    React.useEffect(() => {
        var _a, _b, _c, _d;
        const name = (_b = (_a = schedule.studio_display_name) !== null && _a !== void 0 ? _a : kpi.display_name) !== null && _b !== void 0 ? _b : `Ziro · ${DEFAULT_TENANT_ID.slice(0, 8)}`;
        setStudioName(String(name));
        setTimezone(String((_c = schedule.timezone) !== null && _c !== void 0 ? _c : "America/New_York"));
        setBillingCycle(String((_d = schedule.default_billing_cycle) !== null && _d !== void 0 ? _d : "monthly"));
        if (schedule.logo_url)
            setLogoUrl(String(schedule.logo_url));
    }, [schedule, kpi]);
    async function handleLogoUpload(file) {
        var _a, _b;
        setLogoUploading(true);
        setLogoError(null);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/admin/logo", { method: "POST", body: fd });
            const j = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error((_a = j.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
            setLogoUrl((_b = j.url) !== null && _b !== void 0 ? _b : null);
            setLogoName(file.name);
            await settings.reload();
        }
        catch (err) {
            setLogoError(err instanceof Error ? err.message : "Upload failed");
        }
        finally {
            setLogoUploading(false);
        }
    }
    async function handleSave() {
        var _a;
        setSaving(true);
        setSaveStatus("idle");
        setSaveError(null);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    schedule: {
                        studio_display_name: studioName,
                        timezone,
                        default_billing_cycle: billingCycle,
                    },
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((_a = body.message) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
            }
            setSaveStatus("success");
            await settings.reload();
            setTimeout(() => setSaveStatus("idle"), 3000);
        }
        catch (err) {
            setSaveStatus("error");
            setSaveError(err instanceof Error ? err.message : "Save failed");
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs(PageShell, { title: "Studio Info", children: [_jsx("div", { className: "mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: _jsx(Link, { className: "text-[var(--z-accent)] hover:underline", href: "/settings", children: "\u2190 All settings" }) }), _jsxs(SettingsSection, { title: "Studio identity", description: "Ground truth for how your studio shows up across ZiroWork.", children: [settings.error ? (_jsx("p", { className: "text-sm text-[var(--z-danger)]", children: settings.error.message })) : null, _jsxs(SettingsGroup, { title: "Basics", children: [_jsx(Input, { label: "Studio name", value: studioName, onChange: (e) => setStudioName(e.target.value) }), _jsx(Select, { label: "Timezone", options: TIMEZONES, value: timezone, onChange: (e) => setTimezone(e.target.value) }), _jsx(Select, { label: "Default billing cycle", options: BILLING_CYCLES, value: billingCycle, onChange: (e) => setBillingCycle(e.target.value) })] }), _jsxs(SettingsGroup, { title: "Studio Logo", children: [_jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "Upload your studio logo. It will be saved and displayed across ZiroWork." }), _jsxs("div", { className: "flex flex-wrap items-center gap-[var(--z-space-3)]", children: [_jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border-2)] bg-[var(--z-surface-2)] overflow-hidden", children: logoUrl ? (_jsx("img", { src: logoUrl, alt: "Studio logo", className: "h-full w-full object-contain" })) : (_jsx("span", { className: "text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Logo" })) }), _jsxs("div", { className: "flex flex-col gap-[var(--z-space-2)] sm:flex-row sm:items-center", children: [_jsx(Button, { type: "button", variant: "secondary", size: "sm", disabled: logoUploading, onClick: () => {
                                                    const input = document.createElement("input");
                                                    input.type = "file";
                                                    input.accept = "image/*";
                                                    input.onchange = () => {
                                                        var _a;
                                                        const file = (_a = input.files) === null || _a === void 0 ? void 0 : _a[0];
                                                        if (file)
                                                            void handleLogoUpload(file);
                                                    };
                                                    input.click();
                                                }, children: logoUploading ? "Uploading…" : "Choose file" }), logoName && !logoUploading ? _jsx("span", { className: "text-xs text-[var(--z-muted)]", children: logoName }) : null, logoError ? _jsx("span", { className: "text-xs text-[var(--z-danger)]", children: logoError }) : null] })] })] }), saveStatus === "success" && (_jsx("p", { className: "text-sm text-green-500", children: "Settings saved successfully." })), saveStatus === "error" && saveError && (_jsxs("p", { className: "text-sm text-[var(--z-danger)]", children: ["Error: ", saveError] })), _jsxs("div", { className: "flex flex-wrap gap-[var(--z-space-3)]", children: [_jsx(Button, { type: "button", variant: "primary", size: "md", disabled: saving || settings.isLoading, onClick: handleSave, children: saving ? "Saving…" : "Save changes" }), _jsx(Button, { type: "button", variant: "ghost", size: "md", onClick: () => settings.reload(), children: "Reload from server" })] })] })] }));
}
