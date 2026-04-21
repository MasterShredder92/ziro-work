"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Archive, Bookmark, Bolt, Check, Flag, Folder, Heart, Star, } from "lucide-react";
const ICON_TAGS = [
    "default",
    "star",
    "heart",
    "bookmark",
    "flag",
    "bolt",
    "check",
    "archive",
];
export const FOLDER_ICON_PRESETS = [
    { tag: "default", label: "Default", Icon: Folder },
    { tag: "star", label: "Star", Icon: Star },
    { tag: "heart", label: "Heart", Icon: Heart },
    { tag: "bookmark", label: "Bookmark", Icon: Bookmark },
    { tag: "flag", label: "Flag", Icon: Flag },
    { tag: "bolt", label: "Bolt", Icon: Bolt },
    { tag: "check", label: "Check", Icon: Check },
    { tag: "archive", label: "Archive", Icon: Archive },
];
export function isFolderIconTag(value) {
    return typeof value === "string" && ICON_TAGS.some((tag) => tag === value);
}
export function folderIconTooltip(icon) {
    if (!icon || icon === "default")
        return "Icon: Default";
    const preset = FOLDER_ICON_PRESETS.find((entry) => entry.tag === icon);
    return preset ? `Icon: ${preset.label}` : "Icon: Default";
}
export function FolderIconGlyph({ icon, className = "", }) {
    var _a;
    const normalized = isFolderIconTag(icon) ? icon : "default";
    const preset = FOLDER_ICON_PRESETS.find((entry) => entry.tag === normalized);
    const Icon = (_a = preset === null || preset === void 0 ? void 0 : preset.Icon) !== null && _a !== void 0 ? _a : Folder;
    return _jsx(Icon, { className: `h-4 w-4 shrink-0 ${className}`, "aria-hidden": true });
}
export function FolderIconPicker({ value, onChange }) {
    const selected = isFolderIconTag(value) ? value : null;
    return (_jsxs("div", { className: "w-[208px] rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-2 shadow-lg", role: "dialog", "aria-label": "Set folder icon", onMouseDown: (e) => e.stopPropagation(), onClick: (e) => e.stopPropagation(), children: [_jsx("div", { className: "mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Set icon" }), _jsx("div", { className: "grid grid-cols-4 gap-2", children: FOLDER_ICON_PRESETS.map((entry) => {
                    const isSelected = selected === entry.tag;
                    return (_jsx("button", { type: "button", title: `Icon: ${entry.label}`, "aria-label": `Set ${entry.label} folder icon`, "aria-pressed": isSelected, className: `inline-flex h-8 w-8 items-center justify-center rounded border text-[var(--z-fg)] transition-colors hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] ${isSelected
                            ? "border-[var(--z-accent)] ring-1 ring-[var(--z-accent)]/35"
                            : "border-[var(--z-border)]"}`, onClick: () => onChange(entry.tag), children: _jsx(entry.Icon, { className: "h-4 w-4", "aria-hidden": true }) }, entry.tag));
                }) }), _jsx("button", { type: "button", className: "mt-2 w-full rounded border border-[var(--z-border)] px-2 py-1.5 text-left text-[11px] text-[var(--z-muted)] hover:bg-white/[0.06] hover:text-[var(--z-fg)]", onClick: () => onChange(null), children: "Clear icon" })] }));
}
