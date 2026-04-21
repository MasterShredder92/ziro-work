"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
export function ScheduleEditor({ schedules, activeScheduleId, onCreateSchedule, onUpdateSchedule, }) {
    var _a, _b, _c;
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState("#22c55e");
    const active = (_a = schedules.find((schedule) => schedule.id === activeScheduleId)) !== null && _a !== void 0 ? _a : null;
    const [editName, setEditName] = useState((_b = active === null || active === void 0 ? void 0 : active.name) !== null && _b !== void 0 ? _b : "");
    const [editColor, setEditColor] = useState((_c = active === null || active === void 0 ? void 0 : active.color) !== null && _c !== void 0 ? _c : "#22c55e");
    useEffect(() => {
        var _a, _b;
        setEditName((_a = active === null || active === void 0 ? void 0 : active.name) !== null && _a !== void 0 ? _a : "");
        setEditColor((_b = active === null || active === void 0 ? void 0 : active.color) !== null && _b !== void 0 ? _b : "#22c55e");
    }, [active === null || active === void 0 ? void 0 : active.id, active === null || active === void 0 ? void 0 : active.name, active === null || active === void 0 ? void 0 : active.color]);
    return (_jsxs("div", { className: "space-y-3 rounded border border-[var(--z-border)] p-3", children: [_jsx("div", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Schedule editor" }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Create schedule" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { value: newName, onChange: (event) => setNewName(event.target.value), placeholder: "Schedule name", className: "min-w-0 flex-1" }), _jsx("input", { type: "color", value: newColor, onChange: (event) => setNewColor(event.target.value), className: "h-8 w-10 rounded border border-[var(--z-border)] bg-transparent p-1", "aria-label": "New schedule color" }), _jsx(Button, { type: "button", size: "sm", variant: "secondary", onClick: () => {
                                    const name = newName.trim();
                                    if (!name)
                                        return;
                                    onCreateSchedule({ name, color: newColor });
                                    setNewName("");
                                    setNewColor("#22c55e");
                                }, children: "Create" })] })] }), active ? (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Edit active schedule" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { value: editName, onChange: (event) => setEditName(event.target.value), className: "min-w-0 flex-1" }), _jsx("input", { type: "color", value: editColor, onChange: (event) => setEditColor(event.target.value), className: "h-8 w-10 rounded border border-[var(--z-border)] bg-transparent p-1", "aria-label": "Active schedule color" })] }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { type: "button", size: "sm", variant: "secondary", onClick: () => onUpdateSchedule(active.id, {
                                name: editName.trim() || active.name,
                                color: editColor,
                            }), children: "Save schedule" }) })] })) : null] }));
}
