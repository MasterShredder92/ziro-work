"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { showFilesToast } from "./filesToast";
const MAX_BYTES = 120 * 1024 * 1024;
const WARN_BYTES = 25 * 1024 * 1024;
const UPLOAD_RETRIES = 3;
/** Use chunked API for large version uploads (server merges chunks). */
const CHUNKED_VERSION_THRESHOLD = 1024 * 1024;
const CHUNK_SIZE = 256 * 1024;
const BLOCKED_MIME_PREFIXES = ["application/x-msdownload", "application/x-dosexec"];
const BLOCKED_EXTENSIONS = [".exe", ".bat", ".cmd", ".scr", ".msi", ".dll"];
async function fileToBase64(file) {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1)
        binary += String.fromCharCode(bytes[i]);
    if (typeof btoa === "function")
        return btoa(binary);
    return Buffer.from(binary, "binary").toString("base64");
}
async function sha256Hex(file) {
    const buf = await file.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}
function validateFile(f) {
    const lower = f.name.toLowerCase();
    for (const ext of BLOCKED_EXTENSIONS) {
        if (lower.endsWith(ext))
            return `Blocked file type (${ext})`;
    }
    const mt = (f.type || "").toLowerCase();
    for (const p of BLOCKED_MIME_PREFIXES) {
        if (mt.startsWith(p))
            return "This file type cannot be uploaded.";
    }
    if (f.size > MAX_BYTES) {
        return `File exceeds maximum size (${Math.round(MAX_BYTES / (1024 * 1024))} MB).`;
    }
    return null;
}
async function sleep(ms) {
    await new Promise((r) => setTimeout(r, ms));
}
export function FileUploadModal({ open, onClose, folderId = null, targetFileId = null, onUploaded, initialFile = null, }) {
    var _a;
    const router = useRouter();
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    /** New file(s); version upload always uses a single file */
    const [files, setFiles] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [phase, setPhase] = useState("idle");
    const [progress, setProgress] = useState(0);
    const [batchLabel, setBatchLabel] = useState(null);
    const [fileProgress, setFileProgress] = useState({});
    const [speedLabel, setSpeedLabel] = useState(null);
    const [chunkMeta, setChunkMeta] = useState(null);
    const [retryInfo, setRetryInfo] = useState(null);
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
            }
            else {
                setFiles([initialFile]);
                setName(initialFile.name);
            }
        }
    }, [open, initialFile]);
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === "Escape")
                onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);
    const pickFiles = useCallback((list) => {
        var _a;
        if (!list || !list.length) {
            setFiles([]);
            return;
        }
        const arr = Array.from(list);
        const firstErr = (_a = arr.map(validateFile).find(Boolean)) !== null && _a !== void 0 ? _a : null;
        if (firstErr) {
            setError(firstErr);
            setFiles([]);
            return;
        }
        setError(null);
        if (targetFileId) {
            setFiles([arr[0]]);
            setName((n) => n || arr[0].name);
            return;
        }
        setFiles(arr);
        setName((n) => n || arr[0].name);
    }, [targetFileId]);
    const onDrop = useCallback((e) => {
        var _a;
        e.preventDefault();
        setDragOver(false);
        const dt = (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.files;
        if (dt === null || dt === void 0 ? void 0 : dt.length)
            pickFiles(dt);
    }, [pickFiles]);
    const uploadOnce = async (file, opts) => {
        var _a, _b, _c, _d, _e;
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
                name: ((_b = (_a = opts.displayName) !== null && _a !== void 0 ? _a : name) !== null && _b !== void 0 ? _b : file.name).trim() || file.name,
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
            throw new Error((data === null || data === void 0 ? void 0 : data.error) || `Upload failed (${res.status})`);
        }
        const data = await res.json();
        return (_e = (_d = (_c = data === null || data === void 0 ? void 0 : data.data) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : targetFileId) !== null && _e !== void 0 ? _e : "";
    };
    const uploadVersionChunked = async (file, fileId) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const uploadId = typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `u_${Date.now()}`;
        const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
        const t0 = performance.now();
        let chunkAttemptsTotal = 0;
        for (let i = 0; i < totalChunks; i += 1) {
            const start = i * CHUNK_SIZE;
            const slice = file.slice(start, start + CHUNK_SIZE);
            const b64 = await fileToBase64(slice);
            let lastErr = null;
            let accepted = false;
            let fileIdOut = null;
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
                    lastErr = new Error((data === null || data === void 0 ? void 0 : data.error) || `Chunk ${i + 1} failed (${res.status})`);
                    if (attempt < UPLOAD_RETRIES)
                        await sleep(350 * attempt);
                    continue;
                }
                if (((_a = data === null || data === void 0 ? void 0 : data.data) === null || _a === void 0 ? void 0 : _a.complete) === true) {
                    accepted = true;
                    fileIdOut = (_d = (_c = (_b = data === null || data === void 0 ? void 0 : data.data) === null || _b === void 0 ? void 0 : _b.file) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : fileId;
                    break;
                }
                if (((_e = data === null || data === void 0 ? void 0 : data.data) === null || _e === void 0 ? void 0 : _e.complete) === false) {
                    accepted = true;
                    const received = Number((_g = (_f = data === null || data === void 0 ? void 0 : data.data) === null || _f === void 0 ? void 0 : _f.received) !== null && _g !== void 0 ? _g : i + 1);
                    const pct = Math.round((received / totalChunks) * 100);
                    setProgress(Math.min(99, pct));
                    const elapsed = (performance.now() - t0) / 1000;
                    const uploadedBytes = Math.min(file.size, received * CHUNK_SIZE);
                    const speed = elapsed > 0 ? uploadedBytes / elapsed : 0;
                    const remaining = Math.max(0, file.size - uploadedBytes);
                    const eta = speed > 0 ? remaining / speed : 0;
                    setSpeedLabel(`${(speed / (1024 * 1024)).toFixed(1)} MB/s · ETA ~${Math.max(0, Math.ceil(eta))}s`);
                    setChunkMeta(`Received ${received}/${totalChunks} parts`);
                    setRetryInfo(`Chunk ${i + 1}: ${attempt} attempt(s) · total tries ${chunkAttemptsTotal}`);
                    break;
                }
                lastErr = new Error("Unexpected chunk response");
                if (attempt < UPLOAD_RETRIES)
                    await sleep(350 * attempt);
            }
            if (!accepted)
                throw lastErr !== null && lastErr !== void 0 ? lastErr : new Error(`Chunk ${i + 1} upload failed`);
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
    const uploadWithRetries = async (file, opts) => {
        let checksum = null;
        try {
            checksum = await sha256Hex(file);
        }
        catch (_a) {
            checksum = null;
        }
        let lastErr = null;
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
            }
            catch (e) {
                lastErr = e instanceof Error ? e : new Error(String(e));
                if (attempt < UPLOAD_RETRIES) {
                    await sleep(400 * attempt);
                }
            }
        }
        throw lastErr !== null && lastErr !== void 0 ? lastErr : new Error("Upload failed");
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
                const f = files[0];
                setBatchLabel(f.name);
                setPhase("preparing");
                setProgress(15);
                const id = await uploadWithRetries(f, { key: f.name });
                setPhase("uploading");
                setProgress(100);
                showFilesToast(targetFileId ? "New version uploaded." : "File uploaded successfully.", "success");
                onUploaded === null || onUploaded === void 0 ? void 0 : onUploaded(id);
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
                setFileProgress((prev) => (Object.assign(Object.assign({}, prev), { [f.name]: 10 })));
                const id = await uploadWithRetries(f, {
                    displayName: f.name,
                    key: f.name,
                });
                lastId = id;
                done += 1;
                setProgress(Math.round((done / total) * 100));
                setFileProgress((prev) => (Object.assign(Object.assign({}, prev), { [f.name]: 100 })));
            }
            showFilesToast(`${total} files uploaded.`, "success");
            onUploaded === null || onUploaded === void 0 ? void 0 : onUploaded(lastId);
            onClose();
            router.refresh();
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            showFilesToast(msg, "error");
        }
        finally {
            setSubmitting(false);
            setPhase("idle");
            setProgress(0);
            setBatchLabel(null);
        }
    };
    if (!open)
        return null;
    const primary = files[0];
    const sizeWarn = primary && primary.size >= WARN_BYTES;
    const multi = !targetFileId && files.length > 1;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", children: [_jsx("button", { type: "button", className: "absolute inset-0 cursor-default", "aria-label": "Close dialog", onClick: onClose }), _jsxs("div", { className: "relative z-10 w-full max-w-lg rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-xl", role: "dialog", "aria-modal": "true", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("h2", { className: "text-base font-semibold text-[var(--z-fg)]", children: targetFileId ? "Upload new version" : "Upload file" }), _jsx("button", { type: "button", onClick: onClose, className: "rounded p-1 text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]", "aria-label": "Close", children: "\u2715" })] }), _jsxs("div", { onDragOver: (e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }, onDragLeave: () => setDragOver(false), onDrop: onDrop, onClick: () => { var _a; return (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, className: `flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center text-sm transition-colors ${dragOver
                            ? "border-[var(--z-accent)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)]"
                            : "border-[var(--z-border)] text-[var(--z-muted)] hover:border-[var(--z-accent)]/50"}`, children: [_jsx("div", { className: "text-2xl", children: "\u2B06" }), _jsx("div", { className: "mt-2", children: files.length ? (_jsx("span", { className: "text-[var(--z-fg)]", children: multi
                                        ? `${files.length} files selected`
                                        : (_a = files[0]) === null || _a === void 0 ? void 0 : _a.name })) : (_jsx(_Fragment, { children: "Drag & drop or click to browse" })) }), _jsxs("p", { className: "mt-2 max-w-xs text-[10px] text-[var(--z-muted)]", children: ["Executable files are blocked. Max ", Math.round(MAX_BYTES / (1024 * 1024)), " MB.", !targetFileId ? " Multiple files allowed for new uploads." : ""] }), _jsx("input", { ref: inputRef, type: "file", className: "hidden", multiple: !targetFileId, onChange: (e) => pickFiles(e.target.files) })] }), multi ? (_jsx("ul", { className: "mt-3 max-h-32 space-y-1 overflow-y-auto rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-left text-xs text-[var(--z-muted)]", children: files.map((f) => (_jsxs("li", { className: "flex justify-between gap-2", children: [_jsx("span", { className: "truncate text-[var(--z-fg)]", children: f.name }), _jsx("span", { className: "shrink-0", children: fileProgress[f.name] != null ? `${fileProgress[f.name]}%` : "—" })] }, `${f.name}-${f.size}`))) })) : null, sizeWarn ? (_jsxs("div", { className: "mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200", children: ["Large file (", (primary.size / (1024 * 1024)).toFixed(1), " MB) \u2014 upload may take a moment."] })) : null, !targetFileId && !multi ? (_jsxs("div", { className: "mt-4 space-y-3", children: [_jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "mb-1 block text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Name" }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]", placeholder: "Document name" })] }), _jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "mb-1 block text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Description" }), _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), rows: 2, className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]" })] })] })) : null, targetFileId ? (_jsx("div", { className: "mt-4", children: _jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "mb-1 block text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Version notes" }), _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]" })] }) })) : null, submitting ? (_jsxs("div", { className: "mt-3 space-y-1", children: [_jsxs("div", { className: "flex justify-between text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: [_jsx("span", { children: batchLabel
                                            ? batchLabel
                                            : phase === "preparing"
                                                ? "Preparing…"
                                                : "Uploading…" }), _jsxs("span", { children: [progress, "%"] })] }), _jsx("div", { className: "h-1.5 overflow-hidden rounded-full bg-white/[0.06]", children: _jsx("div", { className: "h-full bg-[var(--z-accent)] transition-[width] duration-300", style: { width: `${progress}%` } }) }), _jsx("p", { className: "text-[10px] text-[var(--z-muted)]", children: "Retries enabled for transient failures. SHA-256 verified when supported." }), speedLabel ? (_jsx("p", { className: "text-[10px] text-[var(--z-fg)]", children: speedLabel })) : null, chunkMeta ? (_jsx("p", { className: "text-[10px] text-[var(--z-muted)]", children: chunkMeta })) : null, retryInfo ? (_jsx("p", { className: "text-[10px] text-[var(--z-muted)]", children: retryInfo })) : null] })) : null, error ? (_jsx("div", { className: "mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400", children: error })) : null, _jsxs("div", { className: "mt-4 flex items-center justify-end gap-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "rounded-md border border-[var(--z-border)] px-3 py-2 text-sm text-[var(--z-fg)] hover:bg-white/[0.04]", disabled: submitting, children: "Cancel" }), _jsx("button", { type: "button", onClick: submit, disabled: submitting || !files.length, className: "rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50", children: submitting ? "Working…" : multi ? `Upload ${files.length} files` : "Upload" })] })] })] }));
}
