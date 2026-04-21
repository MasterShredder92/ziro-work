"use client";
var _a;
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
const PORTAL = (_a = process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL) !== null && _a !== void 0 ? _a : "";
export function StripePortalButton({ label = "Open billing portal", className }) {
    const disabled = !PORTAL.trim();
    return (_jsxs(Button, { type: "button", variant: "primary", disabled: disabled, title: disabled ? "Set NEXT_PUBLIC_STRIPE_PORTAL_URL to enable the customer portal." : undefined, className: cn("shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent-color),transparent_55%),0_0_18px_color-mix(in_oklab,var(--z-accent-color),transparent_75%)]", className), onClick: () => {
            if (!PORTAL.trim())
                return;
            window.open(PORTAL.trim(), "_blank", "noopener,noreferrer");
        }, children: [_jsx(ExternalLink, { className: "h-4 w-4", "aria-hidden": true }), label] }));
}
