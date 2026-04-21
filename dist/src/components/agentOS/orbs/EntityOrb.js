"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { OrbBase } from "./OrbBase";
const KIND_SIZE = {
    family: "sm",
    student: "md",
    teacher: "lg",
};
const KIND_ACCENT = {
    family: "#facc15",
    student: "#00ff88",
    teacher: "#a78bfa",
};
function initials(name) {
    var _a, _b, _c, _d;
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const a = (_b = (_a = parts[0]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : "?";
    const b = parts.length > 1 ? ((_d = (_c = parts[parts.length - 1]) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : "") : "";
    return (a + b).toUpperCase();
}
/**
 * Entity orb — a round affordance for a teacher/student/family. Drag + drop
 * support allows "reassign" gestures (e.g. student → teacher). The consumer
 * wires onDrop semantics.
 */
export function EntityOrb({ kind, id, label, sublabel, onClick, draggable = true, onDragStart, onDragOver, onDrop, active, className, }) {
    const accent = KIND_ACCENT[kind];
    const glow = `color-mix(in oklab, ${accent}, transparent 60%)`;
    const size = KIND_SIZE[kind];
    const handleDragStart = (e) => {
        e.dataTransfer.setData("application/x-ziro-orb", JSON.stringify({ kind, id }));
        e.dataTransfer.effectAllowed = "move";
        onDragStart === null || onDragStart === void 0 ? void 0 : onDragStart(e);
    };
    const handleDragOver = (e) => {
        if (e.dataTransfer.types.includes("application/x-ziro-orb")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        }
        onDragOver === null || onDragOver === void 0 ? void 0 : onDragOver(e);
    };
    return (_jsx(OrbBase, { as: "div", size: size, accent: accent, glow: glow, label: sublabel ? `${label} — ${sublabel}` : label, active: active, onClick: onClick, draggable: draggable, onDragStart: handleDragStart, onDragOver: handleDragOver, onDrop: onDrop, className: className, children: _jsx("span", { className: "select-none text-[11px] font-extrabold uppercase tracking-[0.08em]", style: { color: accent }, children: initials(label) }) }));
}
