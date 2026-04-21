import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function LocationsShell({ sidebar, children }) {
    return (_jsxs("div", { className: "mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1400px] overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] shadow-sm", children: [_jsx("div", { className: "hidden w-72 shrink-0 md:flex", children: sidebar }), _jsx("section", { className: "flex min-w-0 flex-1 flex-col overflow-auto", children: _jsx("div", { className: "mx-auto w-full max-w-5xl px-4 py-6 sm:px-6", children: children }) })] }));
}
