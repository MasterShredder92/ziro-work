"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { Switch } from "@/components/ui/Switch";
import { useTenantSettings } from "@/hooks/data/useTenantSettings";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
function asRecord(v) {
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
export function AutomationsSettingsClient() {
    var _a, _b, _c, _d;
    const settings = useTenantSettings(DEFAULT_TENANT_ID);
    const pipelines = React.useMemo(() => { var _a; return asRecord((_a = settings.data) === null || _a === void 0 ? void 0 : _a.pipelines); }, [(_a = settings.data) === null || _a === void 0 ? void 0 : _a.pipelines]);
    const [advance, setAdvance] = React.useState(Boolean((_b = pipelines.auto_advance_lifecycle) !== null && _b !== void 0 ? _b : false));
    const [atRisk, setAtRisk] = React.useState(Boolean((_c = pipelines.auto_detect_at_risk) !== null && _c !== void 0 ? _c : true));
    const [winBack, setWinBack] = React.useState(Boolean((_d = pipelines.auto_win_back) !== null && _d !== void 0 ? _d : false));
    React.useEffect(() => {
        var _a, _b, _c;
        setAdvance(Boolean((_a = pipelines.auto_advance_lifecycle) !== null && _a !== void 0 ? _a : false));
        setAtRisk(Boolean((_b = pipelines.auto_detect_at_risk) !== null && _b !== void 0 ? _b : true));
        setWinBack(Boolean((_c = pipelines.auto_win_back) !== null && _c !== void 0 ? _c : false));
    }, [pipelines]);
    const enabledToggleCount = React.useMemo(() => [advance, atRisk, winBack].filter(Boolean).length, [advance, atRisk, winBack]);
    return (_jsxs(PageShell, { title: "Automations", children: [_jsx("div", { className: "mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: _jsx(Link, { className: "text-[var(--z-accent)] hover:underline", href: "/settings", children: "\u2190 All settings" }) }), _jsxs(SettingsSection, { title: "Lifecycle automations", description: `Toggles are optimistic UI—bind to automation workers when ready (${enabledToggleCount} enabled).`, children: [settings.error ? (_jsx("p", { className: "text-sm text-[var(--z-danger)]", children: settings.error.message })) : null, _jsxs(SettingsGroup, { title: "Signals", children: [_jsx(Switch, { checked: advance, onCheckedChange: setAdvance, label: "Auto-advance lifecycle stages", description: "Progress students when attendance + billing signals are green." }), _jsx(Switch, { checked: atRisk, onCheckedChange: setAtRisk, label: "Auto-detect at-risk students", description: "Blend attendance streaks, invoices, and lifecycle notes." }), _jsx(Switch, { checked: winBack, onCheckedChange: setWinBack, label: "Auto-start win-back sequences", description: "Trigger win-back playbooks after dormancy thresholds." })] })] })] }));
}
