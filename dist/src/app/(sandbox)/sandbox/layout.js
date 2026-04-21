import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
export default function SandboxLayout({ children }) {
    return (_jsxs("div", { className: "min-h-screen bg-[var(--z-bg)] text-[var(--z-fg)]", children: [_jsx("div", { className: "border-b border-[var(--z-border)] bg-[var(--z-surface-2)]", children: _jsxs("div", { className: "mx-auto max-w-5xl px-[var(--z-space-6)] py-[var(--z-space-4)] flex items-center justify-between", children: [_jsxs("div", { className: "text-sm font-extrabold tracking-tight", children: [_jsx("span", { className: "text-[var(--z-accent)]", children: "Sandbox" }), _jsx("span", { className: "text-[var(--z-muted)]", children: " / UI" })] }), _jsx(Link, { href: "/dashboard", className: "text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "Back to app" })] }) }), _jsx("div", { className: "mx-auto max-w-5xl px-[var(--z-space-6)] py-[var(--z-space-6)]", children: children })] }));
}
