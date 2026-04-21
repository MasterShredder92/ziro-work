// placeholder
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { createAppointmentAction } from "./actions/createAppointmentAction";
import { createAvailabilityBlockAction } from "./actions/createAvailabilityBlockAction";
import { createScheduleAction } from "./actions/createScheduleAction";
import { deleteAvailabilityBlockAction } from "./actions/deleteAvailabilityBlockAction";
import { listAppointmentsAction } from "./actions/listAppointmentsAction";
import { listAvailabilityAction } from "./actions/listAvailabilityAction";
import { listSchedulesAction } from "./actions/listSchedulesAction";
import { updateAppointmentAction } from "./actions/updateAppointmentAction";
import { updateAvailabilityBlockAction } from "./actions/updateAvailabilityBlockAction";
import { updateScheduleAction } from "./actions/updateScheduleAction";
import { AppointmentInspector } from "./components/AppointmentInspector";
import { AvailabilityEditor } from "./components/AvailabilityEditor";
import { CalendarGrid } from "./components/CalendarGrid";
import { MonthGrid } from "./components/MonthGrid";
import { ScheduleEditor } from "./components/ScheduleEditor";
import { ScheduleList } from "./components/ScheduleList";
import { detectConflicts } from "@/lib/scheduling/schedulingOps";
import { Button } from "@/components/ui/Button";
import { EmptyState, InlineNotice, SurfaceSkeleton } from "@/components/system/SurfaceStates";
import { SCHEDULING_ACCENT_HEX } from "@/lib/scheduling/colorSemantics";
function startOfWeekMonday(source) {
    const d = new Date(source);
    d.setHours(0, 0, 0, 0);
    const dow = d.getDay();
    const offset = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + offset);
    return d;
}
function weekRange(weekStart) {
    const start = startOfWeekMonday(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start: start.toISOString(), end: end.toISOString() };
}
function monthRange(focusDate) {
    const first = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
    const last = new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: first.toISOString(), end: last.toISOString() };
}
function isToday(iso) {
    const d = new Date(iso);
    const now = new Date();
    return (d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate());
}
export function SchedulingShell({ initialSchedules }) {
    var _a, _b, _c;
    const [schedules, setSchedules] = useState(initialSchedules);
    const [activeScheduleId, setActiveScheduleId] = useState((_b = (_a = initialSchedules[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null);
    const [view, setView] = useState("week");
    const [weekStart, setWeekStart] = useState(startOfWeekMonday(new Date()));
    const [monthFocus, setMonthFocus] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [availabilityRanges, setAvailabilityRanges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const [availabilityEditorOpen, setAvailabilityEditorOpen] = useState(false);
    const activeSchedule = useMemo(() => { var _a; return (_a = schedules.find((schedule) => schedule.id === activeScheduleId)) !== null && _a !== void 0 ? _a : null; }, [activeScheduleId, schedules]);
    const activeRange = useMemo(() => (view === "week" ? weekRange(weekStart) : monthRange(monthFocus)), [monthFocus, view, weekStart]);
    const selectedAppointment = useMemo(() => { var _a; return (_a = appointments.find((appt) => appt.id === selectedAppointmentId)) !== null && _a !== void 0 ? _a : null; }, [appointments, selectedAppointmentId]);
    const conflicts = useMemo(() => detectConflicts(appointments, availabilityRanges), [appointments, availabilityRanges]);
    const appointmentsTodayBySchedule = useMemo(() => {
        var _a, _b;
        const counts = {};
        for (const appt of appointments) {
            if (!isToday(appt.startsAt))
                continue;
            counts[appt.scheduleId] = ((_a = counts[appt.scheduleId]) !== null && _a !== void 0 ? _a : 0) + 1;
        }
        for (const schedule of schedules)
            counts[schedule.id] = (_b = counts[schedule.id]) !== null && _b !== void 0 ? _b : 0;
        return counts;
    }, [appointments, schedules]);
    useEffect(() => {
        if (schedules.length > 0)
            return;
        void listSchedulesAction().then((next) => {
            setSchedules(next);
            if (!activeScheduleId && next[0])
                setActiveScheduleId(next[0].id);
        });
    }, [activeScheduleId, schedules.length]);
    useEffect(() => {
        if (!activeScheduleId)
            return;
        setLoading(true);
        setError(null);
        void listAppointmentsAction(activeScheduleId, activeRange)
            .then((rows) => setAppointments(rows))
            .catch((err) => setError(err instanceof Error ? err.message : "Could not load appointments."))
            .finally(() => setLoading(false));
    }, [activeRange.end, activeRange.start, activeScheduleId]);
    useEffect(() => {
        if (!activeScheduleId)
            return;
        void listAvailabilityAction(activeScheduleId, activeRange)
            .then((rows) => setAvailabilityRanges(rows))
            .catch(() => setAvailabilityRanges([]));
    }, [activeRange.end, activeRange.start, activeScheduleId]);
    useEffect(() => {
        if (!selectedAppointmentId)
            return;
        if (!appointments.some((appt) => appt.id === selectedAppointmentId)) {
            setSelectedAppointmentId(null);
        }
    }, [appointments, selectedAppointmentId]);
    const updateActiveScheduleAvailability = (updater) => {
        setSchedules((current) => current.map((schedule) => schedule.id === activeScheduleId
            ? Object.assign(Object.assign({}, schedule), { availabilityBlocks: updater(schedule.availabilityBlocks) }) : schedule));
    };
    const createOptimisticAppointment = (startsAt, endsAt) => {
        if (!activeScheduleId)
            return;
        const optimistic = {
            id: `tmp-${Date.now()}`,
            tenantId: "optimistic",
            scheduleId: activeScheduleId,
            title: "New appointment",
            startsAt,
            endsAt,
            status: "scheduled",
            notes: null,
            recurrence: null,
            color: (activeSchedule === null || activeSchedule === void 0 ? void 0 : activeSchedule.color) || SCHEDULING_ACCENT_HEX,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const previous = appointments;
        setAppointments((current) => [optimistic, ...current]);
        setSelectedAppointmentId(optimistic.id);
        void createAppointmentAction(activeScheduleId, {
            title: optimistic.title,
            startsAt,
            endsAt,
            status: "scheduled",
            notes: null,
            color: optimistic.color,
        })
            .then((saved) => {
            setAppointments((current) => current.map((appt) => (appt.id === optimistic.id ? saved : appt)));
            setSelectedAppointmentId(saved.id);
        })
            .catch((err) => {
            setAppointments(previous);
            setSelectedAppointmentId(null);
            setError(err instanceof Error ? err.message : "Could not create appointment.");
        });
    };
    const updateOptimisticAppointment = (appointmentId, patch) => {
        const previous = appointments;
        setAppointments((current) => current.map((appt) => (appt.id === appointmentId ? Object.assign(Object.assign(Object.assign({}, appt), patch), { updatedAt: new Date().toISOString() }) : appt)));
        void updateAppointmentAction(appointmentId, patch)
            .then((saved) => {
            setAppointments((current) => current.map((appt) => (appt.id === appointmentId ? saved : appt)));
        })
            .catch((err) => {
            setAppointments(previous);
            setError(err instanceof Error ? err.message : "Could not update appointment.");
        });
    };
    const duplicateAppointment = (appointmentId) => {
        const source = appointments.find((appt) => appt.id === appointmentId);
        if (!source || !activeScheduleId)
            return;
        const startsAt = new Date(new Date(source.startsAt).getTime() + 24 * 60 * 60 * 1000).toISOString();
        const endsAt = new Date(new Date(source.endsAt).getTime() + 24 * 60 * 60 * 1000).toISOString();
        const optimistic = Object.assign(Object.assign({}, source), { id: `tmp-dup-${Date.now()}`, startsAt,
            endsAt, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        const previous = appointments;
        setAppointments((current) => [optimistic, ...current]);
        setSelectedAppointmentId(optimistic.id);
        void createAppointmentAction(activeScheduleId, {
            title: source.title,
            startsAt,
            endsAt,
            status: source.status,
            notes: source.notes,
            recurrence: source.recurrence,
            color: source.color,
        })
            .then((saved) => {
            setAppointments((current) => current.map((appt) => (appt.id === optimistic.id ? saved : appt)));
            setSelectedAppointmentId(saved.id);
        })
            .catch((err) => {
            setAppointments(previous);
            setError(err instanceof Error ? err.message : "Could not duplicate appointment.");
        });
    };
    const createOptimisticSchedule = (input) => {
        const optimistic = {
            id: `tmp-schedule-${Date.now()}`,
            tenantId: "optimistic",
            name: input.name,
            color: input.color,
            timezone: "UTC",
            isActive: true,
            availabilityBlocks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const previous = schedules;
        setSchedules((current) => [optimistic, ...current]);
        setActiveScheduleId(optimistic.id);
        void createScheduleAction(input)
            .then((saved) => {
            setSchedules((current) => current.map((schedule) => (schedule.id === optimistic.id ? saved : schedule)));
            setActiveScheduleId(saved.id);
        })
            .catch((err) => {
            var _a, _b;
            setSchedules(previous);
            setActiveScheduleId((_b = (_a = previous[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null);
            setError(err instanceof Error ? err.message : "Could not create schedule.");
        });
    };
    const updateOptimisticSchedule = (scheduleId, patch) => {
        const previous = schedules;
        setSchedules((current) => current.map((schedule) => schedule.id === scheduleId ? Object.assign(Object.assign(Object.assign({}, schedule), patch), { updatedAt: new Date().toISOString() }) : schedule));
        void updateScheduleAction(scheduleId, patch)
            .then((saved) => {
            setSchedules((current) => current.map((schedule) => (schedule.id === scheduleId ? saved : schedule)));
        })
            .catch((err) => {
            setSchedules(previous);
            setError(err instanceof Error ? err.message : "Could not update schedule.");
        });
    };
    const createOptimisticAvailabilityBlock = (scheduleId, input) => {
        const optimistic = {
            id: `tmp-availability-${Date.now()}`,
            tenantId: "optimistic",
            scheduleId,
            dayOfWeek: input.dayOfWeek,
            range: { start: input.startTime, end: input.endTime },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const previous = schedules;
        updateActiveScheduleAvailability((current) => [...current, optimistic]);
        void createAvailabilityBlockAction(scheduleId, input)
            .then((saved) => {
            updateActiveScheduleAvailability((current) => current.map((block) => (block.id === optimistic.id ? saved : block)));
        })
            .catch((err) => {
            setSchedules(previous);
            setError(err instanceof Error ? err.message : "Could not create availability block.");
        });
    };
    const updateOptimisticAvailabilityBlock = (blockId, patch) => {
        const previous = schedules;
        updateActiveScheduleAvailability((current) => current.map((block) => {
            var _a, _b, _c;
            return block.id === blockId
                ? Object.assign(Object.assign({}, block), { dayOfWeek: (_a = patch.dayOfWeek) !== null && _a !== void 0 ? _a : block.dayOfWeek, range: {
                        start: (_b = patch.startTime) !== null && _b !== void 0 ? _b : block.range.start,
                        end: (_c = patch.endTime) !== null && _c !== void 0 ? _c : block.range.end,
                    } }) : block;
        }));
        void updateAvailabilityBlockAction(blockId, patch)
            .then((saved) => {
            updateActiveScheduleAvailability((current) => current.map((block) => (block.id === blockId ? saved : block)));
        })
            .catch((err) => {
            setSchedules(previous);
            setError(err instanceof Error ? err.message : "Could not update availability block.");
        });
    };
    const deleteOptimisticAvailabilityBlock = (blockId) => {
        const previous = schedules;
        updateActiveScheduleAvailability((current) => current.filter((block) => block.id !== blockId));
        void deleteAvailabilityBlockAction(blockId).catch((err) => {
            setSchedules(previous);
            setError(err instanceof Error ? err.message : "Could not delete availability block.");
        });
    };
    return (_jsxs("div", { className: "flex min-h-[calc(100vh-120px)] flex-col rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] md:flex-row", children: [_jsx(ScheduleList, { schedules: schedules, activeScheduleId: activeScheduleId, appointmentsTodayBySchedule: appointmentsTodayBySchedule, onSelect: setActiveScheduleId, children: _jsx(ScheduleEditor, { schedules: schedules, activeScheduleId: activeScheduleId, onCreateSchedule: createOptimisticSchedule, onUpdateSchedule: updateOptimisticSchedule }) }), _jsxs("section", { className: "relative min-w-0 flex-1", children: [_jsxs("header", { className: "flex flex-wrap items-center gap-2 border-b border-[var(--z-border)] px-4 py-3", children: [_jsxs("div", { className: "mr-auto", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Scheduling OS" }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: (_c = activeSchedule === null || activeSchedule === void 0 ? void 0 : activeSchedule.name) !== null && _c !== void 0 ? _c : "No schedule selected" })] }), _jsx(Button, { type: "button", size: "sm", variant: "secondary", onClick: () => setAvailabilityEditorOpen(true), disabled: !activeSchedule, children: "Edit availability" }), _jsxs("div", { className: "inline-flex rounded border border-[var(--z-border)] p-0.5 text-xs", children: [_jsx("button", { type: "button", className: view === "week" ? "rounded bg-white/10 px-2 py-1" : "rounded px-2 py-1", onClick: () => setView("week"), children: "Week" }), _jsx("button", { type: "button", className: view === "month" ? "rounded bg-white/10 px-2 py-1" : "rounded px-2 py-1", onClick: () => setView("month"), children: "Month" })] }), _jsx(Button, { type: "button", size: "sm", variant: "secondary", onClick: () => {
                                    if (view === "week")
                                        setWeekStart((current) => new Date(current.getTime() - 7 * 86400000));
                                    else
                                        setMonthFocus((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
                                }, children: "<" }), _jsx(Button, { type: "button", size: "sm", variant: "secondary", onClick: () => {
                                    const now = new Date();
                                    setWeekStart(startOfWeekMonday(now));
                                    setMonthFocus(now);
                                }, children: "Today" }), _jsx(Button, { type: "button", size: "sm", variant: "secondary", onClick: () => {
                                    if (view === "week")
                                        setWeekStart((current) => new Date(current.getTime() + 7 * 86400000));
                                    else
                                        setMonthFocus((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
                                }, children: ">" })] }), _jsxs("div", { className: "space-y-3 p-4", children: [error ? _jsx(InlineNotice, { tone: "danger", children: error }) : null, loading ? _jsx(SurfaceSkeleton, { lines: 4 }) : null, !loading && !activeSchedule ? (_jsx(EmptyState, { title: "Select or create a schedule", description: "Choose a schedule on the left to load week or month views." })) : null, !loading && activeSchedule && view === "week" ? (_jsx(CalendarGrid, { weekStart: weekStart, appointments: appointments, availabilityRanges: availabilityRanges, conflicts: conflicts, selectedAppointmentId: selectedAppointmentId, onCreateAppointment: createOptimisticAppointment, onMoveAppointment: (appointmentId, startsAt, endsAt) => updateOptimisticAppointment(appointmentId, { startsAt, endsAt }), onResizeAppointment: (appointmentId, endsAt) => updateOptimisticAppointment(appointmentId, { endsAt }), onSelectAppointment: setSelectedAppointmentId })) : null, !loading && activeSchedule && view === "month" ? (_jsx(MonthGrid, { focusDate: monthFocus, appointments: appointments, onSelectDay: (day) => {
                                    setWeekStart(startOfWeekMonday(day));
                                    setView("week");
                                } })) : null] })] }), _jsx(AppointmentInspector, { open: selectedAppointment != null, appointment: selectedAppointment, onClose: () => setSelectedAppointmentId(null), onSave: updateOptimisticAppointment, onCancelAppointment: (appointmentId) => updateOptimisticAppointment(appointmentId, { status: "canceled" }), onDuplicateAppointment: duplicateAppointment }), _jsx(AvailabilityEditor, { open: availabilityEditorOpen, schedule: activeSchedule, onClose: () => setAvailabilityEditorOpen(false), onCreateBlock: createOptimisticAvailabilityBlock, onUpdateBlock: updateOptimisticAvailabilityBlock, onDeleteBlock: deleteOptimisticAvailabilityBlock })] }));
}
