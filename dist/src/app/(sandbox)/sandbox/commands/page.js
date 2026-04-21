"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { CommandPalette } from "@/components/command/CommandPalette";
export default function SandboxCommandsPage() {
    var _a;
    const [open, setOpen] = React.useState(true);
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-lg font-extrabold text-[var(--z-fg)]", children: "Command palette" }), _jsx("p", { className: "mt-1 text-sm text-[var(--z-muted)]", children: "Visual QA for tabbed command center. Toggle with the button or your global \u2318K / Ctrl+K shortcut when the app shell is mounted." })] }), _jsx("button", { type: "button", onClick: () => setOpen(true), className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-2 text-sm font-semibold text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]", children: "Open command palette" }), _jsx(CommandPalette, { open: open, onClose: () => setOpen(false), tenantId: (_a = process.env.NEXT_PUBLIC_ZIRO_DEFAULT_TENANT_ID) !== null && _a !== void 0 ? _a : "" })] }));
}
