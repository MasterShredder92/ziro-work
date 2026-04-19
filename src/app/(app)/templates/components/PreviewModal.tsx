"use client";

import { useEffect, useState } from "react";
import type { RenderedTemplate } from "@/lib/templates/types";

export interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  rendered: RenderedTemplate | null;
  templateId: string;
  channel?: string | null;
}

type ViewportMode = "mobile" | "desktop";

export function PreviewModal({
  open,
  onClose,
  rendered,
  templateId,
  channel,
}: PreviewModalProps) {
  const [mode, setMode] = useState<ViewportMode>("desktop");
  const [target, setTarget] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSendResult(null);
      setSendError(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleSendTest(): Promise<void> {
    setSending(true);
    setSendResult(null);
    setSendError(null);
    try {
      const res = await fetch(`/api/templates/${templateId}/send-test`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetProfileId: target || undefined,
          versionId: undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(`Send failed (${res.status})`);
      }
      const payload = (await res.json().catch(() => null)) as {
        data?: { delivery?: { simulated?: boolean; threadId?: string | null } };
      } | null;
      const simulated = payload?.data?.delivery?.simulated ?? false;
      if (simulated) {
        setSendResult("Rendered only (no delivery backend configured).");
      } else {
        setSendResult("Test message sent.");
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  const width = mode === "mobile" ? "max-w-sm" : "max-w-3xl";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${width} rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 shadow-2xl`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              Preview
            </div>
            <div className="text-sm font-semibold text-[var(--z-fg)]">
              {channel ? channel.toUpperCase() : "Template"}{" "}
              {rendered ? `· v${rendered.version}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-md border border-[var(--z-border)]">
              <button
                type="button"
                onClick={() => setMode("mobile")}
                className={`px-2 py-1 text-xs ${
                  mode === "mobile"
                    ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] text-[var(--z-accent)]"
                    : "text-[var(--z-fg)]/80"
                }`}
              >
                Mobile
              </button>
              <button
                type="button"
                onClick={() => setMode("desktop")}
                className={`px-2 py-1 text-xs ${
                  mode === "desktop"
                    ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] text-[var(--z-accent)]"
                    : "text-[var(--z-fg)]/80"
                }`}
              >
                Desktop
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-xs text-[var(--z-fg)]"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_4%)] p-3">
          {rendered?.subject ? (
            <div className="mb-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Subject
              </div>
              <div className="text-sm font-semibold text-[var(--z-fg)]">
                {rendered.subject}
              </div>
            </div>
          ) : null}
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-[var(--z-fg)]">
            {rendered?.body ?? "(nothing rendered)"}
          </pre>
          {rendered?.missingMergeFields?.length ? (
            <div className="mt-3 rounded-md border border-[color-mix(in_oklab,var(--z-danger),transparent_55%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] p-2 text-xs text-[var(--z-danger)]">
              Missing fields:{" "}
              {rendered.missingMergeFields.map((f) => (
                <code key={f} className="mr-1">{`{{${f}}}`}</code>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <label className="flex flex-1 items-center gap-2 text-xs text-[var(--z-muted)]">
            <span>Test target profile ID</span>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Leave blank to send to yourself"
              className="flex-1 rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-xs text-[var(--z-fg)]"
            />
          </label>
          <button
            type="button"
            onClick={handleSendTest}
            disabled={sending}
            className="rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] px-3 py-1.5 text-xs font-semibold text-[var(--z-accent)] disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send test"}
          </button>
        </div>

        {sendResult ? (
          <div className="mt-2 rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] p-2 text-xs text-[var(--z-accent)]">
            {sendResult}
          </div>
        ) : null}
        {sendError ? (
          <div className="mt-2 rounded-md border border-[color-mix(in_oklab,var(--z-danger),transparent_55%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] p-2 text-xs text-[var(--z-danger)]">
            {sendError}
          </div>
        ) : null}
      </div>
    </div>
  );
}
