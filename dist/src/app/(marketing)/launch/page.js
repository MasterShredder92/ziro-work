import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { HeroOrb } from "@/components/marketing/HeroOrb";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { cn, focusRingClassName } from "@/components/ui/utils";
const desc = "Introducing ZiroWork—public launch with charcoal console polish, studio map depth, and lifecycle clarity for operators.";
export const metadata = mergePageMetadata({
    title: "Launch",
    description: desc,
    openGraph: {
        title: "Introducing ZiroWork",
        description: desc,
        url: `${siteBaseUrl()}/launch`,
    },
    twitter: { title: "Introducing ZiroWork", description: desc },
});
const primaryCta = cn("inline-flex h-11 items-center justify-center rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-6 text-sm font-semibold text-black transition-colors hover:bg-[color-mix(in_oklab,var(--z-accent),white_10%)]", focusRingClassName());
const ghostCta = cn("inline-flex h-11 items-center justify-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-6 text-sm font-semibold text-[var(--z-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] hover:text-[var(--z-accent)]", focusRingClassName());
export default function LaunchPage() {
    return (_jsxs("div", { className: "space-y-[var(--z-space-12)]", children: [_jsxs("section", { className: "grid items-center gap-[var(--z-space-10)] lg:grid-cols-[1.05fr_0.95fr]", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--z-accent)]", children: "Public launch" }), _jsx("h1", { className: "mt-3 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--z-fg)] sm:text-5xl", children: "Introducing ZiroWork" }), _jsx("p", { className: "mt-4 max-w-xl text-base leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_22%)] sm:text-lg", children: "The operating layer for studios that outgrew spreadsheets\u2014lifecycle spine, studio map, billing signals, and neon-grade UI in one charcoal console." }), _jsxs("div", { className: "mt-8 flex flex-wrap gap-3", children: [_jsx(Link, { href: "/signup", className: primaryCta, children: "Create workspace" }), _jsx(Link, { href: "/press-kit", className: ghostCta, children: "Press kit" })] })] }), _jsx("div", { className: "flex justify-center lg:justify-end", children: _jsx(HeroOrb, {}) })] }), _jsx(Section, { title: "What's new", accent: true, spacing: "loose", children: _jsx("div", { className: "grid gap-[var(--z-space-4)] md:grid-cols-3", children: [
                        { t: "Studio Map", d: "Orb-first roster view with drill-ins that stay on the map." },
                        { t: "Settings spine", d: "Tenant-aware panels with consistent charcoal + neon chrome." },
                        { t: "Student depth", d: "Invoices, schedule, and risk cards on a single profile runway." },
                    ].map((x) => (_jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: x.t }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: x.d })] }, x.t))) }) }), _jsx(Section, { title: "Why it matters", description: "Operators need receipts, not noise\u2014every surface answers a job to be done.", accent: true, children: _jsx(Card, { variant: "default", padding: "lg", radius: "lg", className: "max-w-3xl text-sm leading-relaxed text-[var(--z-muted)]", children: "Launch quality means predictable hierarchy: charcoal fields, neon only where it signals action, and motion that respects focus. ZiroWork keeps teachers, directors, and finance on the same timeline without losing the studio voice." }) }), _jsx(Section, { title: "Feature highlights", accent: true, children: _jsx("div", { className: "grid gap-[var(--z-space-4)] sm:grid-cols-2", children: ["Lifecycle stages with receipts", "Command palette + palette search", "Billing posture warnings", "Agent-ready automations"].map((line) => (_jsx(Card, { variant: "outline", padding: "md", radius: "md", className: "text-sm font-semibold text-[var(--z-fg)]", children: line }, line))) }) }), _jsx(Section, { title: "Ship with us", description: "Spin up a workspace or share the launch story with your team.", accent: true, children: _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx(Link, { href: "/signup", className: primaryCta, children: "Go to signup" }), _jsx(Link, { href: "/features", className: ghostCta, children: "Explore features" })] }) })] }));
}
