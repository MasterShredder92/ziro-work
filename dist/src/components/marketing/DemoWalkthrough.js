"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";
import { cn, focusRingClassName } from "@/components/ui/utils";
const steps = ["Map", "Lifecycle", "Dashboard"];
export function DemoWalkthrough() {
    const { trackEvent } = useAnalytics();
    const [step, setStep] = React.useState(0);
    React.useEffect(() => {
        trackEvent("demo_mode_enter", {});
    }, [trackEvent]);
    return (_jsxs("div", { className: "space-y-[var(--z-space-10)]", children: [_jsx(PageHeader, { title: "Interactive demo", subtitle: "A lightweight walkthrough\u2014no tenant writes, pure UI signal." }), _jsxs(Section, { title: "Steps", accent: true, spacing: "default", children: [_jsx("div", { className: "flex flex-wrap gap-2", children: steps.map((label, i) => (_jsx(Button, { type: "button", variant: i === step ? "primary" : "secondary", size: "sm", onClick: () => {
                                setStep(i);
                                trackEvent("demo_mode_step", { step: label, index: i });
                            }, children: label }, label))) }), _jsx(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "mt-[var(--z-space-4)]", children: _jsxs("p", { className: "text-sm text-[var(--z-muted)]", children: [step === 0 && "Studio Map orbits teachers and lazy-loads rosters with neon affordances.", step === 1 && "Lifecycle spine keeps intake → win-back receipts aligned with tokens.", step === 2 && "Dashboard concentrates KPIs, feed, and quick actions without breaking flow."] }) }), _jsx(Link, { prefetch: true, href: "/dashboard", className: cn("mt-6 inline-flex h-10 items-center justify-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-5 text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]", focusRingClassName()), onClick: () => trackEvent("demo_mode_open_app", {}), children: "Open live app" })] })] }));
}
