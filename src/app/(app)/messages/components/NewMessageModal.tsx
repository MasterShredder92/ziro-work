"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ChannelType } from "@/lib/messaging/types";

type Recipient = { id: string; label: string; role?: string | null };

interface NewMessageModalProps {
  recipients: Recipient[];
  onClose: () => void;
}

const channelOptions: Array<{ id: ChannelType; label: string }> = [
  { id: "in_app", label: "In-app" },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "push", label: "Push" },
];

export function NewMessageModal({ recipients, onClose }: NewMessageModalProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [channel, setChannel] = useState<ChannelType>("in_app");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (selected.length === 0) {
      setError("Pick at least one recipient.");
      return;
    }
    if (!body.trim()) {
      setError("Enter a message body.");
      return;
    }

    setSubmitting(true);
    try {
      const threadRes = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim() || null,
          channelType: channel,
          participantIds: selected,
        }),
      });
      if (!threadRes.ok) {
        const data = (await threadRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to create thread");
      }
      const threadData = (await threadRes.json()) as {
        data?: { id: string };
      };
      const threadId = threadData.data?.id;
      if (!threadId) throw new Error("Thread creation returned no id");

      const msgRes = await fetch(
        `/api/messages/threads/${threadId}/messages`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            body: body.trim(),
            channelType: channel,
            subject: subject.trim() || null,
          }),
        },
      );
      if (!msgRes.ok) {
        const data = (await msgRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to send message");
      }

      router.push(`/messages/threads/${threadId}`);
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="flex w-full max-w-lg flex-col gap-4 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-xl"
      >
        <header className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--z-fg)]">
            New message
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]"
            aria-label="Close"
          >
            x
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--z-muted)]">
              Recipients
            </label>
            <div className="flex max-h-36 flex-wrap gap-1 overflow-y-auto rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] p-2">
              {recipients.length === 0 ? (
                <span className="text-xs text-[var(--z-muted)]">
                  No recipients available.
                </span>
              ) : (
                recipients.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => toggle(r.id)}
                    className={`rounded-full border px-2 py-0.5 text-xs transition ${
                      selected.includes(r.id)
                        ? "border-[var(--z-accent)] bg-[var(--z-accent)] text-[var(--z-on-accent,white)]"
                        : "border-[var(--z-border)] text-[var(--z-fg)] hover:bg-[var(--z-surface-hover)]"
                    }`}
                  >
                    {r.label}
                    {r.role ? ` · ${r.role}` : ""}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-[var(--z-muted)]">
                Subject (optional)
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--z-muted)]">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as ChannelType)}
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              >
                {channelOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--z-muted)]">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full resize-y rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              placeholder="Write your message..."
            />
          </div>

          {error ? (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700">
              {error}
            </div>
          ) : null}

          <footer className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--z-border)] px-3 py-1.5 text-sm text-[var(--z-fg)] hover:bg-[var(--z-surface-hover)]"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-sm font-semibold text-[var(--z-on-accent,white)] hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
