"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { HubLink } from "@/components/publishing/HubLink";
import { AutomationCard } from "@/components/automation/AutomationCard";
export function AutomationsClient() {
    const [nurture, setNurture] = React.useState(true);
    const [winBack, setWinBack] = React.useState(false);
    const [referral, setReferral] = React.useState(true);
    return (_jsx(PageShell, { children: _jsxs("div", { className: "flex flex-col gap-[var(--z-space-8)]", children: [_jsxs("div", { className: "flex flex-col gap-[var(--z-space-3)]", children: [_jsx(PageHeader, { title: "Automations", subtitle: "Marketing toggles for UX review \u2014 no server wiring yet." }), _jsx(HubLink, { label: "Back to Publishing Hub", href: "/publishing-hub" })] }), _jsxs("div", { className: "grid max-w-3xl grid-cols-1 gap-[var(--z-space-4)]", children: [_jsx(AutomationCard, { title: "Nurture sequence", description: "Drip reminders after trial and first invoice to keep momentum.", enabled: nurture, onEnabledChange: setNurture }), _jsx(AutomationCard, { title: "Win-back sequence", description: "Re-engage paused students with escalating offers and social proof.", enabled: winBack, onEnabledChange: setWinBack }), _jsx(AutomationCard, { title: "Referral prompt", description: "Ask happy families for referrals after their fifth completed lesson.", enabled: referral, onEnabledChange: setReferral })] })] }) }));
}
