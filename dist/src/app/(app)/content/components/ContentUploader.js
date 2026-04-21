"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function ContentUploader({ tenantId, onUploaded }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [fileName, setFileName] = useState("");
    const [fileUrl, setFileUrl] = useState("");
    const [mimeType, setMimeType] = useState("");
    const [tags, setTags] = useState("");
    const [visibility, setVisibility] = useState("tenant");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState(null);
    async function handleSubmit(e) {
        e.preventDefault();
        if (!title.trim()) {
            setError("Title is required");
            return;
        }
        setStatus("pending");
        setError(null);
        try {
            const res = await fetch("/content/api/upload", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    tenantId,
                    file: {
                        fileName: fileName || title,
                        mimeType: mimeType || null,
                        fileUrl: fileUrl || null,
                    },
                    metadata: {
                        title,
                        description: description || null,
                        visibility,
                        tags: tags
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                    },
                }),
            });
            if (!res.ok) {
                const body = await res.text().catch(() => "");
                throw new Error(body || `Upload failed (${res.status})`);
            }
            setStatus("success");
            setTitle("");
            setDescription("");
            setFileName("");
            setFileUrl("");
            setMimeType("");
            setTags("");
            onUploaded === null || onUploaded === void 0 ? void 0 : onUploaded();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
            setStatus("error");
        }
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-3 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Upload content" }), _jsxs("div", { className: "grid gap-2 md:grid-cols-2", children: [_jsx(Field, { label: "Title", required: true, children: _jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]", required: true }) }), _jsx(Field, { label: "File name", children: _jsx("input", { value: fileName, onChange: (e) => setFileName(e.target.value), placeholder: "e.g. scales.pdf", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]" }) })] }), _jsx(Field, { label: "Description", children: _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]", rows: 3 }) }), _jsxs("div", { className: "grid gap-2 md:grid-cols-2", children: [_jsx(Field, { label: "File URL", children: _jsx("input", { value: fileUrl, onChange: (e) => setFileUrl(e.target.value), placeholder: "https://\u2026", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]" }) }), _jsx(Field, { label: "MIME type", children: _jsx("input", { value: mimeType, onChange: (e) => setMimeType(e.target.value), placeholder: "application/pdf", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]" }) })] }), _jsxs("div", { className: "grid gap-2 md:grid-cols-2", children: [_jsx(Field, { label: "Tags (comma-separated)", children: _jsx("input", { value: tags, onChange: (e) => setTags(e.target.value), placeholder: "scales, violin, beginner", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]" }) }), _jsx(Field, { label: "Visibility", children: _jsxs("select", { value: visibility, onChange: (e) => setVisibility(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm text-[var(--z-fg)]", children: [_jsx("option", { value: "tenant", children: "Tenant (everyone)" }), _jsx("option", { value: "teachers", children: "Teachers only" }), _jsx("option", { value: "public", children: "Public (families, students)" })] }) })] }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("div", { className: "text-xs", children: status === "pending" ? (_jsx("span", { className: "text-[var(--z-muted)]", children: "Uploading\u2026" })) : status === "success" ? (_jsx("span", { className: "text-[#00ff88]", children: "Uploaded" })) : error ? (_jsx("span", { className: "text-[var(--z-danger)]", children: error })) : null }), _jsx("button", { type: "submit", disabled: status === "pending", className: "rounded-md bg-[#00ff88]/15 border border-[#00ff88]/40 px-3 py-1.5 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/25 disabled:opacity-50", children: "Upload" })] })] }));
}
function Field({ label, children, required, }) {
    return (_jsxs("label", { className: "block space-y-1", children: [_jsxs("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: [label, required ? _jsx("span", { className: "text-[var(--z-danger)]", children: "*" }) : null] }), children] }));
}
