"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { APPOINTMENT_COLOR_SWATCHES, SCHEDULING_ACCENT_HEX, } from "@/lib/scheduling/colorSemantics";
function toLocalInput(iso) {
    const d = new Date(iso);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}
function fromLocalInput(value) {
    return new Date(value).toISOString();
}
export function AppointmentInspector({ open, appointment, onClose, onSave, onCancelAppointment, onDuplicateAppointment, }) {
    const [title, setTitle] = useState("");
    const [startsAtLocal, setStartsAtLocal] = useState("");
    const [durationMinutes, setDurationMinutes] = useState(30);
    const [status, setStatus] = useState("scheduled");
    const [notes, setNotes] = useState("");
    const [color, setColor] = useState(SCHEDULING_ACCENT_HEX);
    useEffect(() => {
        var _a, _b;
        if (!appointment)
            return;
        setTitle(appointment.title);
        setStartsAtLocal(toLocalInput(appointment.startsAt));
        const duration = Math.max(15, Math.round((new Date(appointment.endsAt).getTime() - new Date(appointment.startsAt).getTime()) / 60000));
        setDurationMinutes(duration);
        setStatus(appointment.status);
        setNotes((_a = appointment.notes) !== null && _a !== void 0 ? _a : "");
        setColor((_b = appointment.color) !== null && _b !== void 0 ? _b : SCHEDULING_ACCENT_HEX);
    }, [appointment === null || appointment === void 0 ? void 0 : appointment.id, appointment]);
    const computedEndLocal = useMemo(() => {
        if (!startsAtLocal)
            return "";
        const start = new Date(startsAtLocal);
        const end = new Date(start.getTime() + durationMinutes * 60000);
        return toLocalInput(end.toISOString());
    }, [startsAtLocal, durationMinutes]);
    const hasValidStart = startsAtLocal.length > 0 && Number.isFinite(new Date(startsAtLocal).getTime());
    const canSave = hasValidStart && durationMinutes >= 15;
    if (!open || !appointment)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-[80] flex", role: "presentation", children: [_jsx("button", { type: "button", "aria-label": "Close appointment inspector", className: "flex-1 bg-black/40", onClick: onClose }), _jsx("aside", { className: "h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-96", children: _jsxs("div", { className: "flex h-full flex-col", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Appointment" }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: appointment.title })] }), _jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]", onClick: onClose, children: "Close" })] }), _jsxs("div", { className: "min-h-0 flex-1 space-y-3 overflow-y-auto p-4", children: [_jsxs("label", { className: "block text-xs", children: [_jsx("span", { className: "mb-1 block text-[var(--z-muted)]", children: "Title" }), _jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "block text-xs", children: [_jsx("span", { className: "mb-1 block text-[var(--z-muted)]", children: "Date / time" }), _jsx("input", { type: "datetime-local", value: startsAtLocal, onChange: (e) => setStartsAtLocal(e.target.value), className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "block text-xs", children: [_jsx("span", { className: "mb-1 block text-[var(--z-muted)]", children: "Duration (minutes)" }), _jsx("input", { type: "number", min: 15, step: 15, value: durationMinutes, onChange: (e) => setDurationMinutes(Math.max(15, Number(e.target.value) || 15)), className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Ends: ", computedEndLocal || "—"] }), _jsxs("label", { className: "block text-xs", children: [_jsx("span", { className: "mb-1 block text-[var(--z-muted)]", children: "Status" }), _jsxs("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]", children: [_jsx("option", { value: "scheduled", children: "Scheduled" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "canceled", children: "Canceled" })] })] }), _jsxs("label", { className: "block text-xs", children: [_jsx("span", { className: "mb-1 block text-[var(--z-muted)]", children: "Notes" }), _jsx("textarea", { rows: 4, value: notes, onChange: (e) => setNotes(e.target.value), className: "w-full resize-y rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] }), _jsxs("div", { className: "text-xs", children: [_jsx("span", { className: "mb-1 block text-[var(--z-muted)]", children: "Color" }), _jsx("div", { className: "flex flex-wrap gap-2", children: APPOINTMENT_COLOR_SWATCHES.map((swatch) => (_jsx("button", { type: "button", onClick: () => setColor(swatch), className: [
                                                    "h-6 w-6 rounded-full border",
                                                    color === swatch ? "border-white" : "border-[var(--z-border)]",
                                                ].join(" "), style: { backgroundColor: swatch }, "aria-label": `Select appointment color ${swatch}` }, swatch))) })] })] }), _jsxs("div", { className: "flex items-center justify-between gap-2 border-t border-[var(--z-border)] p-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { type: "button", size: "sm", variant: "secondary", onClick: () => onDuplicateAppointment(appointment.id), children: "Duplicate" }), _jsx(Button, { type: "button", size: "sm", variant: "ghost", className: "border border-red-500/40 text-red-400 hover:bg-red-500/10", onClick: () => onCancelAppointment(appointment.id), children: "Cancel appointment" })] }), _jsx(Button, { type: "button", size: "sm", disabled: !canSave, onClick: () => onSave(appointment.id, {
                                        title: title.trim() || "Untitled appointment",
                                        startsAt: fromLocalInput(startsAtLocal),
                                        endsAt: new Date(new Date(startsAtLocal).getTime() + durationMinutes * 60000).toISOString(),
                                        status,
                                        notes: notes.trim() ? notes.trim() : null,
                                        color,
                                    }), children: "Save" })] })] }) })] }));
}
