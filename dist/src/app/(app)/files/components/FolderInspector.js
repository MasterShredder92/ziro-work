"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { normalizeAccessTimestamp } from "@/lib/files/formatters";
import { folderDescriptionPreview, normalizeFolderDescription, } from "./FolderDescriptionEditor";
export function FolderInspector({ folder, canWrite, onSaveDescription, onOpenShareLinks, }) {
    var _a, _b, _c;
    const [draft, setDraft] = useState("");
    const [saving, setSaving] = useState(false);
    const previousDraftRef = useRef("");
    const metadataDescription = typeof ((_a = folder === null || folder === void 0 ? void 0 : folder.metadata) === null || _a === void 0 ? void 0 : _a.description) === "string" ? folder.metadata.description : null;
    const lastAccessed = normalizeAccessTimestamp(((_b = folder === null || folder === void 0 ? void 0 : folder.metadata) !== null && _b !== void 0 ? _b : {}));
    useEffect(() => {
        const next = metadataDescription !== null && metadataDescription !== void 0 ? metadataDescription : "";
        setDraft(next);
        previousDraftRef.current = next;
    }, [folder === null || folder === void 0 ? void 0 : folder.id, metadataDescription]);
    const saveIfChanged = async () => {
        if (!folder || !canWrite || !onSaveDescription || saving)
            return;
        const normalized = normalizeFolderDescription(draft);
        const previous = normalizeFolderDescription(previousDraftRef.current);
        if (normalized === previous)
            return;
        setSaving(true);
        try {
            await onSaveDescription(folder.id, normalized);
            previousDraftRef.current = normalized !== null && normalized !== void 0 ? normalized : "";
        }
        catch (_a) {
            setDraft(previousDraftRef.current);
        }
        finally {
            setSaving(false);
        }
    };
    if (!folder)
        return null;
    return (_jsxs("div", { className: "mt-3 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsx("div", { className: "mb-2 text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Folder inspector" }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: folder.name }), _jsx("div", { className: "mt-0.5 text-[10px] text-[var(--z-muted)]", children: (_c = folderDescriptionPreview(metadataDescription, 120)) !== null && _c !== void 0 ? _c : "No description" }), _jsxs("div", { className: "mt-0.5 text-[10px] text-[var(--z-muted)]", children: ["Last accessed:", " ", _jsx("span", { title: lastAccessed.iso ? new Date(lastAccessed.iso).toLocaleString() : undefined, children: lastAccessed.relative })] }), onOpenShareLinks ? (_jsx("button", { type: "button", className: "mt-2 rounded border border-[var(--z-border)] px-2 py-1 text-[11px] text-[var(--z-fg)] hover:bg-white/[0.05]", onClick: () => onOpenShareLinks(folder), children: "Share links" })) : null, _jsx("label", { className: "mt-3 block text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: "Description" }), _jsx("textarea", { value: draft, disabled: !canWrite || !onSaveDescription || saving, rows: 3, className: "mt-1 w-full resize-y rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] disabled:opacity-60", placeholder: "Add a folder description...", onChange: (e) => setDraft(e.target.value), onBlur: () => {
                    void saveIfChanged();
                }, onKeyDown: (e) => {
                    if (e.key === "Escape") {
                        e.preventDefault();
                        setDraft(previousDraftRef.current);
                        e.currentTarget.blur();
                        return;
                    }
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        void saveIfChanged();
                    }
                } })] }));
}
