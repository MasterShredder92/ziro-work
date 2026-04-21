"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
/** Visual QA for the same copy/actions as production ExitIntentModal (without viewport trigger). */
export default function SandboxExitIntentPage() {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-lg font-extrabold text-[var(--z-fg)]", children: "Exit intent (preview)" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Production modal fires on desktop pointer leaving the top edge of the viewport. Here, open it manually." }), _jsx(Button, { type: "button", variant: "primary", onClick: () => setOpen(true), children: "Open exit modal" }), _jsxs(Modal, { open: open, onClose: () => setOpen(false), title: "Before you go", children: [_jsx("p", { className: "text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_35%)]", children: "Spin up the charcoal console with seeded data, or jump straight into pricing." }), _jsxs("div", { className: "mt-[var(--z-space-5)] flex flex-col gap-[var(--z-space-3)]", children: [_jsx(Button, { type: "button", variant: "primary", size: "md", className: "w-full", onClick: () => {
                                    setOpen(false);
                                    router.push("/demo");
                                }, children: "Try Demo" }), _jsx(Button, { type: "button", variant: "secondary", size: "md", className: "w-full", onClick: () => {
                                    setOpen(false);
                                    router.push("/pricing");
                                }, children: "See pricing" }), _jsx(Button, { type: "button", variant: "ghost", size: "md", className: "w-full", onClick: () => {
                                    setOpen(false);
                                    router.push("/signup");
                                }, children: "Start free trial" })] })] })] }));
}
