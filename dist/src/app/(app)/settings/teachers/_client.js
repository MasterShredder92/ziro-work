"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { List } from "@/components/ui/List";
import { useTenantSettings } from "@/hooks/data/useTenantSettings";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
function asRecord(v) {
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
export function TeachersSettingsClient() {
    var _a;
    const settings = useTenantSettings(DEFAULT_TENANT_ID);
    const kpi = React.useMemo(() => { var _a; return asRecord((_a = settings.data) === null || _a === void 0 ? void 0 : _a.kpi_settings); }, [(_a = settings.data) === null || _a === void 0 ? void 0 : _a.kpi_settings]);
    const [maxStudents, setMaxStudents] = React.useState("18");
    const [sequenceNotes, setSequenceNotes] = React.useState("Day 0 welcome · Day 3 curriculum check · Day 10 retention pulse");
    React.useEffect(() => {
        if (kpi.default_max_students != null)
            setMaxStudents(String(kpi.default_max_students));
        if (typeof kpi.onboarding_sequence === "string")
            setSequenceNotes(kpi.onboarding_sequence);
    }, [kpi]);
    const steps = [
        { id: "1", title: "Invite teacher", description: "Send magic link + policy pack." },
        { id: "2", title: "Capacity audit", description: "Align roster targets with payroll bands." },
        { id: "3", title: "First 30 days", description: "Automations nudge attendance + lesson notes." },
    ];
    return (_jsxs(PageShell, { title: "Teachers", children: [_jsx("div", { className: "mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: _jsx(Link, { className: "text-[var(--z-accent)] hover:underline", href: "/settings", children: "\u2190 All settings" }) }), _jsxs(SettingsSection, { title: "Teacher program defaults", description: "Operational guardrails before teachers hit the roster.", children: [settings.error ? (_jsx("p", { className: "text-sm text-[var(--z-danger)]", children: settings.error.message })) : null, _jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "space-y-[var(--z-space-4)]", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Default max students / teacher" }), _jsx(Input, { label: "Seats", inputMode: "numeric", value: maxStudents, onChange: (e) => setMaxStudents(e.target.value), hint: "Hydrates from `kpi_settings.default_max_students` when configured." })] }), _jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "space-y-[var(--z-space-4)]", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Default onboarding sequence" }), _jsx(Input, { label: "Playbook notes", value: sequenceNotes, onChange: (e) => setSequenceNotes(e.target.value) }), _jsxs("div", { children: [_jsx("div", { className: "mb-[var(--z-space-2)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Reference checklist" }), _jsx(List, { items: steps })] })] })] })] }));
}
