import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { MarketingTrackedLink } from "@/components/marketing/MarketingTrackedLink";
import { Card } from "@/components/ui/Card";
import { cn, focusRingClassName } from "@/components/ui/utils";
const homeDesc = "The operating system for serious music studios—lifecycle, billing, agents, and studio map in a charcoal console with neon signal.";
export const metadata = mergePageMetadata({
    title: "Home",
    description: homeDesc,
    openGraph: {
        title: "ZiroWork · Operating system for studios",
        description: homeDesc,
        url: siteBaseUrl(),
    },
    twitter: { title: "ZiroWork", description: homeDesc },
});
const HeroOrb = dynamic(() => import("@/components/marketing/HeroOrb").then((m) => m.HeroOrb), {
    ssr: true,
    loading: () => (_jsx("div", { className: "mx-auto aspect-square w-[min(72vw,320px)] max-w-sm animate-pulse rounded-full bg-[var(--z-surface-2)]" })),
});
const primaryCta = cn("inline-flex h-12 items-center justify-center gap-2 rounded-[var(--z-radius-md)] px-6 text-sm font-semibold transition-colors", "bg-[var(--z-accent)] text-black hover:bg-[color-mix(in_oklab,var(--z-accent),white_10%)]", focusRingClassName());
const secondaryCta = cn("inline-flex h-12 items-center justify-center gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-6 text-sm font-semibold transition-colors", "bg-[var(--z-surface)] text-[var(--z-fg)] hover:border-[var(--z-border-2)] hover:bg-[color-mix(in_oklab,var(--z-surface),white_4%)]", focusRingClassName());
const ghostCta = cn("inline-flex h-10 items-center justify-center rounded-[var(--z-radius-md)] px-4 text-sm font-semibold transition-colors", "text-[var(--z-accent)] hover:bg-white/5", focusRingClassName());
export default function MarketingHomePage() {
    return (_jsxs("div", { className: "space-y-[var(--z-space-16)]", children: [_jsxs("section", { className: "grid gap-[var(--z-space-10)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--z-accent)]", children: "Founder polish" }), _jsx("h1", { className: "mt-[var(--z-space-3)] text-4xl font-extrabold tracking-tight text-[var(--z-fg)] sm:text-5xl", children: "The operating system for serious music studios." }), _jsx("p", { className: "mt-[var(--z-space-4)] max-w-xl text-lg text-[color-mix(in_oklab,var(--z-fg),transparent_35%)]", children: "Lifecycle, billing, agents, and studio map \u2014 unified in a charcoal console with neon signal." }), _jsxs("div", { className: "mt-[var(--z-space-6)] flex flex-wrap gap-3", children: [_jsx(MarketingTrackedLink, { href: "/onboarding", eventName: "marketing_cta_onboarding_home", className: primaryCta, children: "Start onboarding" }), _jsx(MarketingTrackedLink, { href: "/dashboard", eventName: "marketing_cta_jump_app_home", className: secondaryCta, children: "Jump to app" })] })] }), _jsxs("div", { className: "flex flex-col items-center gap-[var(--z-space-6)]", children: [_jsx(HeroOrb, {}), _jsx(Card, { variant: "elevated", padding: "lg", radius: "lg", className: "w-full max-w-md border-[color-mix(in_oklab,var(--z-accent),transparent_70%)]", children: _jsxs("div", { className: "space-y-3 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_30%)]", children: [_jsx("p", { className: "font-semibold text-[var(--z-fg)]", children: "What ships today" }), _jsxs("ul", { className: "list-inside list-disc space-y-2", children: [_jsx("li", { children: "Guided onboarding + demo mode" }), _jsx("li", { children: "Command palette & global search" }), _jsx("li", { children: "Studio map & lifecycle intelligence" })] })] }) })] })] }), _jsx("section", { className: "grid gap-[var(--z-space-4)] sm:grid-cols-3", children: [
                    { t: "Lifecycle OS", d: "Intake → retention on one spine." },
                    { t: "Neon-grade UI", d: "Tokens, cards, and motion tuned for focus." },
                    { t: "Agent-native", d: "Automations with human-readable receipts." },
                ].map((f) => (_jsxs(Card, { variant: "outline", padding: "md", radius: "md", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: f.t }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: f.d })] }, f.t))) }), _jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-8)] text-center", children: [_jsx("h2", { className: "text-2xl font-extrabold text-[var(--z-fg)]", children: "Pricing that stays out of the way" }), _jsx("p", { className: "mx-auto mt-2 max-w-2xl text-sm text-[var(--z-muted)]", children: "Simple seat-based tiers \u2014 detailed on the pricing page. Start in onboarding to configure your studio shell." }), _jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-3", children: [_jsx(MarketingTrackedLink, { href: "/pricing", eventName: "marketing_cta_pricing_home", className: primaryCta, children: "View pricing" }), _jsx(MarketingTrackedLink, { href: "/onboarding", eventName: "marketing_cta_begin_setup_home", className: ghostCta, children: "Begin setup" })] })] })] }));
}
