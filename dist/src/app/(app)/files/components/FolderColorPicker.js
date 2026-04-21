"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const COLOR_TAGS = [
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "pink",
];
export const FOLDER_COLOR_PRESETS = [
    { tag: "red", className: "bg-red-500", hex: "#ef4444" },
    { tag: "orange", className: "bg-orange-500", hex: "#f97316" },
    { tag: "yellow", className: "bg-yellow-500", hex: "#eab308" },
    { tag: "green", className: "bg-green-500", hex: "#22c55e" },
    { tag: "blue", className: "bg-blue-500", hex: "#3b82f6" },
    { tag: "purple", className: "bg-purple-500", hex: "#a855f7" },
    { tag: "pink", className: "bg-pink-500", hex: "#ec4899" },
];
function toTitleCase(value) {
    if (!value)
        return value;
    return value.slice(0, 1).toUpperCase() + value.slice(1);
}
export function isFolderColorTag(value) {
    return typeof value === "string" && COLOR_TAGS.some((tag) => tag === value);
}
export function folderColorClassName(colorTag) {
    var _a;
    if (!colorTag)
        return null;
    const preset = FOLDER_COLOR_PRESETS.find((entry) => entry.tag === colorTag);
    return (_a = preset === null || preset === void 0 ? void 0 : preset.className) !== null && _a !== void 0 ? _a : null;
}
export function folderColorHex(folder) {
    var _a, _b, _c;
    const raw = (_a = folder.metadata) === null || _a === void 0 ? void 0 : _a.colorTag;
    if (!isFolderColorTag(raw))
        return null;
    return (_c = (_b = FOLDER_COLOR_PRESETS.find((entry) => entry.tag === raw)) === null || _b === void 0 ? void 0 : _b.hex) !== null && _c !== void 0 ? _c : null;
}
export function folderColorTooltip(colorTag) {
    if (!colorTag)
        return "No color tag";
    return `Color tag: ${toTitleCase(colorTag)}`;
}
export function FolderColorDot({ colorTag, hex, className = "", }) {
    const colorClass = folderColorClassName(colorTag !== null && colorTag !== void 0 ? colorTag : null);
    const fallbackHex = !colorClass && hex ? hex : null;
    if (!colorClass) {
        if (!fallbackHex) {
            return _jsx("span", { className: `inline-block h-2 w-2 shrink-0 ${className}`, "aria-hidden": true });
        }
        return (_jsx("span", { className: `inline-block h-2 w-2 shrink-0 rounded-full ${className}`, style: { backgroundColor: fallbackHex }, "aria-hidden": true }));
    }
    return (_jsx("span", { className: `inline-block h-2 w-2 shrink-0 rounded-full ${colorClass} ${className}`, "aria-hidden": true }));
}
export function FolderColorPicker({ value, onChange }) {
    return (_jsxs("div", { className: "w-[180px] rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-2 shadow-lg", role: "dialog", "aria-label": "Set folder color", onMouseDown: (e) => e.stopPropagation(), onClick: (e) => e.stopPropagation(), children: [_jsx("div", { className: "mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Set color" }), _jsx("div", { className: "grid grid-cols-4 gap-2", children: FOLDER_COLOR_PRESETS.map((entry) => {
                    const selected = value === entry.tag;
                    return (_jsx("button", { type: "button", title: `Color tag: ${toTitleCase(entry.tag)}`, "aria-label": `Set ${entry.tag} color tag`, "aria-pressed": selected, className: `inline-flex h-7 w-7 items-center justify-center rounded-full border transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] ${selected
                            ? "border-[var(--z-accent)] ring-1 ring-[var(--z-accent)]/35"
                            : "border-[var(--z-border)]"}`, onClick: () => onChange(entry.tag), children: _jsx("span", { className: `h-4 w-4 rounded-full ${entry.className}` }) }, entry.tag));
                }) }), _jsx("button", { type: "button", className: "mt-2 w-full rounded border border-[var(--z-border)] px-2 py-1.5 text-left text-[11px] text-[var(--z-muted)] hover:bg-white/[0.06] hover:text-[var(--z-fg)]", onClick: () => onChange(null), children: "Clear color" })] }));
}
