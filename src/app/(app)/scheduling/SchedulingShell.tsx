// placeholder
"use client";
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
import type {
  Appointment,
  AvailabilityBlock,
  DateRange,
  ExpandedAvailabilityRange,
  Schedule,
} from "@/lib/scheduling/types";

type CalendarView = "week" | "month";

function startOfWeekMonday(source: Date): Date {
  const d = new Date(source);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return d;
}

function weekRange(weekStart: Date): DateRange {
  const start = startOfWeekMonday(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start: start.toISOString(), end: end.toISOString() };
}

function monthRange(focusDate: Date): DateRange {
  const first = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
  const last = new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: first.toISOString(), end: last.toISOString() };
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function SchedulingShell({ initialSchedules }: { initialSchedules: Schedule[] }) {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(initialSchedules[0]?.id ?? null);
  const [view, setView] = useState<CalendarView>("week");
  const [weekStart, setWeekStart] = useState<Date>(startOfWeekMonday(new Date()));
  const [monthFocus, setMonthFocus] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availabilityRanges, setAvailabilityRanges] = useState<ExpandedAvailabilityRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [availabilityEditorOpen, setAvailabilityEditorOpen] = useState(false);

  const activeSchedule = useMemo(
    () => schedules.find((schedule) => schedule.id === activeScheduleId) ?? null,
    [activeScheduleId, schedules],
  );
  const activeRange = useMemo(
    () => (view === "week" ? weekRange(weekStart) : monthRange(monthFocus)),
    [monthFocus, view, weekStart],
  );
  const selectedAppointment = useMemo(
    () => appointments.find((appt) => appt.id === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId],
  );
  const conflicts = useMemo(
    () => detectConflicts(appointments, availabilityRanges),
    [appointments, availabilityRanges],
  );

  const appointmentsTodayBySchedule = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const appt of appointments) {
      if (!isToday(appt.startsAt)) continue;
      counts[appt.scheduleId] = (counts[appt.scheduleId] ?? 0) + 1;
    }
    for (const schedule of schedules) counts[schedule.id] = counts[schedule.id] ?? 0;
    return counts;
  }, [appointments, schedules]);

  useEffect(() => {
    if (schedules.length > 0) return;
    void listSchedulesAction().then((next) => {
      setSchedules(next);
      if (!activeScheduleId && next[0]) setActiveScheduleId(next[0].id);
    });
  }, [activeScheduleId, schedules.length]);

  useEffect(() => {
    if (!activeScheduleId) return;
    setLoading(true);
    setError(null);
    void listAppointmentsAction(activeScheduleId, activeRange)
      .then((rows) => setAppointments(rows))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load appointments."))
      .finally(() => setLoading(false));
  }, [activeRange.end, activeRange.start, activeScheduleId]);

  useEffect(() => {
    if (!activeScheduleId) return;
    void listAvailabilityAction(activeScheduleId, activeRange)
      .then((rows) => setAvailabilityRanges(rows))
      .catch(() => setAvailabilityRanges([]));
  }, [activeRange.end, activeRange.start, activeScheduleId]);

  useEffect(() => {
    if (!selectedAppointmentId) return;
    if (!appointments.some((appt) => appt.id === selectedAppointmentId)) {
      setSelectedAppointmentId(null);
    }
  }, [appointments, selectedAppointmentId]);

  const updateActiveScheduleAvailability = (
    updater: (current: AvailabilityBlock[]) => AvailabilityBlock[],
  ) => {
    setSchedules((current) =>
      current.map((schedule) =>
        schedule.id === activeScheduleId
          ? { ...schedule, availabilityBlocks: updater(schedule.availabilityBlocks) }
          : schedule,
      ),
    );
  };

  const createOptimisticAppointment = (startsAt: string, endsAt: string) => {
    if (!activeScheduleId) return;
    const optimistic: Appointment = {
      id: `tmp-${Date.now()}`,
      tenantId: "optimistic",
      scheduleId: activeScheduleId,
      title: "New appointment",
      startsAt,
      endsAt,
      status: "scheduled",
      notes: null,
      recurrence: null,
      color: activeSchedule?.color || SCHEDULING_ACCENT_HEX,
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

  const updateOptimisticAppointment = (
    appointmentId: string,
    patch: Partial<{
      title: string;
      startsAt: string;
      endsAt: string;
      notes: string | null;
      status: "scheduled" | "canceled" | "completed";
      color: string | null;
    }>,
  ) => {
    const previous = appointments;
    setAppointments((current) =>
      current.map((appt) => (appt.id === appointmentId ? { ...appt, ...patch, updatedAt: new Date().toISOString() } : appt)),
    );
    void updateAppointmentAction(appointmentId, patch)
      .then((saved) => {
        setAppointments((current) => current.map((appt) => (appt.id === appointmentId ? saved : appt)));
      })
      .catch((err) => {
        setAppointments(previous);
        setError(err instanceof Error ? err.message : "Could not update appointment.");
      });
  };

  const duplicateAppointment = (appointmentId: string) => {
    const source = appointments.find((appt) => appt.id === appointmentId);
    if (!source || !activeScheduleId) return;
    const startsAt = new Date(new Date(source.startsAt).getTime() + 24 * 60 * 60 * 1000).toISOString();
    const endsAt = new Date(new Date(source.endsAt).getTime() + 24 * 60 * 60 * 1000).toISOString();
    const optimistic: Appointment = {
      ...source,
      id: `tmp-dup-${Date.now()}`,
      startsAt,
      endsAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
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

  const createOptimisticSchedule = (input: { name: string; color: string }) => {
    const optimistic: Schedule = {
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
        setSchedules(previous);
        setActiveScheduleId(previous[0]?.id ?? null);
        setError(err instanceof Error ? err.message : "Could not create schedule.");
      });
  };

  const updateOptimisticSchedule = (
    scheduleId: string,
    patch: { name?: string; color?: string },
  ) => {
    const previous = schedules;
    setSchedules((current) =>
      current.map((schedule) =>
        schedule.id === scheduleId ? { ...schedule, ...patch, updatedAt: new Date().toISOString() } : schedule,
      ),
    );
    void updateScheduleAction(scheduleId, patch)
      .then((saved) => {
        setSchedules((current) => current.map((schedule) => (schedule.id === scheduleId ? saved : schedule)));
      })
      .catch((err) => {
        setSchedules(previous);
        setError(err instanceof Error ? err.message : "Could not update schedule.");
      });
  };

  const createOptimisticAvailabilityBlock = (
    scheduleId: string,
    input: { dayOfWeek: number; startTime: string; endTime: string },
  ) => {
    const optimistic: AvailabilityBlock = {
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
        updateActiveScheduleAvailability((current) =>
          current.map((block) => (block.id === optimistic.id ? saved : block)),
        );
      })
      .catch((err) => {
        setSchedules(previous);
        setError(err instanceof Error ? err.message : "Could not create availability block.");
      });
  };

  const updateOptimisticAvailabilityBlock = (
    blockId: string,
    patch: Partial<{ dayOfWeek: number; startTime: string; endTime: string }>,
  ) => {
    const previous = schedules;
    updateActiveScheduleAvailability((current) =>
      current.map((block) =>
        block.id === blockId
          ? {
              ...block,
              dayOfWeek: patch.dayOfWeek ?? block.dayOfWeek,
              range: {
                start: patch.startTime ?? block.range.start,
                end: patch.endTime ?? block.range.end,
              },
            }
          : block,
      ),
    );
    void updateAvailabilityBlockAction(blockId, patch)
      .then((saved) => {
        updateActiveScheduleAvailability((current) =>
          current.map((block) => (block.id === blockId ? saved : block)),
        );
      })
      .catch((err) => {
        setSchedules(previous);
        setError(err instanceof Error ? err.message : "Could not update availability block.");
      });
  };

  const deleteOptimisticAvailabilityBlock = (blockId: string) => {
    const previous = schedules;
    updateActiveScheduleAvailability((current) => current.filter((block) => block.id !== blockId));
    void deleteAvailabilityBlockAction(blockId).catch((err) => {
      setSchedules(previous);
      setError(err instanceof Error ? err.message : "Could not delete availability block.");
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] md:flex-row">
      <ScheduleList
        schedules={schedules}
        activeScheduleId={activeScheduleId}
        appointmentsTodayBySchedule={appointmentsTodayBySchedule}
        onSelect={setActiveScheduleId}
      >
        <ScheduleEditor
          schedules={schedules}
          activeScheduleId={activeScheduleId}
          onCreateSchedule={createOptimisticSchedule}
          onUpdateSchedule={updateOptimisticSchedule}
        />
      </ScheduleList>

      <section className="relative min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-2 border-b border-[var(--z-border)] px-4 py-3">
          <div className="mr-auto">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Scheduling OS</div>
            <div className="text-sm font-semibold text-[var(--z-fg)]">{activeSchedule?.name ?? "No schedule selected"}</div>
          </div>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setAvailabilityEditorOpen(true)}
            disabled={!activeSchedule}
          >
            Edit availability
          </Button>

          <div className="inline-flex rounded border border-[var(--z-border)] p-0.5 text-xs">
            <button
              type="button"
              className={view === "week" ? "rounded bg-white/10 px-2 py-1" : "rounded px-2 py-1"}
              onClick={() => setView("week")}
            >
              Week
            </button>
            <button
              type="button"
              className={view === "month" ? "rounded bg-white/10 px-2 py-1" : "rounded px-2 py-1"}
              onClick={() => setView("month")}
            >
              Month
            </button>
          </div>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              if (view === "week") setWeekStart((current) => new Date(current.getTime() - 7 * 86400_000));
              else setMonthFocus((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
            }}
          >
            {"<"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              const now = new Date();
              setWeekStart(startOfWeekMonday(now));
              setMonthFocus(now);
            }}
          >
            Today
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              if (view === "week") setWeekStart((current) => new Date(current.getTime() + 7 * 86400_000));
              else setMonthFocus((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
            }}
          >
            {">"}
          </Button>
        </header>

        <div className="space-y-3 p-4">
          {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}
          {loading ? <SurfaceSkeleton lines={4} /> : null}
          {!loading && !activeSchedule ? (
            <EmptyState
              title="Select or create a schedule"
              description="Choose a schedule on the left to load week or month views."
            />
          ) : null}

          {!loading && activeSchedule && view === "week" ? (
            <CalendarGrid
              weekStart={weekStart}
              appointments={appointments}
              availabilityRanges={availabilityRanges}
              conflicts={conflicts}
              selectedAppointmentId={selectedAppointmentId}
              onCreateAppointment={createOptimisticAppointment}
              onMoveAppointment={(appointmentId, startsAt, endsAt) =>
                updateOptimisticAppointment(appointmentId, { startsAt, endsAt })
              }
              onResizeAppointment={(appointmentId, endsAt) =>
                updateOptimisticAppointment(appointmentId, { endsAt })
              }
              onSelectAppointment={setSelectedAppointmentId}
            />
          ) : null}
          {!loading && activeSchedule && view === "month" ? (
            <MonthGrid
              focusDate={monthFocus}
              appointments={appointments}
              onSelectDay={(day) => {
                setWeekStart(startOfWeekMonday(day));
                setView("week");
              }}
            />
          ) : null}
        </div>
      </section>

      <AppointmentInspector
        open={selectedAppointment != null}
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointmentId(null)}
        onSave={updateOptimisticAppointment}
        onCancelAppointment={(appointmentId) =>
          updateOptimisticAppointment(appointmentId, { status: "canceled" })
        }
        onDuplicateAppointment={duplicateAppointment}
      />

      <AvailabilityEditor
        open={availabilityEditorOpen}
        schedule={activeSchedule}
        onClose={() => setAvailabilityEditorOpen(false)}
        onCreateBlock={createOptimisticAvailabilityBlock}
        onUpdateBlock={updateOptimisticAvailabilityBlock}
        onDeleteBlock={deleteOptimisticAvailabilityBlock}
      />
    </div>
  );
}
