"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";
export function PricingCalculator() {
    const { trackEvent } = useAnalytics();
    const [seats, setSeats] = React.useState(12);
    React.useEffect(() => {
        trackEvent("pricing_calculator_view", { seats: 12 });
    }, [trackEvent]);
    return (_jsxs(Card, { variant: "elevated", padding: "md", radius: "lg", shadow: "sm", className: "space-y-[var(--z-space-4)]", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: "Seat calculator" }), _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "Drag to model roster load\u2014numbers are illustrative." }), _jsx(Slider, { label: "Seats", min: 1, max: 80, step: 1, value: seats, onValueChange: (v) => {
                    setSeats(Math.round(v));
                    trackEvent("pricing_calculator_change", { seats: Math.round(v) });
                } }), _jsxs("div", { className: "text-xs font-semibold text-[var(--z-accent)]", children: ["Modeled monthly: $", (49 + Math.max(0, seats - 5) * 4).toLocaleString(), " (mock)"] })] }));
}
