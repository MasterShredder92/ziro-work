"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import type { Appointment, AppointmentStatus } from "@/lib/scheduling/types";
import { Button } from "@/components/ui/Button";
import {
  APPOINTMENT_COLOR_SWATCHES,
  SCHEDULING_ACCENT_HEX,
} from "@/lib/scheduling/colorSemantics";

type AppointmentInspectorProps = {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSave: (
    appointmentId: string,
    patch: Partial<{
      title: string;
      startsAt: string;
      endsAt: string;
      notes: string | null;
      status: AppointmentStatus;
      color: string | null;
    }>,
  ) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onDuplicateAppointment: (appointmentId: string) => void;
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

export function AppointmentInspector({
  open,
  appointment,
  onClose,
  onSave,
  onCancelAppointment,
  onDuplicateAppointment,
}: AppointmentInspectorProps) {
  const [title, setTitle] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [status, setStatus] = useState<AppointmentStatus>("scheduled");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState(SCHEDULING_ACCENT_HEX);

  useEffect(() => {
    if (!appointment) return;
    setTitle(appointment.title);
    setStartsAtLocal(toLocalInput(appointment.startsAt));
    const duration = Math.max(
      15,
      Math.round(
        (new Date(appointment.endsAt).getTime() - new Date(appointment.startsAt).getTime()) / 60_000,
      ),
    );
    setDurationMinutes(duration);
    setStatus(appointment.status);
    setNotes(appointment.notes ?? "");
    setColor(appointment.color ?? SCHEDULING_ACCENT_HEX);
  }, [appointment?.id, appointment]);

  const computedEndLocal = useMemo(() => {
    if (!startsAtLocal) return "";
    const start = new Date(startsAtLocal);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    return toLocalInput(end.toISOString());
  }, [startsAtLocal, durationMinutes]);

  const hasValidStart = startsAtLocal.length > 0 && Number.isFinite(new Date(startsAtLocal).getTime());
  const canSave = hasValidStart && durationMinutes >= 15;

  if (!open || !appointment) return null;

  return (
    <div className="fixed inset-0 z-[80] flex" role="presentation">
      <button
        type="button"
        aria-label="Close appointment inspector"
        className="flex-1 bg-black/40"
        onClick={onClose}
      />
      <aside className="h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-96">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">Appointment</div>
              <div className="text-sm font-semibold text-[var(--z-fg)]">{appointment.title}</div>
            </div>
            <button
              type="button"
              className="rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            <label className="block text-xs">
              <span className="mb-1 block text-[var(--z-muted)]">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              />
            </label>

            <label className="block text-xs">
              <span className="mb-1 block text-[var(--z-muted)]">Date / time</span>
              <input
                type="datetime-local"
                value={startsAtLocal}
                onChange={(e) => setStartsAtLocal(e.target.value)}
                className="w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              />
            </label>

            <label className="block text-xs">
              <span className="mb-1 block text-[var(--z-muted)]">Duration (minutes)</span>
              <input
                type="number"
                min={15}
                step={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(15, Number(e.target.value) || 15))}
                className="w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              />
            </label>

            <div className="text-xs text-[var(--z-muted)]">Ends: {computedEndLocal || "—"}</div>

            <label className="block text-xs">
              <span className="mb-1 block text-[var(--z-muted)]">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
            </label>

            <label className="block text-xs">
              <span className="mb-1 block text-[var(--z-muted)]">Notes</span>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full resize-y rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              />
            </label>
            <div className="text-xs">
              <span className="mb-1 block text-[var(--z-muted)]">Color</span>
              <div className="flex flex-wrap gap-2">
                {APPOINTMENT_COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setColor(swatch)}
                    className={[
                      "h-6 w-6 rounded-full border",
                      color === swatch ? "border-white" : "border-[var(--z-border)]",
                    ].join(" ")}
                    style={{ backgroundColor: swatch }}
                    aria-label={`Select appointment color ${swatch}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[var(--z-border)] p-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onDuplicateAppointment(appointment.id)}
              >
                Duplicate
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="border border-red-500/40 text-red-400 hover:bg-red-500/10"
                onClick={() => onCancelAppointment(appointment.id)}
              >
                Cancel appointment
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={!canSave}
              onClick={() =>
                onSave(appointment.id, {
                  title: title.trim() || "Untitled appointment",
                  startsAt: fromLocalInput(startsAtLocal),
                  endsAt: new Date(
                    new Date(startsAtLocal).getTime() + durationMinutes * 60_000,
                  ).toISOString(),
                  status,
                  notes: notes.trim() ? notes.trim() : null,
                  color,
                })
              }
            >
              Save
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
