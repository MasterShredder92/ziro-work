"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { HeroOrb } from "@/components/marketing/HeroOrb";
import { cn } from "@/components/ui/utils";
/**
 * Static-style share preview (1200×630 canvas) for /og/* QA routes — UI only.
 */
export function SocialPreviewCard({ title, subtitle, className }) {
    return (_jsxs("div", { className: cn("relative aspect-[1200/630] w-full max-w-[1200px] overflow-hidden rounded-[var(--z-radius-lg)] border-2 border-[color-mix(in_oklab,var(--z-accent),transparent_35%)] bg-[var(--z-bg)] shadow-[0_24px_80px_-40px_rgba(0,0,0,0.85)]", className), children: [_jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,color-mix(in_oklab,var(--z-accent),transparent_82%),transparent_52%),radial-gradient(circle_at_88%_12%,color-mix(in_oklab,var(--z-accent),transparent_88%),transparent_45%)]" }), _jsx("div", { className: "pointer-events-none absolute -right-[8%] top-1/2 w-[min(48%,420px)] -translate-y-1/2 opacity-90", children: _jsx(HeroOrb, {}) }), _jsxs("div", { className: "relative z-[1] flex h-full flex-col justify-center px-[clamp(1.5rem,4vw,3.5rem)] py-[clamp(1.25rem,3vw,2.5rem)] sm:max-w-[62%]", children: [_jsx("div", { className: "text-[clamp(0.65rem,1.4vw,0.75rem)] font-extrabold tracking-[0.22em] text-[var(--z-accent)]", children: "ZIROWORK" }), _jsx("h1", { className: "mt-[clamp(0.5rem,1.5vw,1rem)] text-[clamp(1.35rem,4.2vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--z-fg)]", children: title }), _jsx("p", { className: "mt-[clamp(0.35rem,1.2vw,0.75rem)] text-[clamp(0.85rem,2vw,1.2rem)] leading-snug text-[color-mix(in_oklab,var(--z-fg),transparent_28%)]", children: subtitle })] })] }));
}
