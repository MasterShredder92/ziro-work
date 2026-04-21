import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "./utils/cn";
import { TopNav } from "./TopNav";
export function Layout({ children, nav = {}, footer, className }) {
    return (_jsxs("div", { className: cn("min-h-dvh bg-[var(--z-bg)] text-[var(--z-fg)]", className), children: [nav === null ? null : _jsx(TopNav, Object.assign({}, nav)), _jsx("main", { className: "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8", children: children }), footer ? (_jsx("footer", { className: "border-t border-[var(--z-border)]", children: _jsx("div", { className: "mx-auto max-w-6xl px-4 py-6 sm:px-6", children: footer }) })) : null] }));
}
