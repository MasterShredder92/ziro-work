"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Banknote, CalendarClock, ChevronUp, Sparkles, Tag, } from "lucide-react";
import { DashboardMetricCard } from "./DashboardMetricCard";
import { formatUsdFromCents } from "./dashboardFormat";
export function DashboardMetricsBar() {
    const [metrics, setMetrics] = useState(null);
    useEffect(() => {
        fetch("/api/invoices/billing-summary", { cache: "no-store" })
            .then((r) => r.json())
            .then((json) => {
            var _a, _b, _c, _d, _e, _f;
            const all = (_a = json === null || json === void 0 ? void 0 : json.data) === null || _a === void 0 ? void 0 : _a.allSchools;
            if (!all)
                return;
            setMetrics({
                collected: (_b = all.collected) !== null && _b !== void 0 ? _b : 0,
                totalInvoiced: (_c = all.totalInvoiced) !== null && _c !== void 0 ? _c : 0,
                outstanding: (_d = all.outstanding) !== null && _d !== void 0 ? _d : 0,
                nextMonthProjected: (_e = all.nextMonthProjected) !== null && _e !== void 0 ? _e : 0,
                scheduled: (_f = all.scheduled) !== null && _f !== void 0 ? _f : 0,
            });
        })
            .catch(() => null);
    }, []);
    return (_jsxs("section", { className: "flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible xl:grid-cols-5", children: [_jsx(DashboardMetricCard, { label: "Collected This Month", value: metrics ? formatUsdFromCents(metrics.collected) : "—", trend: metrics && metrics.collected > 0 ? "up" : "flat", icon: _jsx(Sparkles, { className: "h-4 w-4", "aria-hidden": true }) }), _jsx(DashboardMetricCard, { label: "Total Invoiced", value: metrics ? formatUsdFromCents(metrics.totalInvoiced) : "—", trend: metrics && metrics.totalInvoiced > 0 ? "up" : "flat", icon: _jsx(Banknote, { className: "h-4 w-4", "aria-hidden": true }) }), _jsx(DashboardMetricCard, { label: "Outstanding", value: metrics ? formatUsdFromCents(metrics.outstanding) : "—", trend: metrics && metrics.outstanding > 0 ? "down" : "flat", valueClassName: "text-red-500", icon: _jsx(Tag, { className: "h-4 w-4", "aria-hidden": true }) }), _jsx(DashboardMetricCard, { label: "Next Month Projected", value: metrics ? formatUsdFromCents(metrics.nextMonthProjected) : "—", trend: "up", icon: _jsx(ChevronUp, { className: "h-4 w-4", "aria-hidden": true }) }), _jsx(DashboardMetricCard, { label: "Scheduled Payments", value: metrics ? formatUsdFromCents(metrics.scheduled) : "—", trend: "flat", icon: _jsx(CalendarClock, { className: "h-4 w-4", "aria-hidden": true }) })] }));
}
