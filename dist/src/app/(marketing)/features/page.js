import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { MarketingTrackedLink } from "@/components/marketing/MarketingTrackedLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { cn, focusRingClassName } from "@/components/ui/utils";
const desc = "Everything in ZiroWork is designed for operators who live in the console daily—studio map, lifecycle spine, palette, and intelligence feed.";
export const metadata = mergePageMetadata({
    title: "Features",
    description: desc,
    openGraph: {
        title: "Features · ZiroWork",
        description: desc,
        url: `${siteBaseUrl()}/features`,
    },
    twitter: { title: "Features · ZiroWork", description: desc },
});
const cta = cn("mt-6 inline-flex h-10 items-center justify-center rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-5 text-sm font-semibold text-black transition-colors hover:bg-[color-mix(in_oklab,var(--z-accent),white_10%)]", focusRingClassName());
export default function FeaturesPage() {
    return (_jsxs("div", { className: "space-y-[var(--z-space-12)]", children: [_jsx(PageHeader, { title: "Features", subtitle: "Everything in ZiroWork is designed for operators who live in the console daily." }), _jsxs(Section, { title: "Surface area", accent: true, spacing: "loose", children: [_jsxs("div", { className: "grid gap-[var(--z-space-4)] md:grid-cols-2", children: [_jsxs(Card, { variant: "default", padding: "md", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: "Studio map" }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Teachers, roster load, and drill-down without leaving the map." })] }), _jsxs(Card, { variant: "default", padding: "md", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: "Lifecycle spine" }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Intake through win-back with consistent stages and receipts." })] }), _jsxs(Card, { variant: "default", padding: "md", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: "Command palette" }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "\u2318K navigation, search, and shortcuts without breaking flow." })] }), _jsxs(Card, { variant: "default", padding: "md", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: "Intelligence feed" }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Events, invoices, and risk surfaced with neon badges." })] })] }), _jsx(MarketingTrackedLink, { href: "/onboarding", eventName: "marketing_cta_features_onboarding", className: cta, children: "Configure in onboarding" })] })] }));
}
