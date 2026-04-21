"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
export function AnnouncementModal({ open, title, description, onClose }) {
    const router = useRouter();
    return (_jsx(Modal, { open: open, onClose: onClose, title: title, panelClassName: "max-w-md", children: _jsxs("div", { className: "space-y-[var(--z-space-4)] px-[var(--z-space-5)] py-[var(--z-space-4)]", children: [_jsx("p", { className: "text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]", children: description }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { type: "button", variant: "primary", size: "sm", onClick: () => {
                                onClose();
                                router.push("/docs/changelog");
                            }, children: "What's New" }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: onClose, children: "Close" })] })] }) }));
}
