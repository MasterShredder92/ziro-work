"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return iso;
    return d.toLocaleString();
}
function diffLines(left, right) {
    const a = (left !== null && left !== void 0 ? left : "").split("\n");
    const b = (right !== null && right !== void 0 ? right : "").split("\n");
    const out = [];
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i += 1) {
        const la = a[i];
        const lb = b[i];
        if (la === undefined) {
            out.push({ tag: "add", value: lb !== null && lb !== void 0 ? lb : "" });
        }
        else if (lb === undefined) {
            out.push({ tag: "remove", value: la });
        }
        else if (la === lb) {
            out.push({ tag: "same", value: la });
        }
        else {
            out.push({ tag: "remove", value: la });
            out.push({ tag: "add", value: lb });
        }
    }
    return out;
}
export function VersionHistoryDrawer({ templateId, versions, currentBody, currentSubject, onRestored, }) {
    var _a, _b, _c;
    const [selectedId, setSelectedId] = useState((_b = (_a = versions[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState(null);
    const selected = useMemo(() => { var _a; return (_a = versions.find((v) => v.id === selectedId)) !== null && _a !== void 0 ? _a : null; }, [selectedId, versions]);
    const diff = useMemo(() => {
        var _a;
        if (!selected)
            return [];
        return diffLines((_a = selected.body) !== null && _a !== void 0 ? _a : "", currentBody !== null && currentBody !== void 0 ? currentBody : "");
    }, [selected, currentBody]);
    async function handleRestore() {
        if (!selected)
            return;
        setBusy(true);
        setError(null);
        setStatus(null);
        try {
            const res = await fetch(`/api/templates/${templateId}/versions/${selected.id}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    changeSummary: `Restored from v${selected.version}`,
                }),
            });
            if (!res.ok)
                throw new Error(`Restore failed (${res.status})`);
            setStatus(`Restored v${selected.version} as new current version.`);
            onRestored === null || onRestored === void 0 ? void 0 : onRestored();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Restore failed");
        }
        finally {
            setBusy(false);
        }
    }
    if (versions.length === 0) {
        return (_jsx("div", { className: "rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-sm text-[var(--z-muted)]", children: "No version history yet." }));
    }
    return (_jsxs("div", { className: "space-y-3 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Version history" }), selected && !selected.isCurrent ? (_jsx("button", { type: "button", onClick: handleRestore, disabled: busy, className: "rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] px-2 py-1 text-xs font-semibold text-[var(--z-accent)] disabled:opacity-50", children: busy ? "Restoring…" : `Restore v${selected.version}` })) : null] }), _jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-[160px_1fr]", children: [_jsx("ol", { className: "space-y-1", children: versions.map((v) => {
                            const isActive = selectedId === v.id;
                            return (_jsx("li", { children: _jsxs("button", { type: "button", onClick: () => setSelectedId(v.id), className: `w-full rounded-md border px-2 py-1.5 text-left text-xs ${isActive
                                        ? "border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] text-[var(--z-accent)]"
                                        : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-fg)]/80 hover:text-[var(--z-fg)]"}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("span", { className: "font-semibold", children: ["v", v.version] }), v.isCurrent ? (_jsx("span", { className: "rounded-full bg-[color-mix(in_oklab,var(--z-accent),transparent_80%)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--z-accent)]", children: "current" })) : null] }), _jsx("div", { className: "mt-0.5 text-[10px] text-[var(--z-muted)]", children: formatDate(v.createdAt) })] }) }, v.id));
                        }) }), _jsxs("div", { className: "min-w-0 space-y-2", children: [selected ? (_jsxs(_Fragment, { children: [selected.changeSummary ? (_jsx("div", { className: "text-xs text-[var(--z-fg)]/80", children: selected.changeSummary })) : null, currentSubject !== undefined && selected.subject !== currentSubject ? (_jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] p-2 text-xs", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Subject" }), _jsx("div", { className: "text-[var(--z-danger)] line-through", children: (_c = selected.subject) !== null && _c !== void 0 ? _c : "(none)" }), _jsx("div", { className: "text-[var(--z-accent)]", children: currentSubject !== null && currentSubject !== void 0 ? currentSubject : "(none)" })] })) : null, _jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_4%)] p-2", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Diff vs current" }), _jsx("pre", { className: "mt-1 max-h-[260px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5", children: diff.map((d, i) => (_jsxs("span", { className: d.tag === "add"
                                                        ? "block text-[var(--z-accent)]"
                                                        : d.tag === "remove"
                                                            ? "block text-[var(--z-danger)] line-through"
                                                            : "block text-[var(--z-fg)]/80", children: [d.tag === "add" ? "+ " : d.tag === "remove" ? "- " : "  ", d.value] }, i))) })] })] })) : (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Select a version to view the diff." })), error ? (_jsx("div", { className: "rounded-md border border-[color-mix(in_oklab,var(--z-danger),transparent_55%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] p-2 text-xs text-[var(--z-danger)]", children: error })) : null, status ? (_jsx("div", { className: "rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] p-2 text-xs text-[var(--z-accent)]", children: status })) : null] })] })] }));
}
