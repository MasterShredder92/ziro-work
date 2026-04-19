"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  FileObject,
  SignatureFieldType,
} from "@/lib/files/types";

export interface SignatureRequestEditorProps {
  file: FileObject;
  canSign: boolean;
}

interface DraftSigner {
  name: string;
  email: string;
  order: number;
}

interface DraftField {
  type: SignatureFieldType;
  label: string;
  page: number;
  required: boolean;
  width: number;
  height: number;
}

const DEFAULT_FIELD_TYPES: SignatureFieldType[] = [
  "signature-draw",
  "initials",
  "text",
  "date",
  "checkbox",
];

export function SignatureRequestEditor({
  file,
  canSign,
}: SignatureRequestEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(`Please sign: ${file.name}`);
  const [message, setMessage] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("14");
  const [signers, setSigners] = useState<DraftSigner[]>([
    { name: "", email: "", order: 1 },
  ]);
  const [fields, setFields] = useState<DraftField[]>([
    {
      type: "signature-draw",
      label: "Signature",
      page: 1,
      required: true,
      width: 220,
      height: 56,
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const resizeRef = useRef<{
    index: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  const signerProgress = useMemo(() => {
    const filled = signers.filter((s) => s.name.trim() && s.email.trim()).length;
    return { filled, total: signers.length };
  }, [signers]);

  const validationWarnings = useMemo(() => {
    const w: string[] = [];
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const s of signers) {
      if (s.email.trim() && !emailRe.test(s.email.trim())) {
        w.push(`Invalid email for “${s.name.trim() || "signer"}”.`);
      }
    }
    const seen = new Set<string>();
    for (const s of signers) {
      const em = s.email.trim().toLowerCase();
      if (!em) continue;
      if (seen.has(em)) w.push(`Duplicate signer email: ${em}`);
      seen.add(em);
    }
    for (const f of fields) {
      if (!f.label.trim()) w.push("Each field needs a label.");
      if (f.page < 1) w.push("Field page numbers must be at least 1.");
      if (f.width < 80 || f.height < 28) w.push("Field boxes should be at least 80×28 pt.");
    }
    return [...new Set(w)];
  }, [signers, fields]);

  const addSigner = () =>
    setSigners((s) => [...s, { name: "", email: "", order: s.length + 1 }]);

  const addField = () =>
    setFields((f) => [
      ...f,
      { type: "text", label: "Field", page: 1, required: false, width: 200, height: 44 },
    ]);

  const beginResize = useCallback(
    (index: number, clientX: number, clientY: number) => {
      const f = fields[index];
      if (!f) return;
      resizeRef.current = {
        index,
        startX: clientX,
        startY: clientY,
        startW: f.width,
        startH: f.height,
      };
    },
    [fields],
  );

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    const s = resizeRef.current;
    if (!s) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    const nw = Math.min(420, Math.max(80, Math.round(s.startW + dx)));
    const nh = Math.min(200, Math.max(28, Math.round(s.startH + dy)));
    setFields((cur) =>
      cur.map((row, idx) => (idx === s.index ? { ...row, width: nw, height: nh } : row)),
    );
  }, []);

  const endResize = useCallback(() => {
    resizeRef.current = null;
  }, []);

  const submit = async () => {
    if (!canSign) return;
    if (!title.trim()) {
      setError("Title required");
      return;
    }
    const cleanSigners = signers.filter((s) => s.name && s.email);
    if (cleanSigners.length === 0) {
      setError("At least one signer required");
      return;
    }
    if (validationWarnings.length > 0) {
      setError("Fix the issues highlighted below before sending.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const expiresAt = expiresInDays
        ? new Date(
            Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000,
          ).toISOString()
        : null;
      const res = await fetch("/api/files/signature", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileId: file.id,
          title,
          message: message || null,
          expiresAt,
          signers: cleanSigners.map((s, i) => ({
            name: s.name,
            email: s.email,
            profileId: null,
            order: i + 1,
          })),
          fields: fields.map((f) => ({
            type: f.type,
            label: f.label,
            page: f.page,
            x: 0,
            y: 0,
            width: f.width,
            height: f.height,
            required: f.required,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed (${res.status})`);
      }
      router.push("/files/signatures");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <h3 className="text-sm font-semibold text-[var(--z-fg)]">Request details</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--z-muted)]">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--z-muted)]">
              Expires in (days)
            </span>
            <input
              type="number"
              min="0"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--z-muted)]">
              Message
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
            />
          </label>
        </div>
      </div>

      <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-[var(--z-muted)]">
            Signers ready:{" "}
            <span className="font-semibold text-[var(--z-fg)]">
              {signerProgress.filled} / {signerProgress.total}
            </span>
          </p>
          <div className="h-1.5 min-w-[120px] flex-1 rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[var(--z-accent)] transition-[width]"
              style={{
                width: `${
                  signerProgress.total
                    ? (signerProgress.filled / signerProgress.total) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--z-fg)]">Signers</h3>
          <button
            type="button"
            onClick={addSigner}
            className="text-xs text-[var(--z-accent)] hover:underline"
          >
            + Add signer
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {signers.map((s, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[1fr,1fr,80px,auto]">
              <input
                placeholder="Name"
                value={s.name}
                onChange={(e) =>
                  setSigners((cur) =>
                    cur.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)),
                  )
                }
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
              />
              <input
                placeholder="Email"
                type="email"
                value={s.email}
                onChange={(e) =>
                  setSigners((cur) =>
                    cur.map((x, idx) => (idx === i ? { ...x, email: e.target.value } : x)),
                  )
                }
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
              />
              <input
                type="number"
                min="1"
                value={s.order}
                onChange={(e) =>
                  setSigners((cur) =>
                    cur.map((x, idx) => (idx === i ? { ...x, order: Number(e.target.value) } : x)),
                  )
                }
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
              />
              <button
                type="button"
                onClick={() =>
                  setSigners((cur) => cur.filter((_, idx) => idx !== i))
                }
                className="rounded-md border border-[var(--z-border)] px-2 py-2 text-xs text-red-400 hover:bg-red-500/10"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--z-fg)]">Fields</h3>
          <button
            type="button"
            onClick={addField}
            className="text-xs text-[var(--z-accent)] hover:underline"
          >
            + Add field
          </button>
        </div>
        <div className="mt-3 space-y-4">
          {fields.map((f, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)]/40 p-3"
            >
              <div className="grid gap-2 md:grid-cols-[1fr,1fr,72px,88px,88px,auto,auto]">
                <select
                  value={f.type}
                  onChange={(e) =>
                    setFields((cur) =>
                      cur.map((x, idx) =>
                        idx === i
                          ? { ...x, type: e.target.value as SignatureFieldType }
                          : x,
                      ),
                    )
                  }
                  className="min-h-11 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
                >
                  {DEFAULT_FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Label"
                  value={f.label}
                  onChange={(e) =>
                    setFields((cur) =>
                      cur.map((x, idx) =>
                        idx === i ? { ...x, label: e.target.value } : x,
                      ),
                    )
                  }
                  className="min-h-11 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
                />
                <input
                  type="number"
                  min="1"
                  value={f.page}
                  onChange={(e) =>
                    setFields((cur) =>
                      cur.map((x, idx) =>
                        idx === i ? { ...x, page: Number(e.target.value) } : x,
                      ),
                    )
                  }
                  className="min-h-11 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
                  title="PDF page"
                />
                <input
                  type="number"
                  min="80"
                  max="420"
                  value={f.width}
                  onChange={(e) =>
                    setFields((cur) =>
                      cur.map((x, idx) =>
                        idx === i
                          ? { ...x, width: Math.max(80, Number(e.target.value) || 80) }
                          : x,
                      ),
                    )
                  }
                  className="min-h-11 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
                  title="Width (pt)"
                />
                <input
                  type="number"
                  min="28"
                  max="200"
                  value={f.height}
                  onChange={(e) =>
                    setFields((cur) =>
                      cur.map((x, idx) =>
                        idx === i
                          ? { ...x, height: Math.max(28, Number(e.target.value) || 28) }
                          : x,
                      ),
                    )
                  }
                  className="min-h-11 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
                  title="Height (pt)"
                />
                <label className="flex min-h-11 items-center gap-2 text-xs text-[var(--z-fg)]">
                  <input
                    type="checkbox"
                    checked={f.required}
                    onChange={(e) =>
                      setFields((cur) =>
                        cur.map((x, idx) =>
                          idx === i ? { ...x, required: e.target.checked } : x,
                        ),
                      )
                    }
                    className="h-5 w-5"
                  />
                  Req.
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFields((cur) => cur.filter((_, idx) => idx !== i))
                  }
                  className="min-h-11 min-w-11 rounded-md border border-[var(--z-border)] px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                >
                  Remove
                </button>
              </div>
              <p className="mt-2 text-[10px] text-[var(--z-muted)]">
                Drag the corner handle to resize (approximate placement — coordinates still
                default to top-left until PDF tooling maps them).
              </p>
              <div className="relative mt-2 inline-block rounded-md border border-dashed border-[var(--z-border)] bg-white/[0.03] p-3">
                <div
                  className="relative rounded border border-[var(--z-accent)]/60 bg-[var(--z-accent)]/10"
                  style={{
                    width: `${Math.min(280, f.width)}px`,
                    height: `${Math.min(120, f.height)}px`,
                  }}
                >
                  <span className="absolute left-2 top-2 text-[10px] font-medium text-[var(--z-fg)]">
                    {f.label || "Field"}
                  </span>
                  <button
                    type="button"
                    aria-label="Resize field"
                    className="absolute bottom-1 right-1 flex h-11 w-11 items-end justify-end rounded-sm border border-[var(--z-border)] bg-[var(--z-surface)] p-1 text-[10px] text-[var(--z-muted)] hover:text-[var(--z-fg)]"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      beginResize(i, e.clientX, e.clientY);
                    }}
                    onPointerMove={(e) => {
                      if (resizeRef.current?.index !== i) return;
                      onResizePointerMove(e);
                    }}
                    onPointerUp={(e) => {
                      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      }
                      endResize();
                    }}
                    onPointerCancel={endResize}
                  >
                    ⤡
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {validationWarnings.length > 0 ? (
        <div className="rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <div className="font-semibold text-amber-50">Before you send</div>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {validationWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="min-h-11 rounded-md border border-[var(--z-border)] px-4 py-2 text-sm text-[var(--z-fg)] hover:bg-white/[0.04]"
        >
          Preview final PDF
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy || !canSign}
          title={!canSign ? "You do not have permission to send signature requests." : undefined}
          className="min-h-11 rounded-md bg-[var(--z-accent)] px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send signature request"}
        </button>
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close preview"
            onClick={() => setPreviewOpen(false)}
          />
          <div
            className="relative z-10 w-full max-w-lg rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sig-preview-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="sig-preview-title" className="text-base font-semibold text-[var(--z-fg)]">
                  Preview (approximate)
                </h3>
                <p className="mt-1 text-xs text-[var(--z-muted)]">
                  Letter-size page aspect ratio. Box sizes reflect width/height you set; positions
                  are not final until mapped on the PDF.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="min-h-11 min-w-11 rounded-md border border-[var(--z-border)] text-sm text-[var(--z-fg)] hover:bg-white/[0.04]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mx-auto mt-4 max-h-[min(70vh,640px)] overflow-auto rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] p-4">
              <div
                className="mx-auto flex flex-col gap-3 bg-white/[0.04] p-4 shadow-inner"
                style={{ aspectRatio: "8.5 / 11", maxWidth: "420px" }}
              >
                <div className="text-[11px] font-semibold text-[var(--z-fg)]">{title}</div>
                {fields.map((f, idx) => {
                  const scale = 0.45;
                  return (
                    <div
                      key={idx}
                      className="rounded border border-[var(--z-accent)]/50 bg-[var(--z-accent)]/10"
                      style={{
                        width: `${Math.max(80, f.width * scale)}px`,
                        minHeight: `${Math.max(28, f.height * scale)}px`,
                      }}
                    >
                      <div className="px-2 py-1 text-[10px] text-[var(--z-fg)]">
                        <span className="font-semibold">{f.label || "Field"}</span>
                        <span className="ml-2 text-[var(--z-muted)]">
                          {f.type} · p{f.page} · {f.width}×{f.height}pt
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="min-h-11 rounded-md bg-[var(--z-accent)] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
