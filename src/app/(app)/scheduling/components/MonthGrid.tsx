"use client";

import type { Appointment } from "@/lib/scheduling/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type MonthGridProps = {
  focusDate: Date;
  appointments: Appointment[];
  onSelectDay: (day: Date) => void;
};

function startOfMonthGrid(focusDate: Date): Date {
  const first = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function MonthGrid({ focusDate, appointments, onSelectDay }: MonthGridProps) {
  const gridStart = startOfMonthGrid(focusDate);
  const today = new Date();
  const days = Array.from({ length: 42 }, (_, idx) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + idx);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <div className="grid grid-cols-7 border-b border-[var(--z-border)] bg-[var(--z-surface-2)]">
        {DAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-2 text-xs font-semibold text-[var(--z-muted)]">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7" role="grid" aria-label="Month view">
        {days.map((day) => {
          const inCurrentMonth = day.getMonth() === focusDate.getMonth();
          const dayAppointments = appointments.filter((appt) => sameDay(new Date(appt.startsAt), day));
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={[
                "min-h-24 border-b border-r border-[var(--z-border)] p-2 text-left z-hover-micro-subtle",
                inCurrentMonth ? "bg-transparent" : "bg-black/10",
                "hover:bg-white/[0.04]",
              ].join(" ")}
              onClick={() => onSelectDay(day)}
            >
              <div
                className={[
                  "text-xs",
                  sameDay(day, today) ? "font-semibold text-[#00ff88]" : "text-[var(--z-fg)]",
                ].join(" ")}
              >
                {day.getDate()}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {dayAppointments.slice(0, 6).map((appt) => (
                  <span
                    key={appt.id}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: appt.color || "#22c55e" }}
                    title={appt.title}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
