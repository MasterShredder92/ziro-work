"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Appointment,
  AppointmentConflict,
  ExpandedAvailabilityRange,
} from "@/lib/scheduling/types";
import {
  SCHEDULING_ACCENT_HEX,
  normalizeSchedulingStatus,
  withAlpha,
} from "@/lib/scheduling/colorSemantics";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_MINUTES = 7 * 60;
const END_MINUTES = 22 * 60;
const SLOT_MINUTES = 15;
const SLOT_HEIGHT = 16;
const MIN_DURATION_MINUTES = 15;
const TOTAL_SLOTS = (END_MINUTES - START_MINUTES) / SLOT_MINUTES;

type DragMode = "move" | "resize";
type DragState = {
  mode: DragMode;
  appointmentId: string;
  startY: number;
  originalStartsAt: string;
  originalEndsAt: string;
};

export interface CalendarGridProps {
  weekStart: Date;
  appointments: Appointment[];
  availabilityRanges: ExpandedAvailabilityRange[];
  conflicts: AppointmentConflict[];
  onCreateAppointment: (startsAt: string, endsAt: string) => void;
  onMoveAppointment: (appointmentId: string, startsAt: string, endsAt: string) => void;
  onResizeAppointment: (appointmentId: string, endsAt: string) => void;
  onSelectAppointment: (appointmentId: string) => void;
  selectedAppointmentId?: string | null;
}

function startOfWeekMonday(source: Date): Date {
  const d = new Date(source);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return d;
}

function dayDate(weekStart: Date, dayIndex: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return d;
}

function dayIndexFromDate(weekStart: Date, iso: string): number {
  const date = new Date(iso);
  const ws = startOfWeekMonday(weekStart);
  return Math.floor((date.getTime() - ws.getTime()) / (24 * 60 * 60 * 1000));
}

function minutesFromIso(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function isoForDayAndMinutes(day: Date, minutes: number): string {
  const d = new Date(day);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d.toISOString();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function conflictMessage(conflicts: AppointmentConflict[]): string | null {
  if (conflicts.length === 0) return null;
  const hasOverlap = conflicts.some((conflict) => conflict.type === "overlap");
  const hasOutsideAvailability = conflicts.some(
    (conflict) => conflict.type === "outsideAvailability",
  );
  if (hasOverlap && hasOutsideAvailability) {
    return "Conflicts: overlapping appointment and outside availability";
  }
  if (hasOverlap) return "Conflict: overlapping appointment";
  return "Conflict: outside availability";
}

export function CalendarGrid({
  weekStart,
  appointments,
  availabilityRanges,
  conflicts,
  onCreateAppointment,
  onMoveAppointment,
  onResizeAppointment,
  onSelectAppointment,
  selectedAppointmentId = null,
}: CalendarGridProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [previewById, setPreviewById] = useState<Record<string, { startsAt: string; endsAt: string }>>({});
  const mondayStart = useMemo(() => startOfWeekMonday(weekStart), [weekStart]);

  const conflictsByAppointmentId = useMemo(() => {
    const map = new Map<string, AppointmentConflict[]>();
    for (const conflict of conflicts) {
      const rows = map.get(conflict.appointmentId) ?? [];
      rows.push(conflict);
      map.set(conflict.appointmentId, rows);
    }
    return map;
  }, [conflicts]);

  useEffect(() => {
    if (!dragState) return;
    const onMove = (event: PointerEvent) => {
      const deltaSlots = Math.round((event.clientY - dragState.startY) / SLOT_HEIGHT);
      const deltaMinutes = deltaSlots * SLOT_MINUTES;
      const originalStart = new Date(dragState.originalStartsAt).getTime();
      const originalEnd = new Date(dragState.originalEndsAt).getTime();

      if (dragState.mode === "move") {
        const startsAt = new Date(originalStart + deltaMinutes * 60_000).toISOString();
        const endsAt = new Date(originalEnd + deltaMinutes * 60_000).toISOString();
        setPreviewById((prev) => ({ ...prev, [dragState.appointmentId]: { startsAt, endsAt } }));
        return;
      }

      const minEnd = originalStart + MIN_DURATION_MINUTES * 60_000;
      const nextEndTs = Math.max(minEnd, originalEnd + deltaMinutes * 60_000);
      const startsAt = dragState.originalStartsAt;
      const endsAt = new Date(nextEndTs).toISOString();
      setPreviewById((prev) => ({ ...prev, [dragState.appointmentId]: { startsAt, endsAt } }));
    };

    const onUp = () => {
      const next = previewById[dragState.appointmentId];
      if (next) {
        if (dragState.mode === "move") {
          onMoveAppointment(dragState.appointmentId, next.startsAt, next.endsAt);
        } else {
          onResizeAppointment(dragState.appointmentId, next.endsAt);
        }
      }
      setDragState(null);
      setPreviewById((prev) => {
        const copy = { ...prev };
        delete copy[dragState.appointmentId];
        return copy;
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragState, onMoveAppointment, onResizeAppointment, previewById]);

  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-[var(--z-border)] bg-[var(--z-surface-2)]">
        <div />
        {DAY_NAMES.map((name, idx) => {
          const d = dayDate(mondayStart, idx);
          return (
            <div key={name} className="px-2 py-2 text-xs text-[var(--z-muted)]">
              <div className="font-semibold text-[var(--z-fg)]">{name}</div>
              <div>{d.toLocaleDateString()}</div>
            </div>
          );
        })}
      </div>

      <div className="max-h-[70vh] overflow-auto">
        <div
          className="grid min-w-[960px] grid-cols-[56px_repeat(7,minmax(0,1fr))]"
          style={{ height: TOTAL_SLOTS * SLOT_HEIGHT }}
        >
          <div className="relative border-r border-[var(--z-border)]">
            {Array.from({ length: TOTAL_SLOTS }, (_, slot) => {
              const minutes = START_MINUTES + slot * SLOT_MINUTES;
              const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
              const mm = String(minutes % 60).padStart(2, "0");
              return (
                <div
                  key={slot}
                  className="border-b border-[var(--z-border)] px-1 text-[10px] text-[var(--z-muted)]"
                  style={{ height: SLOT_HEIGHT }}
                >
                  {mm === "00" ? `${hh}:${mm}` : ""}
                </div>
              );
            })}
          </div>

          {Array.from({ length: 7 }, (_, dayIdx) => {
            const day = dayDate(mondayStart, dayIdx);
            const dayAppointments = appointments.filter(
              (appt) => dayIndexFromDate(mondayStart, appt.startsAt) === dayIdx,
            );
            const dayAvailability = availabilityRanges.filter(
              (slot) => dayIndexFromDate(mondayStart, slot.startsAt) === dayIdx,
            );

            return (
              <div
                key={dayIdx}
                className="relative border-r border-[var(--z-border)]"
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("[data-appt='true']")) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  const y = clamp(event.clientY - rect.top, 0, TOTAL_SLOTS * SLOT_HEIGHT - 1);
                  const slot = Math.floor(y / SLOT_HEIGHT);
                  const startMinutes = START_MINUTES + slot * SLOT_MINUTES;
                  const endMinutes = startMinutes + 30;
                  onCreateAppointment(
                    isoForDayAndMinutes(day, startMinutes),
                    isoForDayAndMinutes(day, endMinutes),
                  );
                }}
              >
                {Array.from({ length: TOTAL_SLOTS }, (_, slot) => (
                  <div
                    key={slot}
                    className="border-b border-[var(--z-border)]"
                    style={{ height: SLOT_HEIGHT }}
                  />
                ))}

                {dayAvailability.map((slot) => {
                  const top = ((minutesFromIso(slot.startsAt) - START_MINUTES) / SLOT_MINUTES) * SLOT_HEIGHT;
                  const height =
                    ((minutesFromIso(slot.endsAt) - minutesFromIso(slot.startsAt)) / SLOT_MINUTES) *
                    SLOT_HEIGHT;
                  return (
                    <div
                      key={slot.id}
                      className="pointer-events-none absolute left-0 right-0"
                      style={{
                        top,
                        height: Math.max(height, SLOT_HEIGHT),
                        backgroundColor: withAlpha(SCHEDULING_ACCENT_HEX, "14"),
                      }}
                    />
                  );
                })}

                {dayAppointments.map((appt) => {
                  const preview = previewById[appt.id];
                  const startsAt = preview?.startsAt ?? appt.startsAt;
                  const endsAt = preview?.endsAt ?? appt.endsAt;
                  const start = minutesFromIso(startsAt);
                  const end = minutesFromIso(endsAt);
                  const top = ((start - START_MINUTES) / SLOT_MINUTES) * SLOT_HEIGHT;
                  const height = ((end - start) / SLOT_MINUTES) * SLOT_HEIGHT;
                  const appointmentConflicts = conflictsByAppointmentId.get(appt.id) ?? [];
                  const conflictText = conflictMessage(appointmentConflicts);
                  const hasConflict = appointmentConflicts.length > 0;
                  const color = appt.color || SCHEDULING_ACCENT_HEX;
                  const tone = normalizeSchedulingStatus(appt.status);
                  return (
                    <div
                      key={appt.id}
                      data-appt="true"
                      className={[
                        "absolute left-1 right-1 rounded border px-2 py-1 text-xs shadow-sm",
                        selectedAppointmentId === appt.id ? "ring-1 ring-white/80" : "",
                        hasConflict ? "border-red-400" : "",
                      ].join(" ")}
                      style={{
                        top,
                        height: Math.max(height, SLOT_HEIGHT),
                        borderColor: hasConflict ? "#f87171" : color,
                        backgroundColor: withAlpha(
                          color,
                          tone === "canceled" ? "1a" : tone === "completed" ? "22" : "30",
                        ),
                      }}
                      title={conflictText ?? `${appt.title}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectAppointment(appt.id);
                      }}
                      onPointerDown={(event) => {
                        const target = event.target as HTMLElement;
                        if (target.closest("[data-resize='true']")) return;
                        event.stopPropagation();
                        setDragState({
                          mode: "move",
                          appointmentId: appt.id,
                          startY: event.clientY,
                          originalStartsAt: appt.startsAt,
                          originalEndsAt: appt.endsAt,
                        });
                      }}
                    >
                      <div className="truncate pr-5 font-medium">{appt.title}</div>
                      <div className="truncate text-[10px] text-[var(--z-muted)]">
                        {new Date(startsAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" - "}
                        {new Date(endsAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {hasConflict ? <div className="absolute right-1 top-1 text-[11px]">⚠</div> : null}
                      <div
                        data-resize="true"
                        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize rounded-b bg-black/20"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          setDragState({
                            mode: "resize",
                            appointmentId: appt.id,
                            startY: event.clientY,
                            originalStartsAt: appt.startsAt,
                            originalEndsAt: appt.endsAt,
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
