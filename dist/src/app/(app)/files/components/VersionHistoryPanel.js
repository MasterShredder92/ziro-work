"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
function formatBytes(n) {
    if (!n)
        return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let idx = 0;
    let v = n;
    while (v >= 1024 && idx < units.length - 1) {
        v /= 1024;
        idx += 1;
    }
    return `${v.toFixed(v >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}
export function VersionHistoryPanel({ file, fileId, versions, currentVersionId, canWrite, onVersionsChanged, }) {
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState(null);
    const [compareId, setCompareId] = useState(null);
    const current = useMemo(() => { var _a; return (_a = versions.find((v) => v.id === currentVersionId)) !== null && _a !== void 0 ? _a : versions[0]; }, [versions, currentVersionId]);
    const run = async (fn) => {
        setError(null);
        try {
            await fn();
            onVersionsChanged === null || onVersionsChanged === void 0 ? void 0 : onVersionsChanged();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusyId(null);
        }
    };
    const download = (versionId) => run(async () => {
        var _a, _b;
        setBusyId(versionId);
        const res = await fetch(`/api/files/${fileId}/versions/${versionId}?signedUrl=true&ttl=3600`);
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error((body === null || body === void 0 ? void 0 : body.error) || `Download failed (${res.status})`);
        }
        const data = await res.json();
        const url = (_b = (_a = data === null || data === void 0 ? void 0 : data.data) === null || _a === void 0 ? void 0 : _a.signedUrl) === null || _b === void 0 ? void 0 : _b.url;
        if (url)
            window.open(url, "_blank", "noopener,noreferrer");
    });
    const restore = (versionId) => run(async () => {
        if (!window.confirm("Make this revision the current version of the file?"))
            return;
        setBusyId(versionId);
        const res = await fetch(`/api/files/${fileId}/versions/${versionId}`, {
            method: "POST",
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error((body === null || body === void 0 ? void 0 : body.error) || `Restore failed (${res.status})`);
        }
    });
    const remove = (versionId) => run(async () => {
        if (!window.confirm("Permanently delete this revision from history?"))
            return;
        setBusyId(versionId);
        const res = await fetch(`/api/files/${fileId}/versions/${versionId}`, {
            method: "DELETE",
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error((body === null || body === void 0 ? void 0 : body.error) || `Delete failed (${res.status})`);
        }
    });
    const downloadAllZip = () => run(async () => {
        setBusyId("zip");
        const res = await fetch(`/api/files/${fileId}/versions/zip`);
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error((body === null || body === void 0 ? void 0 : body.error) || `ZIP failed (${res.status})`);
        }
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `versions-${fileId}.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
    });
    const compareMeta = (a, b) => {
        var _a, _b;
        const keys = ["size", "mimeType", "checksum", "notes"];
        const lines = [];
        for (const k of keys) {
            const av = String((_a = a[k]) !== null && _a !== void 0 ? _a : "—");
            const bv = String((_b = b[k]) !== null && _b !== void 0 ? _b : "—");
            if (av !== bv)
                lines.push(`${k}: ${av} → ${bv}`);
        }
        return lines.length ? lines.join("\n") : "No metadata differences detected.";
    };
    if (versions.length === 0) {
        return (_jsx("div", { className: "mt-2 rounded-md border border-dashed border-[var(--z-border)] px-3 py-6 text-center text-xs text-[var(--z-muted)]", children: "No version history yet." }));
    }
    return (_jsxs("div", { className: "mt-2 space-y-2", children: [error ? (_jsx("div", { className: "rounded border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-xs text-red-400", children: error })) : null, file.status === "archived" ? (_jsx("p", { className: "text-[11px] text-[var(--z-muted)]", children: "File is archived \u2014 versions are read-only until status changes." })) : null, _jsx("div", { className: "flex flex-wrap gap-2", children: _jsx("button", { type: "button", disabled: busyId === "zip", onClick: () => void downloadAllZip(), className: "rounded border border-[var(--z-border)] px-2 py-1 text-[11px] text-[var(--z-fg)] hover:bg-white/[0.06] disabled:opacity-50", children: busyId === "zip" ? "Preparing…" : "Download all as ZIP" }) }), _jsx("ul", { className: "max-h-[min(420px,50vh)] space-y-1 overflow-y-auto pr-1", children: versions.map((v) => {
                    var _a, _b, _c;
                    const isCurrent = v.id === currentVersionId;
                    const lastRestored = typeof ((_a = file.metadata) === null || _a === void 0 ? void 0 : _a.lastRestoredVersion) === "number"
                        ? file.metadata.lastRestoredVersion
                        : null;
                    const restored = lastRestored === v.version;
                    return (_jsxs("li", { className: `flex flex-col gap-1 rounded-md border px-2 py-2 text-xs transition-colors ${isCurrent
                            ? "border-[color-mix(in_oklab,var(--z-accent),transparent_60%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)]"
                            : "border-[var(--z-border)] bg-white/[0.02]"}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("span", { className: "font-medium text-[var(--z-fg)]", children: ["v", v.version] }), _jsxs("div", { className: "flex flex-wrap justify-end gap-1", children: [isCurrent ? (_jsx("span", { className: "rounded-full bg-[var(--z-accent)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--z-accent)]", children: "Current" })) : null, restored ? (_jsx("span", { className: "rounded-full border border-amber-400/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200/90", children: "Restored" })) : null] })] }), _jsxs("div", { className: "text-[var(--z-muted)]", children: [v.uploadedBy
                                        ? `Uploaded by ${v.uploadedBy.slice(0, 8)}… · `
                                        : "", formatBytes(v.size), " \u00B7 chk ", (_c = (_b = v.checksum) === null || _b === void 0 ? void 0 : _b.slice(0, 8)) !== null && _c !== void 0 ? _c : "—", "\u2026 \u00B7", " ", new Date(v.createdAt).toLocaleString(), v.notes ? ` · ${v.notes}` : ""] }), _jsxs("div", { className: "flex flex-wrap gap-1 pt-1", children: [_jsx("button", { type: "button", disabled: busyId === v.id, onClick: () => void download(v.id), className: "rounded border border-[var(--z-border)] px-2 py-0.5 text-[11px] text-[var(--z-fg)] hover:bg-white/[0.06] disabled:opacity-50", children: busyId === v.id ? "…" : "Download" }), current && !isCurrent ? (_jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-2 py-0.5 text-[11px] text-[var(--z-fg)] hover:bg-white/[0.06]", onClick: () => setCompareId(v.id), children: "Compare" })) : null, canWrite ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", disabled: busyId === v.id || isCurrent, onClick: () => void restore(v.id), className: "rounded border border-[var(--z-border)] px-2 py-0.5 text-[11px] text-[var(--z-fg)] hover:bg-white/[0.06] disabled:opacity-40", children: "Restore" }), _jsx("button", { type: "button", disabled: busyId === v.id || isCurrent, onClick: () => void remove(v.id), className: "rounded border border-red-500/30 px-2 py-0.5 text-[11px] text-red-400 hover:bg-red-500/10 disabled:opacity-40", children: "Delete" })] })) : null] })] }, v.id));
                }) }), compareId && current ? (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", children: _jsxs("div", { className: "max-h-[80vh] w-full max-w-lg overflow-auto rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-xs text-[var(--z-fg)] shadow-xl", children: [_jsx("h4", { className: "text-sm font-semibold", children: "Compare versions (metadata)" }), _jsx("p", { className: "mt-1 text-[var(--z-muted)]", children: "Structural diff of stored metadata \u2014 binary content is not diffed here." }), _jsx("pre", { className: "mt-3 whitespace-pre-wrap rounded border border-[var(--z-border)] bg-black/20 p-3 text-[11px] text-[var(--z-muted)]", children: compareMeta(versions.find((x) => x.id === compareId), current) }), _jsx("button", { type: "button", className: "mt-3 rounded-md border border-[var(--z-border)] px-3 py-1.5 text-[var(--z-fg)]", onClick: () => setCompareId(null), children: "Close" })] }) })) : null] }));
}
