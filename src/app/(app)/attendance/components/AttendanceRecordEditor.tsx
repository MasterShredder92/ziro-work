"use client";

import { useState } from "react";
import type {
  AttendanceRecord,
  AttendanceStatus,
} from "@/lib/attendance/types";

const STATUSES: AttendanceStatus[] = [
  "present",
  "tardy",
  "absent",
  "no_show",
  "excused",
  "makeup",
];

/**
 * Override an existing attendance record with a new status + reason.
 * Uses PATCH /api/attendance/:recordId with an `override` payload.
 */
export function AttendanceRecordEditor({
  record,
  onSaved,
}: {
  record: AttendanceRecord;
  onSaved?: (next: AttendanceRecord) => void;
}) {
  const [status, setStatus] = useState<AttendanceStatus>(record.status);
  const [reasonText, setReasonText] = useState("");
  const [minutesLate, setMinutesLate] = useState<string>(
    record.minutes_late?.toString() ?? "",
  );
  const [notes, setNotes] = useState(record.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reasonText.trim()) {
      setError("Reason is required for overrides.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attendance/${record.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": record.tenant_id,
        },
        body: JSON.stringify({
          override: {
            status,
            reasonText,
            minutesLate: minutesLate ? Number(minutesLate) : null,
            notes: notes || null,
          },
        }),
      });
      if (!res.ok) {
        setError(`Override failed (${res.status})`);
        return;
      }
      const json = (await res.json()) as { data: AttendanceRecord };
      onSaved?.(json.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3"
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        Override record
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="block mb-1 text-[var(--z-muted)]">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[var(--z-fg)]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="block mb-1 text-[var(--z-muted)]">Minutes late</span>
          <input
            type="number"
            min={0}
            value={minutesLate}
            onChange={(e) => setMinutesLate(e.target.value)}
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[var(--z-fg)]"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="block mb-1 text-[var(--z-muted)]">
            Override reason *
          </span>
          <input
            type="text"
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[var(--z-fg)]"
            placeholder="e.g. corrected after roster review"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="block mb-1 text-[var(--z-muted)]">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[var(--z-fg)]"
          />
        </label>
      </div>
      {error ? <div className="text-xs text-red-400">{error}</div> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 rounded-md bg-[#00ffd0] text-black text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save override"}
        </button>
      </div>
    </form>
  );
}
