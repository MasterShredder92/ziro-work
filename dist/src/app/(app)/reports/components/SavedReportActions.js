"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function SavedReportActions({ report, tenantId }) {
    const router = useRouter();
    const [busy, setBusy] = useState(null);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const onExport = async (format) => {
        var _a, _b;
        setBusy(format);
        setError(null);
        setMessage(null);
        try {
            const res = await fetch(`/reports/api/catalog/${report.id}/export?tenantId=${tenantId}`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-tenant-id": tenantId,
                },
                body: JSON.stringify({ format }),
            });
            const json = await res.json();
            if (!res.ok)
                throw new Error((_a = json === null || json === void 0 ? void 0 : json.error) !== null && _a !== void 0 ? _a : "Export failed");
            const jobId = (_b = json === null || json === void 0 ? void 0 : json.data) === null || _b === void 0 ? void 0 : _b.id;
            if (jobId) {
                const downloadUrl = `/reports/api/exports/${jobId}?tenantId=${tenantId}&download=1`;
                setMessage(`Export ready — ${format.toUpperCase()}.`);
                window.open(downloadUrl, "_blank");
            }
            else {
                setMessage("Export queued.");
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Export failed");
        }
        finally {
            setBusy(null);
        }
    };
    const onDelete = async () => {
        var _a;
        if (!window.confirm(`Delete "${report.name}"?`))
            return;
        setBusy("delete");
        setError(null);
        try {
            const res = await fetch(`/reports/api/catalog/${report.id}?tenantId=${tenantId}`, {
                method: "DELETE",
                headers: { "x-tenant-id": tenantId },
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error((_a = json === null || json === void 0 ? void 0 : json.error) !== null && _a !== void 0 ? _a : "Delete failed");
            }
            router.push("/reports");
            router.refresh();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Delete failed");
            setBusy(null);
        }
    };
    return (_jsxs("div", { className: "flex flex-col items-end gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ExportButton, { label: "CSV", onClick: () => onExport("csv"), busy: busy === "csv" }), _jsx(ExportButton, { label: "XLSX", onClick: () => onExport("xlsx"), busy: busy === "xlsx" }), _jsx(ExportButton, { label: "PDF", onClick: () => onExport("pdf"), busy: busy === "pdf" }), _jsx("button", { type: "button", onClick: onDelete, disabled: busy === "delete", className: "rounded-md border border-rose-500/30 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50", children: "Delete" })] }), message ? (_jsx("div", { className: "text-[11px] text-emerald-400", children: message })) : null, error ? _jsx("div", { className: "text-[11px] text-rose-400", children: error }) : null] }));
}
function ExportButton({ label, onClick, busy, }) {
    return (_jsx("button", { type: "button", onClick: onClick, disabled: busy, className: "rounded-md border border-[var(--z-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50", children: busy ? `${label}…` : `Export ${label}` }));
}
