import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { mergePageMetadata, siteBaseUrl } from "@/lib/seo/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LogoShowcase } from "@/components/brand/LogoShowcase";
const desc = "How to use the ZiroWork mark—clear space, color tokens, and do / don't patterns for partners and press.";
export const metadata = mergePageMetadata({
    title: "Brand",
    description: desc,
    openGraph: {
        title: "Brand · ZiroWork",
        description: desc,
        url: `${siteBaseUrl()}/brand`,
    },
    twitter: { title: "Brand · ZiroWork", description: desc },
});
const tokens = [
    { token: "--z-bg", usage: "Canvas / app background" },
    { token: "--z-fg", usage: "Primary text" },
    { token: "--z-surface", usage: "Raised panels" },
    { token: "--z-surface-2", usage: "Nested chrome" },
    { token: "--z-border", usage: "Default hairlines" },
    { token: "--z-accent", usage: "Primary action + neon signal" },
    { token: "--z-muted", usage: "Secondary labels" },
    { token: "--z-danger", usage: "Destructive + risk" },
];
export default function BrandPage() {
    return (_jsxs("div", { className: "space-y-[var(--z-space-12)]", children: [_jsx(PageHeader, { title: "Brand", subtitle: "Guidelines for the charcoal console and neon signal system." }), _jsx(Section, { title: "Logo usage", description: "Prefer the dark tile on charcoal marketing; use light tile on photography.", accent: true, children: _jsxs("div", { className: "grid gap-[var(--z-space-4)] lg:grid-cols-2", children: [_jsxs(Card, { variant: "default", padding: "lg", radius: "lg", className: "space-y-3", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: "Lockup" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Keep the mark and wordmark together; do not stretch or recolor outside approved tokens." }), _jsx(LogoShowcase, { variant: "dark" })] }), _jsxs(Card, { variant: "default", padding: "lg", radius: "lg", className: "space-y-3", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: "Minimum legibility" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "At small sizes, rely on the simplified mark with increased padding inside the frame." }), _jsx("div", { className: "max-w-[200px]", children: _jsx(LogoShowcase, { variant: "mono" }) })] })] }) }), _jsx(Section, { title: "Clear space", description: "Maintain breathing room equal to the height of the \u201CO\u201D in WORK.", accent: true, children: _jsx(Card, { variant: "elevated", padding: "lg", radius: "lg", className: "flex justify-center", children: _jsxs("div", { className: "relative inline-block p-[clamp(1.5rem,4vw,3rem)]", children: [_jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-0 rounded-[var(--z-radius-lg)] border border-dashed border-[color-mix(in_oklab,var(--z-accent),transparent_45%)]" }), _jsx("div", { className: "max-w-xs", children: _jsx(LogoShowcase, { variant: "dark" }) })] }) }) }), _jsx(Section, { title: "Color tokens", description: "Reference table for design partners (values resolve at runtime).", accent: true, children: _jsx(Card, { variant: "outline", padding: "none", radius: "lg", className: "overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full min-w-[520px] text-left text-sm", children: [_jsx("thead", { className: "border-b border-[var(--z-border)] bg-[var(--z-surface-2)] text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3", children: "Token" }), _jsx("th", { className: "px-4 py-3", children: "Usage" })] }) }), _jsx("tbody", { children: tokens.map((row) => (_jsxs("tr", { className: "border-b border-[var(--z-border)] last:border-0", children: [_jsx("td", { className: "px-4 py-3 font-mono text-xs text-[var(--z-accent)]", children: row.token }), _jsx("td", { className: "px-4 py-3 text-[var(--z-muted)]", children: row.usage })] }, row.token))) })] }) }) }) }), _jsx(Section, { title: "Do / Don't", description: "UI-only examples for decks and partner reviews.", accent: true, children: _jsxs("div", { className: "grid gap-[var(--z-space-4)] md:grid-cols-2", children: [_jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", className: "border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]", children: [_jsx("div", { className: "text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-accent)]", children: "Do" }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Charcoal field, neon border, restrained copy hierarchy." }), _jsx("div", { className: "mt-4", children: _jsx(LogoShowcase, { variant: "dark" }) })] }), _jsxs(Card, { variant: "default", padding: "md", radius: "lg", className: "opacity-80", children: [_jsx("div", { className: "text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-danger)]", children: "Don't" }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Rainbow gradients behind the mark, drop shadows on neon, or low-contrast text." }), _jsx("div", { className: "mt-4 rounded-[var(--z-radius-md)] p-4", style: {
                                        background: "linear-gradient(125deg, color-mix(in oklab, var(--z-danger), transparent 10%), color-mix(in oklab, var(--z-accent), white 25%), color-mix(in oklab, var(--z-warning), transparent 5%))",
                                    }, children: _jsx(LogoShowcase, { variant: "light", className: "border-[color-mix(in_oklab,white,transparent_55%)]" }) })] })] }) }), _jsx(Section, { title: "Downloads", description: "Buttons are UI-only\u2014wire CDN or export jobs when assets ship.", accent: true, children: _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx(Button, { type: "button", variant: "primary", size: "md", children: "Logo pack" }), _jsx(Button, { type: "button", variant: "secondary", size: "md", children: "Color palette" }), _jsx(Button, { type: "button", variant: "ghost", size: "md", children: "Press kit bundle" })] }) })] }));
}
