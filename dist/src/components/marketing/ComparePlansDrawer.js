"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";
const PLANS = [
    {
        id: "launch",
        name: "Launch",
        price: "$49",
        cadence: "/mo",
        blurb: "Solo director + one location.",
        features: ["Lifecycle engine", "Studio map", "Dashboard + feed", "Email support"],
    },
    {
        id: "scale",
        name: "Scale",
        price: "$129",
        cadence: "/mo",
        blurb: "Growing faculty + automations.",
        features: ["Everything in Launch", "Automations", "Command palette", "Priority support"],
    },
    {
        id: "command",
        name: "Command",
        price: "Custom",
        cadence: "",
        blurb: "Multi-site + API + white-glove.",
        features: ["Everything in Scale", "Dedicated success", "Custom integrations", "SLA"],
    },
];
export function ComparePlansDrawer({ open, onClose }) {
    const router = useRouter();
    const { trackEvent } = useAnalytics();
    return (_jsx(Drawer, { open: open, onClose: onClose, title: "Compare plans", children: _jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Pick the tier that matches your roster density. Calculator lives on the pricing page." }), _jsx("div", { className: "space-y-[var(--z-space-5)]", children: PLANS.map((p) => (_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-[var(--z-space-4)]", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: p.name }), p.id === "scale" ? (_jsx(Badge, { variant: "success", active: true, children: "Popular" })) : null] }), _jsx("p", { className: "mt-1 text-xs text-[var(--z-muted)]", children: p.blurb })] }), _jsx("div", { className: "text-right", children: _jsxs("div", { className: "text-lg font-extrabold text-[var(--z-accent)]", children: [p.price, _jsx("span", { className: "text-xs font-semibold text-[var(--z-muted)]", children: p.cadence })] }) })] }), _jsx("ul", { className: "mt-3 space-y-1.5 text-xs text-[color-mix(in_oklab,var(--z-fg),transparent_30%)]", children: p.features.map((f) => (_jsxs("li", { children: ["\u00B7 ", f] }, f))) }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [_jsx(Button, { type: "button", variant: "primary", size: "sm", className: "flex-1 sm:flex-none", onClick: () => {
                                            trackEvent("compare_drawer_start_trial", { plan: p.id });
                                            onClose();
                                            router.push("/signup");
                                        }, children: "Start trial" }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => {
                                            trackEvent("compare_drawer_pricing", { plan: p.id });
                                            onClose();
                                            router.push("/pricing");
                                        }, children: "Pricing" })] })] }, p.id))) }), _jsx(Button, { type: "button", variant: "secondary", size: "md", className: "w-full", onClick: () => {
                        trackEvent("compare_drawer_demo", {});
                        onClose();
                        router.push("/demo");
                    }, children: "Try interactive demo" })] }) }));
}
