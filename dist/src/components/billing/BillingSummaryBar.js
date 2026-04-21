"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
function fmt(cents) {
    if (!cents)
        return "$0";
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function MetricRow({ label, value, color }) {
    return (_jsxs("div", { className: "flex items-center justify-between py-1.5", children: [_jsx("span", { className: "text-xs text-[#909098]", children: label }), _jsx("span", { className: "text-sm font-semibold", style: { color: color !== null && color !== void 0 ? color : "white" }, children: value })] }));
}
function MetricsCard({ m }) {
    return (_jsxs("div", { className: "w-full sm:w-auto rounded-xl border bg-[#0a0a0c] p-4 sm:min-w-[220px]", style: { borderColor: `${m.color}33` }, children: [_jsxs("div", { className: "mb-3 flex items-center gap-2", children: [_jsx("div", { className: "h-2 w-2 rounded-full", style: { backgroundColor: m.color } }), _jsx("span", { className: "text-sm font-bold text-white", children: m.locationName })] }), _jsxs("div", { className: "divide-y divide-[#1c1c1e]", children: [_jsx(MetricRow, { label: "Collected This Month", value: fmt(m.collectedThisMonth), color: "#22C55E" }), _jsx(MetricRow, { label: "Total Invoiced This Month", value: fmt(m.totalInvoicedThisMonth) }), _jsx(MetricRow, { label: "Discounted This Month", value: fmt(m.discountedThisMonth), color: "#F59E0B" }), _jsx(MetricRow, { label: "Next Month (Projected)", value: fmt(m.nextMonthProjected), color: "#0EA5E9" }), _jsx(MetricRow, { label: "Scheduled Payments", value: fmt(m.scheduledPayments), color: "#A78BFA" })] })] }));
}
export function BillingSummaryBar({ metrics }) {
    const [activeTab, setActiveTab] = useState(null);
    const allSchools = metrics.find((m) => m.locationId === null);
    const locations = metrics.filter((m) => m.locationId !== null);
    const tabs = [
        { id: null, label: "All Locations", color: "#00ff88" },
        ...locations.map((l) => ({ id: l.locationId, label: l.locationName, color: l.color })),
    ];
    const visible = activeTab === null
        ? [allSchools, ...locations].filter(Boolean)
        : locations.filter((l) => l.locationId === activeTab);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex flex-wrap gap-2", children: tabs.map((t) => {
                    var _a;
                    return (_jsx("button", { onClick: () => setActiveTab(t.id), className: "rounded-full border px-3 py-1 text-xs font-semibold transition-all", style: {
                            borderColor: activeTab === t.id ? t.color : "#2a2a2e",
                            background: activeTab === t.id ? `${t.color}22` : "#0a0a0c",
                            color: activeTab === t.id ? t.color : "#909098",
                        }, children: t.label }, (_a = t.id) !== null && _a !== void 0 ? _a : "all"));
                }) }), _jsx("div", { className: "flex flex-wrap gap-4", children: visible.map((m) => {
                    var _a;
                    return (_jsx(MetricsCard, { m: m }, (_a = m.locationId) !== null && _a !== void 0 ? _a : "all"));
                }) })] }));
}
