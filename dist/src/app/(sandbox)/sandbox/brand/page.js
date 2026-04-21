import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { LogoShowcase } from "@/components/brand/LogoShowcase";
import { ColorSwatch } from "@/components/brand/ColorSwatch";
import { SocialPreviewCard } from "@/components/brand/SocialPreviewCard";
export default function SandboxBrandPage() {
    return (_jsxs("div", { className: "space-y-[var(--z-space-10)]", children: [_jsx(PageHeader, { title: "Sandbox \u00B7 Brand", subtitle: "LogoShowcase, ColorSwatch, and SocialPreviewCard QA." }), _jsx(Section, { title: "LogoShowcase", accent: true, children: _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsx(LogoShowcase, { variant: "light" }), _jsx(LogoShowcase, { variant: "dark" }), _jsx(LogoShowcase, { variant: "mono" })] }) }), _jsx(Section, { title: "ColorSwatch", accent: true, children: _jsxs("div", { className: "grid max-w-lg gap-4 sm:grid-cols-2", children: [_jsx(ColorSwatch, { name: "Accent", value: "var(--z-accent)" }), _jsx(ColorSwatch, { name: "Surface", value: "var(--z-surface)" })] }) }), _jsx(Section, { title: "SocialPreviewCard", accent: true, children: _jsx(SocialPreviewCard, { title: "Sandbox preview", subtitle: "Scaled inside the sandbox shell for responsive checks." }) })] }));
}
