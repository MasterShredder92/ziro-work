"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { showFilesToast } from "./filesToast";

export interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  folderId?: string | null;
  targetFileId?: string | null;
  onUploaded?: (fileId: string) => void;
  /** When set (e.g. drag-drop), seed the picker */
  initialFile?: File | null;
}

const MAX_BYTES = 120 * 1024 * 1024;
const WARN_BYTES = 25 * 1024 * 1024;
const UPLOAD_RETRIES = 3;
/** Use chunked API for large version uploads (server merges chunks). */
const CHUNKED_VERSION_THRESHOLD = 1024 * 1024;
const CHUNK_SIZE = 256 * 1024;

const BLOCKED_MIME_PREFIXES = ["application/x-msdownload", "application/x-dosexec"];
const BLOCKED_EXTENSIONS = [".exe", ".bat", ".cmd", ".scr", ".msi", ".dll"];

async function fileToBase64(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  if (typeof btoa === "function") return btoa(binary);
  return Buffer.from(binary, "binary").toString("base64");
}

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function validateFile(f: File): string | null {
  const lower = f.name.toLowerCase();
  for (const ext of BLOCKED_EXTENSIONS) {
    if (lower.endsWith(ext)) return `Blocked file type (${ext})`;
  }
  const mt = (f.type || "").toLowerCase();
  for (const p of BLOCKED_MIME_PREFIXES) {
    if (mt.startsWith(p)) return "This file type cannot be uploaded.";
  }
  if (f.size > MAX_BYTES) {
    return `File exceeds maximum size (${Math.round(MAX_BYTES / (1024 * 1024))} MB).`;
  }
  return null;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export function FileUploadModal({
  open,
  onClose,
  folderId = null,
  targetFileId = null,
  onUploaded,
  initialFile = null,
}: FileUploadModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  /** New file(s); version upload always uses a single file */
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<"idle" | "preparing" | "uploading">("idle");
  const [progress, setProgress] = useState(0);
  const [batchLabel, setBatchLabel] = useState<string | null>(null);
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
  const [speedLabel, setSpeedLabel] = useState<string | null>(null);
  const [chunkMeta, setChunkMeta] = useState<string | null>(null);
  const [retryInfo, setRetryInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setName("");
      setDescription("");
      setNotes("");
      setError(null);
      setSubmitting(false);
      setPhase("idle");
      setProgress(0);
      setBatchLabel(null);
      setFileProgress({});
      setSpeedLabel(null);
      setChunkMeta(null);
      setRetryInfo(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && initialFile) {
      const v = validateFile(initialFile);
      if (v) {
        setError(v);
        setFiles([]);
      } else {
        setFiles([initialFile]);
        setName(initialFile.name);
      }
    }
  }, [open, initialFile]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const pickFiles = useCallback(
    (list: FileList | File[] | null) => {
      if (!list || !list.length) {
        setFiles([]);
        return;
      }
      const arr = Array.from(list as File[]);
      const firstErr: string | null = arr.map(validateFile).find(Boolean) ?? null;
      if (firstErr) {
        setError(firstErr);
        setFiles([]);
        return;
      }
      setError(null);
      if (targetFileId) {
        setFiles([arr[0]!]);
        setName((n) => n || arr[0]!.name);
        return;
      }
      setFiles(arr);
      setName((n) => n || arr[0]!.name);
    },
    [targetFileId],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const dt = e.dataTransfer?.files;
      if (dt?.length) pickFiles(dt);
    },
    [pickFiles],
  );

  const uploadOnce = async (
    file: File,
    opts: { displayName?: string; checksum: string | null },
  ): Promise<string> => {
    const base64 = await fileToBase64(file);
    const uploadPayload = {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      base64,
      notes: notes || null,
      checksum: opts.checksum,
    };
    const url = targetFileId
      ? `/api/files/${targetFileId}/upload`
      : "/api/files";
    const body = targetFileId
      ? uploadPayload
      : {
          name: (opts.displayName ?? name ?? file.name).trim() || file.name,
          description: description || null,
          folderId: folderId || null,
          mimeType: uploadPayload.mimeType,
          size: uploadPayload.size,
          upload: uploadPayload,
        };
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Upload failed (${res.status})`);
    }
    const data = await res.json();
    return data?.data?.id ?? targetFileId ?? "";
  };

  const uploadVersionChunked = async (file: File, fileId: string): Promise<string> => {
    const uploadId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `u_${Date.now()}`;
    const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
    const t0 = performance.now();
    let chunkAttemptsTotal = 0;
    for (let i = 0; i < totalChunks; i += 1) {
      const start = i * CHUNK_SIZE;
      const slice = file.slice(start, start + CHUNK_SIZE);
      const b64 = await fileToBase64(slice);
      let lastErr: Error | null = null;
      let accepted = false;
      let fileIdOut: string | null = null;
      for (let attempt = 1; attempt <= UPLOAD_RETRIES && !accepted; attempt += 1) {
        chunkAttemptsTotal += 1;
        const res = await fetch(`/api/files/${fileId}/upload/chunk`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            uploadId,
            chunkIndex: i,
            totalChunks,
            base64: b64,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            notes: notes || null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          lastErr = new Error(data?.error || `Chunk ${i + 1} failed (${res.status})`);
          if (attempt < UPLOAD_RETRIES) await sleep(350 * attempt);
          continue;
        }
        if (data?.data?.complete === true) {
          accepted = true;
          fileIdOut = data?.data?.file?.id ?? fileId;
          break;
        }
        if (data?.data?.complete === false) {
          accepted = true;
          const received = Number(data?.data?.received ?? i + 1);
          const pct = Math.round((received / totalChunks) * 100);
          setProgress(Math.min(99, pct));
          const elapsed = (performance.now() - t0) / 1000;
          const uploadedBytes = Math.min(file.size, received * CHUNK_SIZE);
          const speed = elapsed > 0 ? uploadedBytes / elapsed : 0;
          const remaining = Math.max(0, file.size - uploadedBytes);
          const eta = speed > 0 ? remaining / speed : 0;
          setSpeedLabel(
            `${(speed / (1024 * 1024)).toFixed(1)} MB/s · ETA ~${Math.max(0, Math.ceil(eta))}s`,
          );
          setChunkMeta(`Received ${received}/${totalChunks} parts`);
          setRetryInfo(`Chunk ${i + 1}: ${attempt} attempt(s) · total tries ${chunkAttemptsTotal}`);
          break;
        }
        lastErr = new Error("Unexpected chunk response");
        if (attempt < UPLOAD_RETRIES) await sleep(350 * attempt);
      }
      if (!accepted) throw lastErr ?? new Error(`Chunk ${i + 1} upload failed`);
      if (fileIdOut) {
        const elapsed = (performance.now() - t0) / 1000;
        const mbps = elapsed > 0 ? file.size / elapsed / (1024 * 1024) : 0;
        setSpeedLabel(`${mbps.toFixed(1)} MB/s (avg)`);
        setChunkMeta(`All ${totalChunks} parts merged`);
        setRetryInfo(`Total chunk POST attempts: ${chunkAttemptsTotal}`);
        return fileIdOut;
      }
    }
    throw new Error("Chunk upload did not complete");
  };

  const uploadWithRetries = async (
    file: File,
    opts: { displayName?: string; key: string },
  ): Promise<string> => {
    let checksum: string | null = null;
    try {
      checksum = await sha256Hex(file);
    } catch {
      checksum = null;
    }
    let lastErr: Error | null = null;
    for (let attempt = 1; attempt <= UPLOAD_RETRIES; attempt += 1) {
      try {
        if (targetFileId && file.size >= CHUNKED_VERSION_THRESHOLD) {
          setPhase("uploading");
          setChunkMeta("Chunked upload…");
          return await uploadVersionChunked(file, targetFileId);
        }
        return await uploadOnce(file, {
          displayName: opts.displayName,
          checksum,
        });
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
        if (attempt < UPLOAD_RETRIES) {
          await sleep(400 * attempt);
        }
      }
    }
    throw lastErr ?? new Error("Upload failed");
  };

  const submit = async () => {
    if (!files.length) {
      setError("Please select a file");
      return;
    }
    for (const f of files) {
      const v = validateFile(f);
      if (v) {
        setError(v);
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    setPhase("preparing");
    setProgress(0);
    setFileProgress({});

    try {
      if (targetFileId || files.length === 1) {
        const f = files[0]!;
        setBatchLabel(f.name);
        setPhase("preparing");
        setProgress(15);
        const id = await uploadWithRetries(f, { key: f.name });
        setPhase("uploading");
        setProgress(100);
        showFilesToast(
          targetFileId ? "New version uploaded." : "File uploaded successfully.",
          "success",
        );
        onUploaded?.(id);
        onClose();
        router.refresh();
        return;
      }

      let done = 0;
      const total = files.length;
      let lastId = "";
      for (const f of files) {
        setBatchLabel(`${f.name} (${done + 1} of ${total})`);
        setPhase("preparing");
        const pctBase = (done / total) * 100;
        setProgress(Math.round(pctBase + 5));
        setFileProgress((prev) => ({ ...prev, [f.name]: 10 }));
        const id = await uploadWithRetries(f, {
          displayName: f.name,
          key: f.name,
        });
        lastId = id;
        done += 1;
        setProgress(Math.round((done / total) * 100));
        setFileProgress((prev) => ({ ...prev, [f.name]: 100 }));
      }
      showFilesToast(`${total} files uploaded.`, "success");
      onUploaded?.(lastId);
      onClose();
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showFilesToast(msg, "error");
    } finally {
      setSubmitting(false);
      setPhase("idle");
      setProgress(0);
      setBatchLabel(null);
    }
  };

  if (!open) return null;

  const primary = files[0];
  const sizeWarn = primary && primary.size >= WARN_BYTES;
  const multi = !targetFileId && files.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--z-fg)]">
            {targetFileId ? "Upload new version" : "Upload file"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center text-sm transition-colors ${
            dragOver
              ? "border-[var(--z-accent)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)]"
              : "border-[var(--z-border)] text-[var(--z-muted)] hover:border-[var(--z-accent)]/50"
          }`}
        >
          <div className="text-2xl">⬆</div>
          <div className="mt-2">
            {files.length ? (
              <span className="text-[var(--z-fg)]">
                {multi
                  ? `${files.length} files selected`
                  : files[0]?.name}
              </span>
            ) : (
              <>Drag &amp; drop or click to browse</>
            )}
          </div>
          <p className="mt-2 max-w-xs text-[10px] text-[var(--z-muted)]">
            Executable files are blocked. Max {Math.round(MAX_BYTES / (1024 * 1024))} MB.
            {!targetFileId ? " Multiple files allowed for new uploads." : ""}
          </p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple={!targetFileId}
            onChange={(e) => pickFiles(e.target.files)}
          />
        </div>

        {multi ? (
          <ul className="mt-3 max-h-32 space-y-1 overflow-y-auto rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-left text-xs text-[var(--z-muted)]">
            {files.map((f) => (
              <li key={`${f.name}-${f.size}`} className="flex justify-between gap-2">
                <span className="truncate text-[var(--z-fg)]">{f.name}</span>
                <span className="shrink-0">
                  {fileProgress[f.name] != null ? `${fileProgress[f.name]}%` : "—"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {sizeWarn ? (
          <div className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Large file ({(primary!.size / (1024 * 1024)).toFixed(1)} MB) — upload may take a
            moment.
          </div>
        ) : null}

        {!targetFileId && !multi ? (
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--z-muted)]">
                Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
                placeholder="Document name"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--z-muted)]">
                Description
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
              />
            </label>
          </div>
        ) : null}

        {targetFileId ? (
          <div className="mt-4">
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--z-muted)]">
                Version notes
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
              />
            </label>
          </div>
        ) : null}

        {submitting ? (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
              <span>
                {batchLabel
                  ? batchLabel
                  : phase === "preparing"
                    ? "Preparing…"
                    : "Uploading…"}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full bg-[var(--z-accent)] transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--z-muted)]">
              Retries enabled for transient failures. SHA-256 verified when supported.
            </p>
            {speedLabel ? (
              <p className="text-[10px] text-[var(--z-fg)]">{speedLabel}</p>
            ) : null}
            {chunkMeta ? (
              <p className="text-[10px] text-[var(--z-muted)]">{chunkMeta}</p>
            ) : null}
            {retryInfo ? (
              <p className="text-[10px] text-[var(--z-muted)]">{retryInfo}</p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--z-border)] px-3 py-2 text-sm text-[var(--z-fg)] hover:bg-white/[0.04]"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !files.length}
            className="rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Working…" : multi ? `Upload ${files.length} files` : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
