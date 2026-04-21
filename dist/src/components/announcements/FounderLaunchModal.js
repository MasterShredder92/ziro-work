"use client";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/system/PageTransition";
export function FounderLaunchModal({ open, version, highlights, onAcknowledge }) {
    const router = useRouter();
    const go = React.useCallback((href) => {
        onAcknowledge();
        router.push(href);
    }, [onAcknowledge, router]);
    return (_jsx(Modal, { open: open, onClose: onAcknowledge, title: `ZiroWork ${version} · Founder note`, panelClassName: "max-w-lg border border-[color-mix(in_oklab,var(--z-accent),transparent_38%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_88%),0_30px_90px_-40px_rgba(0,0,0,0.85)]", children: _jsx(PageTransition, { children: _jsxs("div", { className: "space-y-[var(--z-space-4)] border-l-2 border-[color-mix(in_oklab,var(--z-accent),transparent_22%)] pl-[var(--z-space-4)]", children: [_jsxs("p", { className: "text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_14%)]", children: ["ZiroWork ", version, " is our public launch cut\u2014charcoal console, neon signal, and the same discipline we use running studios every week. Thank you for riding along while we hardened the spine."] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--z-accent)]", children: "What's new" }), _jsx("ul", { className: "mt-2 list-disc space-y-1.5 pl-4 text-sm text-[var(--z-muted)]", children: highlights.map((h) => (_jsx("li", { children: h }, h))) })] }), _jsxs("div", { className: "flex flex-wrap gap-2 pt-1", children: [_jsx(Button, { type: "button", variant: "primary", size: "sm", onClick: () => go("/launch"), children: "See Launch Page" }), _jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: () => go("/help"), children: "Start Tour" }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: onAcknowledge, children: "Close" })] })] }) }) }));
}
