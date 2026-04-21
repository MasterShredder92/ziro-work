"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
const STORAGE_KEY = "ziro.cookieConsent";
export function CookieBanner({ className, honorStoredConsent = true, position = "fixed", }) {
    const [visible, setVisible] = React.useState(() => honorStoredConsent === false);
    React.useEffect(() => {
        if (!honorStoredConsent)
            return;
        try {
            const v = localStorage.getItem(STORAGE_KEY);
            setVisible(v !== "accepted" && v !== "declined");
        }
        catch (_a) {
            setVisible(true);
        }
    }, [honorStoredConsent]);
    const persist = React.useCallback((value) => {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        }
        catch (_a) {
            /* ignore */
        }
        setVisible(false);
    }, []);
    if (!visible)
        return null;
    return (_jsx("div", { className: cn(position === "fixed"
            ? "pointer-events-none fixed inset-x-0 bottom-0 z-[55] px-[var(--z-space-3)] pb-[var(--z-space-3)] sm:px-[var(--z-space-5)]"
            : "relative z-[1] mx-auto mt-[var(--z-space-6)] w-full max-w-4xl px-0", className), children: _jsxs("div", { className: cn("pointer-events-auto mx-auto flex max-w-4xl flex-col gap-[var(--z-space-3)] rounded-[var(--z-radius-lg)] border border-[color-mix(in_oklab,var(--z-accent),transparent_45%)]", "bg-[color-mix(in_oklab,var(--z-surface-2),var(--z-accent)_8%)] p-[var(--z-space-4)] shadow-[0_-8px_40px_rgba(0,0,0,0.55)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"), role: "dialog", "aria-label": "Cookie preferences", children: [_jsx("p", { className: "text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]", children: "We use first-party cookies for session + preferences. Analytics events are mocked in the console until you wire a provider." }), _jsxs("div", { className: "flex shrink-0 flex-wrap gap-2", children: [_jsx(Button, { type: "button", variant: "primary", size: "sm", onClick: () => persist("accepted"), children: "Accept" }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => persist("declined"), children: "Decline" })] })] }) }));
}
