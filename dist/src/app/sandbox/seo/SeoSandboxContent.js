"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CookieBanner } from "@/components/marketing/CookieBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";
export function SeoSandboxContent({ metadataJson }) {
    const { trackEvent } = useAnalytics();
    return (_jsx("div", { className: "min-h-full bg-[var(--z-bg)] p-[var(--z-space-8)] text-[var(--z-fg)]", children: _jsxs("div", { className: "mx-auto max-w-3xl space-y-[var(--z-space-8)]", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.2em] text-[var(--z-muted)]", children: "Sandbox" }), _jsx("h1", { className: "mt-2 text-2xl font-semibold tracking-tight", children: "SEO + launch chrome" }), _jsx("p", { className: "mt-2 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_18%)]", children: "Metadata snapshot (build-time), cookie banner inline preview, and mock analytics (watch the browser console)." })] }), _jsx(Section, { title: "Default metadata", accent: true, spacing: "default", children: _jsx(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "overflow-x-auto", children: _jsx("pre", { className: "whitespace-pre-wrap text-xs leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]", children: metadataJson }) }) }), _jsx(Section, { title: "Cookie banner (inline)", spacing: "default", children: _jsx(CookieBanner, { honorStoredConsent: false, position: "inline" }) }), _jsx(Section, { title: "Analytics", spacing: "default", children: _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { type: "button", variant: "primary", size: "sm", onClick: () => trackEvent("sandbox_ping", { from: "seo" }), children: "Fire test event" }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => trackEvent("sandbox_utm_hint", { hint: "append ?utm_source=sandbox to this URL" }), children: "Log UTM hint" })] }) })] }) }));
}
