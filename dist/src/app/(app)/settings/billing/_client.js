"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useTenantSettings } from "@/hooks/data/useTenantSettings";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
function asRecord(v) {
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
export function BillingSettingsClient() {
    var _a;
    const settings = useTenantSettings(DEFAULT_TENANT_ID);
    const kpi = React.useMemo(() => { var _a; return asRecord((_a = settings.data) === null || _a === void 0 ? void 0 : _a.kpi_settings); }, [(_a = settings.data) === null || _a === void 0 ? void 0 : _a.kpi_settings]);
    const [invoiceDefault, setInvoiceDefault] = React.useState("12000");
    const [payRate, setPayRate] = React.useState("45");
    const [latePercent, setLatePercent] = React.useState("5");
    const [lateGraceDays, setLateGraceDays] = React.useState("3");
    React.useEffect(() => {
        if (kpi.default_invoice_cents != null)
            setInvoiceDefault(String(kpi.default_invoice_cents));
        if (kpi.default_teacher_hourly_cents != null)
            setPayRate(String(Math.round(Number(kpi.default_teacher_hourly_cents) / 100)));
        if (kpi.late_fee_percent != null)
            setLatePercent(String(kpi.late_fee_percent));
        if (kpi.late_fee_grace_days != null)
            setLateGraceDays(String(kpi.late_fee_grace_days));
    }, [kpi]);
    return (_jsxs(PageShell, { title: "Billing", children: [_jsx("div", { className: "mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: _jsx(Link, { className: "text-[var(--z-accent)] hover:underline", href: "/settings", children: "\u2190 All settings" }) }), _jsxs(SettingsSection, { title: "Billing defaults", description: "Numbers hydrate from tenant KPI JSON when present\u2014saving is UI-only for now.", children: [settings.error ? (_jsx("p", { className: "text-sm text-[var(--z-danger)]", children: settings.error.message })) : null, _jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-4)] lg:grid-cols-2", children: [_jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "space-y-[var(--z-space-4)]", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Default invoice amount" }), _jsx(Badge, { variant: "neutral", children: "cents" })] }), _jsx(Input, { label: "Amount (cents)", inputMode: "numeric", value: invoiceDefault, onChange: (e) => setInvoiceDefault(e.target.value), hint: "Example: 12000 \u2192 $120.00 invoices." })] }), _jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "space-y-[var(--z-space-4)]", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Default teacher pay" }), _jsx(Badge, { variant: "success", children: "USD / hr" })] }), _jsx(Input, { label: "Hourly rate", inputMode: "decimal", value: payRate, onChange: (e) => setPayRate(e.target.value), hint: "Whole dollars for quick modeling." })] })] }), _jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "space-y-[var(--z-space-4)]", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Late fee rules" }), _jsx(Badge, { variant: "warning", children: "UI only" })] }), _jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-2", children: [_jsx(Input, { label: "Penalty %", inputMode: "numeric", value: latePercent, onChange: (e) => setLatePercent(e.target.value) }), _jsx(Input, { label: "Grace period (days)", inputMode: "numeric", value: lateGraceDays, onChange: (e) => setLateGraceDays(e.target.value) })] }), _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "Enforcement stays in your billing engine\u2014this card is a visual contract for staff." })] })] })] }));
}
