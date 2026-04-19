"use client";

import { useEffect, useState } from "react";
import { FilePreview } from "./previews/FilePreview";
import { SignatureCanvas } from "./previews/SignatureCanvas";

export interface SignatureSignerFlowProps {
  token: string;
}

type Surface = {
  request: {
    id: string;
    title: string;
    message: string | null;
    status: string;
    fields: Array<{
      id: string;
      type: string;
      label: string;
      required: boolean;
      value: string | null;
    }>;
    signers: Array<{
      id: string;
      name: string;
      email: string;
      status: string;
      token: string;
    }>;
    completedAt: string | null;
    expiresAt: string | null;
  };
  file: {
    id: string;
    name: string;
    mimeType: string;
  };
  signer: {
    id: string;
    name: string;
    email: string;
    status: string;
  } | null;
};

export function SignatureSignerFlow({ token }: SignatureSignerFlowProps) {
  const [surface, setSurface] = useState<Surface | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/signature/${token}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Error ${res.status}`);
      }
      const data = await res.json();
      const s = data.data as Surface;
      setSurface(s);
      const initial: Record<string, string> = {};
      for (const f of s.request.fields) if (f.value) initial[f.id] = f.value;
      setValues(initial);
      if (s.request.status === "completed") setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const sendAction = async (
    body: Record<string, unknown>,
  ): Promise<Surface["request"] | null> => {
    const res = await fetch(`/api/files/signature/${token}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Error ${res.status}`);
    }
    const data = await res.json();
    return data.data ?? null;
  };

  const handleFill = async (fieldId: string, value: string) => {
    try {
      setBusy(true);
      await sendAction({ action: "fill", fieldId, value });
      setValues((prev) => ({ ...prev, [fieldId]: value }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSign = async () => {
    try {
      setBusy(true);
      // First, persist all values.
      for (const field of surface?.request.fields ?? []) {
        const v = values[field.id];
        if (v != null) {
          await sendAction({ action: "fill", fieldId: field.id, value: v });
        }
      }
      await sendAction({ action: "sign" });
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    try {
      setBusy(true);
      await sendAction({ action: "decline", reason: declineReason || null });
      setDeclined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-[var(--z-muted)]" role="status">
        Loading…
      </div>
    );
  }
  if (error || !surface) {
    return (
      <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
        {error ?? "Unable to load signature request."}
      </div>
    );
  }

  const pastDue =
    surface.request.expiresAt != null &&
    new Date(surface.request.expiresAt).getTime() < Date.now();
  if (surface.request.status === "expired" || pastDue) {
    return (
      <div className="mx-auto max-w-md rounded-md border border-amber-500/40 bg-amber-500/10 p-6 text-center">
        <h1 className="text-lg font-semibold text-amber-100">This request has expired</h1>
        <p className="mt-2 text-sm text-amber-200/90">
          Ask the sender for a new signature link if you still need to sign.
        </p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="mx-auto max-w-md rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center">
        <div className="text-2xl">✓</div>
        <h1 className="mt-2 text-lg font-semibold text-[var(--z-fg)]">
          Thank you — your signature has been recorded.
        </h1>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="mx-auto max-w-md rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center">
        <h1 className="text-lg font-semibold text-[var(--z-fg)]">Signature declined.</h1>
        <p className="mt-1 text-sm text-[var(--z-muted)]">
          The sender has been notified.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
          Signature request
        </div>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">{surface.request.title}</h1>
        {surface.request.message ? (
          <p className="mt-1 text-sm text-[var(--z-muted)]">{surface.request.message}</p>
        ) : null}
        {surface.signer ? (
          <p className="mt-2 text-xs text-[var(--z-muted)]">
            Signing as <span className="text-[var(--z-fg)]">{surface.signer.name}</span>
            {" · "}
            {surface.signer.email}
          </p>
        ) : null}
      </header>

      <section>
        <FilePreview url={null} mimeType={surface.file.mimeType} name={surface.file.name} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Fields
        </h2>
        {surface.request.fields.map((field) => (
          <div
            key={field.id}
            className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3"
          >
            <label className="mb-1 block text-xs font-semibold text-[var(--z-fg)]">
              {field.label}
              {field.required ? <span className="ml-1 text-red-400">*</span> : null}
            </label>
            {field.type === "checkbox" ? (
              <input
                type="checkbox"
                checked={values[field.id] === "true"}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [field.id]: e.target.checked ? "true" : "false" }))
                }
                onBlur={(e) => handleFill(field.id, e.target.checked ? "true" : "false")}
              />
            ) : field.type === "date" ? (
              <input
                type="date"
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                onBlur={(e) => handleFill(field.id, e.target.value)}
                className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
              />
            ) : field.type === "signature-draw" || field.type === "initials" ? (
              <SignatureCanvas
                initialDataUrl={values[field.id] ?? null}
                onChange={(data) => {
                  const v = data ?? "";
                  setValues((prev) => ({ ...prev, [field.id]: v }));
                  if (v) void handleFill(field.id, v);
                }}
              />
            ) : (
              <input
                type="text"
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                onBlur={(e) => handleFill(field.id, e.target.value)}
                className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
              />
            )}
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Reason to decline (optional)"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-xs text-[var(--z-fg)]"
          />
        </div>
        <button
          type="button"
          onClick={handleDecline}
          disabled={busy}
          className="rounded-md border border-[var(--z-border)] px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={handleSign}
          disabled={busy}
          className="rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Signing…" : "Sign & Submit"}
        </button>
      </div>
    </div>
  );
}
