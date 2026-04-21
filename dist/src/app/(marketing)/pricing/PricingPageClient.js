"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { PricingCalculator } from "@/components/pricing/PricingCalculator";
import { useMarketingConversion } from "@/components/marketing/MarketingConversionContext";
import { Button } from "@/components/ui/Button";
import { MarketingTrackedLink } from "@/components/marketing/MarketingTrackedLink";
import { cn, focusRingClassName } from "@/components/ui/utils";
const trial = cn("inline-flex h-10 items-center justify-center rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-5 text-sm font-extrabold text-black transition-colors hover:bg-[color-mix(in_oklab,var(--z-accent),white_10%)]", focusRingClassName());
const demo = cn("inline-flex h-10 items-center justify-center rounded-[var(--z-radius-md)] border border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] px-5 text-sm font-extrabold text-[var(--z-accent)] transition-colors hover:bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)]", focusRingClassName());
export function PricingPageClient() {
    const { openComparePlans } = useMarketingConversion();
    return (_jsxs("div", { className: "space-y-[var(--z-space-12)]", children: [_jsx(PageHeader, { title: "Pricing", subtitle: "Transparent tiers for studios that want signal without bloat.", actions: _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: openComparePlans, children: "Compare plans" }), _jsx(MarketingTrackedLink, { href: "/demo", eventName: "marketing_pricing_try_demo", className: demo, children: "Try Demo" })] }) }), _jsx(Section, { title: "Estimator", accent: true, description: "Slide roster shape \u2014 we highlight the recommended plan.", children: _jsx(PricingCalculator, {}) }), _jsxs(Section, { title: "Plans", accent: true, children: [_jsx("div", { className: "grid gap-[var(--z-space-4)] md:grid-cols-3", children: [
                            {
                                name: "Launch",
                                price: "$49",
                                blurb: "Solo director + one location.",
                                bullets: ["Lifecycle", "Map", "Dashboard"],
                            },
                            {
                                name: "Scale",
                                price: "$129",
                                blurb: "Multi-teacher roster + automations.",
                                bullets: ["Automations", "Palette", "Priority"],
                            },
                            {
                                name: "Command",
                                price: "Talk",
                                blurb: "Multi-site + API + white-glove.",
                                bullets: ["Dedicated", "API", "SLA"],
                            },
                        ].map((p) => (_jsxs(Card, { variant: "elevated", padding: "lg", radius: "lg", children: [_jsx("div", { className: "text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--z-accent)]", children: p.name }), _jsx("div", { className: "mt-3 text-3xl font-extrabold text-[var(--z-fg)]", children: p.price }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: p.blurb }), _jsx("ul", { className: "mt-4 space-y-1 text-xs text-[color-mix(in_oklab,var(--z-fg),transparent_35%)]", children: p.bullets.map((b) => (_jsxs("li", { children: ["\u00B7 ", b] }, b))) })] }, p.name))) }), _jsxs("div", { className: "mt-6 flex flex-wrap gap-3", children: [_jsx(MarketingTrackedLink, { href: "/signup", eventName: "marketing_pricing_signup", className: trial, children: "Start free trial" }), _jsx(MarketingTrackedLink, { href: "/demo", eventName: "marketing_pricing_demo_footer", className: demo, children: "Try Demo" }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: openComparePlans, children: "Open compare drawer" })] })] })] }));
}
