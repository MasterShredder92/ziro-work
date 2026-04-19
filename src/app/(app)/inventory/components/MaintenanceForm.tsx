"use client";

import { useState } from "react";
import type {
  InventoryMaintenanceKind,
  InventoryMaintenanceStatus,
} from "@/lib/inventory/types";

export type MaintenanceFormProps = {
  itemId: string;
  apiPath?: string;
  onSuccess?: () => void;
};

const KINDS: InventoryMaintenanceKind[] = [
  "inspection",
  "repair",
  "cleaning",
  "tuning",
  "calibration",
  "replacement_part",
  "other",
];

const STATUSES: InventoryMaintenanceStatus[] = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
];

export function MaintenanceForm({
  itemId,
  apiPath = "/inventory/api/maintenance",
  onSuccess,
}: MaintenanceFormProps) {
  const [summary, setSummary] = useState("");
  const [kind, setKind] = useState<InventoryMaintenanceKind>("inspection");
  const [status, setStatus] = useState<InventoryMaintenanceStatus>("scheduled");
  const [scheduledFor, setScheduledFor] = useState("");
  const [cost, setCost] = useState("");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!summary.trim()) {
      setError("Summary is required.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          itemId,
          payload: {
            summary: summary.trim(),
            kind,
            status,
            scheduledFor: scheduledFor || undefined,
            cost: cost ? Number(cost) : undefined,
            vendor: vendor || undefined,
            notes: notes || undefined,
          },
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Maintenance failed (${res.status})`);
      }
      setSuccess("Maintenance logged.");
      setSummary("");
      setNotes("");
      setCost("");
      setVendor("");
      setScheduledFor("");
      setKind("inspection");
      setStatus("scheduled");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Maintenance failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4"
    >
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Log maintenance
        </div>
        <p className="mt-0.5 text-xs text-[var(--z-muted)]">
          Record inspections, repairs, tuning, and other service events.
        </p>
      </div>
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Summary
        </span>
        <input
          className="mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="E.g., Replaced bridge on cello #3"
          required
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Kind
          </span>
          <select
            className="mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
            value={kind}
            onChange={(e) =>
              setKind(e.target.value as InventoryMaintenanceKind)
            }
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Status
          </span>
          <select
            className="mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as InventoryMaintenanceStatus)
            }
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Scheduled for
          </span>
          <input
            type="date"
            className="mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Cost (USD)
          </span>
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Vendor
        </span>
        <input
          className="mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Notes
        </span>
        <textarea
          className="mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[#00ff88]/20 px-3 py-1.5 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/30 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Log maintenance"}
      </button>
      {error ? (
        <div className="text-xs text-rose-300">{error}</div>
      ) : null}
      {success ? (
        <div className="text-xs text-[#00ff88]">{success}</div>
      ) : null}
    </form>
  );
}
