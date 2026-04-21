import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "../PageHeader";
import { Card } from "../Card";
import { Body, Caption } from "../../premium/Typography";
function FauxButton({ children }) {
    return (_jsx("button", { type: "button", className: "inline-flex items-center justify-center rounded-md border border-[var(--z-border)] px-3 py-1.5 text-sm font-medium tracking-[-0.01em] text-[var(--z-fg)] hover:bg-[color-mix(in_oklab,var(--z-fg),transparent_92%)]", children: children }));
}
export function PageHeaderSandbox() {
    return (_jsxs("div", { className: "flex flex-col gap-8", children: [_jsx(PageHeader, { title: "Premium primitives", subtitle: "Minimal charcoal foundation with neon accents.", actions: _jsxs(_Fragment, { children: [_jsx(FauxButton, { children: "Secondary" }), _jsx(FauxButton, { children: _jsx("span", { className: "text-[var(--z-accent)]", children: "Primary" }) })] }) }), _jsxs(Card, { children: [_jsx(Body, { className: "font-medium", children: "Content below" }), _jsx(Caption, { className: "mt-2", children: "The header stays purely visual: title/subtitle/actions. No business logic." })] })] }));
}
