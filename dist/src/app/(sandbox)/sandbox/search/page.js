"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { GlobalSearch } from "@/components/search/GlobalSearch";
export default function SandboxSearchPage() {
    var _a;
    const [open, setOpen] = React.useState(true);
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-lg font-extrabold text-[var(--z-fg)]", children: "Global search" }), _jsxs("p", { className: "mt-1 text-sm text-[var(--z-muted)]", children: ["Visual QA for charcoal + neon search shell. Uses live hooks when", " ", _jsx("code", { className: "text-[var(--z-accent)]", children: "NEXT_PUBLIC_ZIRO_DEFAULT_TENANT_ID" }), " is set."] })] }), _jsx("button", { type: "button", onClick: () => setOpen(true), className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-2 text-sm font-semibold text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]", children: "Open search modal" }), _jsx(Modal, { open: open, onClose: () => setOpen(false), title: "Search", panelClassName: "max-w-2xl", children: _jsx(GlobalSearch, { tenantId: (_a = process.env.NEXT_PUBLIC_ZIRO_DEFAULT_TENANT_ID) !== null && _a !== void 0 ? _a : "", onClose: () => setOpen(false) }) })] }));
}
