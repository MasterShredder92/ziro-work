import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function MessagingShell({ sidebar, conversation, composer, }) {
    return (_jsxs("div", { className: "mx-auto flex h-[calc(100vh-4rem)] w-full max-w-7xl overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] shadow-sm", children: [_jsx("div", { className: "hidden w-80 shrink-0 md:flex", children: sidebar }), _jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [_jsx("div", { className: "flex min-h-0 flex-1 flex-col overflow-hidden", children: conversation }), composer] })] }));
}
