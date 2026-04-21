"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
export function EvidenceUploader({ checkpointId, studentId, tenantId, disabled = false, }) {
    const [body, setBody] = useState("");
    const [kind, setKind] = useState("note");
    const [fileUrl, setFileUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [pending, start] = useTransition();
    const router = useRouter();
    const submit = () => {
        setError(null);
        setSuccess(null);
        if (!body.trim() && !fileUrl.trim()) {
            setError("Please include a note or attach a link/file URL.");
            return;
        }
        start(async () => {
            try {
                const res = await fetch("/progress/api/evidence", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        checkpointId,
                        studentId,
                        tenantId,
                        body: body.trim() || null,
                        kind,
                        fileUrl: fileUrl.trim() || null,
                        fileName: fileName.trim() || null,
                    }),
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || `Upload failed (${res.status})`);
                }
                setBody("");
                setFileUrl("");
                setFileName("");
                setSuccess("Evidence submitted.");
                router.refresh();
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            }
        });
    };
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Add evidence" }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-xs text-[var(--z-muted)]", children: ["Kind", _jsxs("select", { value: kind, onChange: (e) => setKind(e.target.value), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", disabled: disabled || pending, children: [_jsx("option", { value: "note", children: "Note" }), _jsx("option", { value: "link", children: "Link" }), _jsx("option", { value: "image", children: "Image" }), _jsx("option", { value: "video", children: "Video" }), _jsx("option", { value: "audio", children: "Audio" }), _jsx("option", { value: "document", children: "Document" })] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs text-[var(--z-muted)]", children: ["File / link URL (optional)", _jsx("input", { type: "url", value: fileUrl, onChange: (e) => setFileUrl(e.target.value), placeholder: "https://\u2026", className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", disabled: disabled || pending })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs text-[var(--z-muted)] sm:col-span-2", children: ["File label (optional)", _jsx("input", { type: "text", value: fileName, onChange: (e) => setFileName(e.target.value), placeholder: "Scales.mp3", className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", disabled: disabled || pending })] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs text-[var(--z-muted)]", children: ["Notes", _jsx("textarea", { value: body, onChange: (e) => setBody(e.target.value), rows: 3, className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", placeholder: "Reflection, practice log, teacher observation\u2026", disabled: disabled || pending })] }), error ? (_jsx("div", { className: "rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300", children: error })) : null, success ? (_jsx("div", { className: "rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300", children: success })) : null, _jsx("div", { className: "flex items-center justify-end", children: _jsx("button", { type: "button", disabled: disabled || pending, onClick: submit, className: "rounded-md bg-[#00ff88] px-3 py-1.5 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-60", children: pending ? "Submitting…" : "Submit evidence" }) })] }));
}
