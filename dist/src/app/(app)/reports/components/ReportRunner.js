"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useState } from "react";
import { ReportParameterForm } from "./ReportParameterForm";
import { ReportResultTable } from "./ReportResultTable";
import { ReportResultChart } from "./ReportResultChart";
function formatSummaryValue(value, format) {
    if (format === "currency" && typeof value === "number") {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(value / 100);
    }
    if (format === "percent" && typeof value === "number") {
        return `${Math.round(value)}%`;
    }
    if (format === "number" && typeof value === "number") {
        return new Intl.NumberFormat("en-US").format(value);
    }
    return String(value);
}
export function ReportRunner({ definition, tenantId, initialParams = {}, }) {
    const [values, setValues] = useState(() => {
        const defaults = Object.assign({}, initialParams);
        for (const p of definition.parameters) {
            if (defaults[p.key] === undefined && p.defaultValue !== undefined) {
                defaults[p.key] = p.defaultValue;
            }
        }
        return defaults;
    });
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const handleChange = useCallback((key, value) => {
        setValues((prev) => (Object.assign(Object.assign({}, prev), { [key]: value })));
    }, []);
    const handleSubmit = useCallback(async () => {
        var _a;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/reports/api/run", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-tenant-id": tenantId,
                },
                body: JSON.stringify({
                    reportId: definition.id,
                    params: values,
                }),
            });
            const json = (await res.json().catch(() => null));
            if (!res.ok || !json || !json.data) {
                const message = (_a = json === null || json === void 0 ? void 0 : json.error) !== null && _a !== void 0 ? _a : `Request failed (${res.status})`;
                setError(message);
                setResult(null);
            }
            else {
                setResult(json.data);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setResult(null);
        }
        finally {
            setSubmitting(false);
        }
    }, [definition.id, tenantId, values]);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(ReportParameterForm, { parameters: definition.parameters, values: values, onChange: handleChange, onSubmit: handleSubmit, submitting: submitting }), error ? (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300", children: error })) : null, result ? (_jsxs(_Fragment, { children: [result.summary.length > 0 ? (_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: result.summary.map((m) => (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: m.label }), _jsx("div", { className: "mt-1 text-xl font-semibold text-[var(--z-fg)]", children: formatSummaryValue(m.value, m.format) }), m.sublabel ? (_jsx("div", { className: "mt-1 text-[11px] text-[var(--z-muted)]", children: m.sublabel })) : null] }, m.key))) })) : null, result.chart ? (_jsx(ReportResultChart, { chart: result.chart })) : null, _jsx(ReportResultTable, { result: result })] })) : null] }));
}
