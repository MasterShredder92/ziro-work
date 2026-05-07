"use client";

import { useState } from "react";

export type CheckoutFormProps = {
  itemId: string;
  apiPath?: string;
  defaultProfileId?: string;
  onSuccess?: () => void;
};

export function CheckoutForm({
  itemId,
  apiPath = "/inventory/api/checkout",
  defaultProfileId,
  onSuccess,
}: CheckoutFormProps) {
  const [profileId, setProfileId] = useState(defaultProfileId ?? "");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!profileId.trim()) {
      setError("Profile is required.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          itemId,
          profileId: profileId.trim(),
          dueDate: dueDate || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Checkout failed (${res.status})`);
      }
      setSuccess("Checkout recorded.");
      setProfileId(defaultProfileId ?? "");
      setDueDate("");
      setNotes("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
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
          New checkout
        </div>
        <p className="mt-0.5 text-xs text-[var(--z-muted)]">
          Record that this item has been handed off to a teacher or student.
        </p>
      </div>
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Profile ID
        </span>
        <input
          className="mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          placeholder="profile-uuid"
          required
        />
      </label>
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Due date
        </span>
        <input
          type="date"
          className="mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
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
        className="rounded-md bg-[#c4f036]/20 px-3 py-1.5 text-sm font-semibold text-[#c4f036] hover:bg-[#c4f036]/30 disabled:opacity-60"
      >
        {pending ? "Checking out…" : "Check out"}
      </button>
      {error ? (
        <div className="text-xs text-rose-300">{error}</div>
      ) : null}
      {success ? (
        <div className="text-xs text-[#c4f036]">{success}</div>
      ) : null}
    </form>
  );
}
