"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* eslint-disable react-hooks/rules-of-hooks */
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition, } from "react";
import { sendTestMessage } from "../actions/sendTestMessage";
import { isFileDragTransfer, isDragLeaveToOutside } from "./messagingDnD";
import { showMessagingToast } from "./messagingToast";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { previewMergeTemplateText, } from "./templatePreviewMerge";
const DRAFT_KEY_PREFIX = "messaging:draft:";
const DRAFT_SAVE_DEBOUNCE_MS = 300;
function draftKeyForThread(threadId) {
    return `${DRAFT_KEY_PREFIX}${threadId}`;
}
function loadThreadDraft(threadId) {
    var _a;
    if (typeof window === "undefined")
        return "";
    try {
        return (_a = window.localStorage.getItem(draftKeyForThread(threadId))) !== null && _a !== void 0 ? _a : "";
    }
    catch (_b) {
        return "";
    }
}
function saveThreadDraft(threadId, body) {
    if (typeof window === "undefined")
        return;
    try {
        const key = draftKeyForThread(threadId);
        if (body.trim().length === 0) {
            window.localStorage.removeItem(key);
            return;
        }
        window.localStorage.setItem(key, body);
    }
    catch (_a) {
        // Ignore storage failures (quota/private mode).
    }
}
function clearThreadDraft(threadId) {
    if (typeof window === "undefined")
        return;
    try {
        window.localStorage.removeItem(draftKeyForThread(threadId));
    }
    catch (_a) {
        // Ignore storage failures.
    }
}
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error(`Failed reading ${file.name}`));
        reader.onload = () => {
            var _a;
            const value = String((_a = reader.result) !== null && _a !== void 0 ? _a : "");
            const idx = value.indexOf(",");
            resolve(idx >= 0 ? value.slice(idx + 1) : value);
        };
        reader.readAsDataURL(file);
    });
}
export function MessageComposer({ threadId, targetId, canWrite, recipients = [], templates, mergeFields = [], mergeVars = {}, }) {
    var _a, _b, _c;
    const router = useRouter();
    const [body, setBody] = useState("");
    const [selectedTarget, setSelectedTarget] = useState((_b = targetId !== null && targetId !== void 0 ? targetId : (_a = recipients[0]) === null || _a === void 0 ? void 0 : _a.profileId) !== null && _b !== void 0 ? _b : "");
    const [templateId, setTemplateId] = useState("");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [testSending, setTestSending] = useState(false);
    const [error, setError] = useState(null);
    const [pending, startTransition] = useTransition();
    const [dragOver, setDragOver] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const saveDraftTimerRef = useRef(null);
    const onFilesPicked = useCallback((list) => {
        if (!(list === null || list === void 0 ? void 0 : list.length))
            return;
        const next = Array.from(list).map((f) => ({
            id: typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}`,
            name: f.name,
            size: f.size,
            file: f,
        }));
        setAttachments((prev) => [...prev, ...next].slice(0, 8));
    }, []);
    const templateList = templates !== null && templates !== void 0 ? templates : [];
    function applyTemplate(id) {
        setTemplateId(id);
        const t = templateList.find((x) => x.id === id);
        if (t)
            setBody(t.body);
    }
    function insertMergeField(field) {
        setBody((prev) => `${prev}{{${field}}}`);
    }
    const selectedTemplate = templateId
        ? templateList.find((x) => x.id === templateId)
        : undefined;
    const previewVars = mergeVars;
    const previewSubject = selectedTemplate
        ? previewMergeTemplateText((_c = selectedTemplate.subject) !== null && _c !== void 0 ? _c : "", previewVars)
        : "";
    const previewBody = selectedTemplate
        ? previewMergeTemplateText(selectedTemplate.body, previewVars)
        : "";
    if (!canWrite) {
        return (_jsx("div", { className: "border-t border-[var(--z-border)] bg-[var(--z-surface)] px-5 py-4 text-xs text-[var(--z-muted)]", children: "You have read-only access to messages. Please contact your studio administrator to respond." }));
    }
    const activeTarget = targetId !== null && targetId !== void 0 ? targetId : selectedTarget;
    useEffect(() => {
        if (saveDraftTimerRef.current != null) {
            window.clearTimeout(saveDraftTimerRef.current);
            saveDraftTimerRef.current = null;
        }
        if (!threadId)
            return;
        setBody(loadThreadDraft(threadId));
    }, [threadId]);
    useEffect(() => {
        if (!threadId)
            return;
        if (saveDraftTimerRef.current != null) {
            window.clearTimeout(saveDraftTimerRef.current);
        }
        saveDraftTimerRef.current = window.setTimeout(() => {
            saveThreadDraft(threadId, body);
            saveDraftTimerRef.current = null;
        }, DRAFT_SAVE_DEBOUNCE_MS);
        return () => {
            if (saveDraftTimerRef.current != null) {
                window.clearTimeout(saveDraftTimerRef.current);
                saveDraftTimerRef.current = null;
            }
        };
    }, [body, threadId]);
    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        const payload = { body: body.trim() };
        if (threadId)
            payload.threadId = threadId;
        if (!threadId && activeTarget)
            payload.targetId = activeTarget;
        if (!body.trim() && attachments.length === 0) {
            setError("Add a message or attach files.");
            return;
        }
        if (!threadId && !activeTarget) {
            setError("Choose a recipient before sending.");
            return;
        }
        startTransition(async () => {
            var _a, _b;
            try {
                const uploads = await Promise.all(attachments.map(async (attachment) => ({
                    fileName: attachment.name,
                    mimeType: attachment.file.type || "application/octet-stream",
                    size: attachment.size,
                    base64: await fileToBase64(attachment.file),
                })));
                if (uploads.length > 0)
                    payload.uploads = uploads;
                const res = await fetch("/messages/api/send", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const data = (await res.json().catch(() => ({})));
                    setError((_a = data.error) !== null && _a !== void 0 ? _a : `Send failed (${res.status})`);
                    return;
                }
                const data = (await res.json());
                setBody("");
                setAttachments([]);
                setTemplateId("");
                if (threadId)
                    clearThreadDraft(threadId);
                const newThreadId = (_b = data.thread) === null || _b === void 0 ? void 0 : _b.id;
                if (newThreadId) {
                    router.replace(`/messages?thread=${newThreadId}`);
                }
                router.refresh();
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "Send failed");
            }
        });
    }
    const canSendWithAttach = !pending && (body.trim().length > 0 || attachments.length > 0) && (threadId || activeTarget);
    async function handleSendTest() {
        var _a;
        if (testSending || pending)
            return;
        const trimmed = body.trim();
        const attachNote = attachments.length > 0
            ? `\n\nAttached files: ${attachments.map((a) => a.name).join(", ")}`
            : "";
        const merged = `${trimmed}${attachNote}`.trim();
        if (!merged) {
            showMessagingToast("Could not send test message.", "error");
            return;
        }
        setTestSending(true);
        try {
            const result = await sendTestMessage({
                body: merged,
                subject: selectedTemplate
                    ? previewMergeTemplateText((_a = selectedTemplate.subject) !== null && _a !== void 0 ? _a : "", previewVars).trim() || null
                    : null,
                templateId: templateId || null,
                mergeVars,
            });
            showMessagingToast(result.ok
                ? "Test message sent to your email."
                : "Could not send test message.", result.ok ? "success" : "error");
        }
        catch (_b) {
            showMessagingToast("Could not send test message.", "error");
        }
        finally {
            setTestSending(false);
        }
    }
    return (_jsxs("form", { className: "flex flex-col gap-2 border-t border-[var(--z-border)] bg-[var(--z-surface)] px-5 py-4", onSubmit: onSubmit, children: [!threadId && recipients.length > 0 ? (_jsxs("label", { className: "flex flex-col gap-1 text-xs text-[var(--z-muted)]", children: [_jsx("span", { children: "Recipient" }), _jsx("select", { value: selectedTarget, onChange: (e) => setSelectedTarget(e.target.value), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]", children: recipients.map((r) => (_jsxs("option", { value: r.profileId, children: [r.fullName, r.role ? ` · ${r.role}` : ""] }, r.profileId))) })] })) : null, templateList.length > 0 ? (_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-1", children: [_jsx("span", { className: "text-[10px] font-medium uppercase tracking-wide text-[var(--z-muted)]", children: "Template" }), _jsxs("select", { value: templateId, onChange: (e) => applyTemplate(e.target.value), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]", children: [_jsx("option", { value: "", children: "Insert template..." }), templateList.map((t) => (_jsx("option", { value: t.id, children: t.name }, t.id)))] }), templateId && selectedTemplate ? (_jsx("button", { type: "button", onClick: () => setPreviewOpen(true), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs font-medium text-[var(--z-fg)] hover:bg-[var(--z-surface-hover)]", children: "Preview" })) : null] }), mergeFields.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-1", children: mergeFields.map((field) => (_jsx("button", { type: "button", onClick: () => insertMergeField(field), className: "rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]", children: field }, field))) })) : null] })) : null, _jsxs("div", { className: `relative rounded-md border border-dashed px-2 py-1 transition-colors ${dragOver
                    ? "border-[var(--z-accent)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)]"
                    : "border-[var(--z-border)]"}`, onDragEnter: (e) => {
                    if (!isFileDragTransfer(e.dataTransfer))
                        return;
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOver(true);
                }, onDragLeave: (e) => {
                    if (!isFileDragTransfer(e.dataTransfer))
                        return;
                    if (!isDragLeaveToOutside(e, e.currentTarget))
                        return;
                    setDragOver(false);
                }, onDragOver: (e) => {
                    if (!isFileDragTransfer(e.dataTransfer))
                        return;
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "copy";
                }, onDrop: (e) => {
                    var _a;
                    if (!isFileDragTransfer(e.dataTransfer))
                        return;
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOver(false);
                    if ((_a = e.dataTransfer.files) === null || _a === void 0 ? void 0 : _a.length)
                        onFilesPicked(e.dataTransfer.files);
                }, children: [dragOver ? (_jsx("div", { className: "pointer-events-none absolute inset-0 z-[1] flex items-center justify-center rounded-md border-2 border-dashed border-[var(--z-accent)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)] text-xs font-semibold text-[var(--z-fg)]", "aria-hidden": true, children: "Drop files to attach" })) : null, _jsxs("label", { className: "relative z-0 flex flex-col gap-1", children: [_jsx("span", { className: "sr-only", children: "Message" }), _jsx("textarea", { value: body, onChange: (e) => setBody(e.target.value), onDragOver: (e) => {
                                    if (!isFileDragTransfer(e.dataTransfer))
                                        return;
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "copy";
                                }, onDrop: (e) => {
                                    var _a;
                                    if (!isFileDragTransfer(e.dataTransfer))
                                        return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOver(false);
                                    if ((_a = e.dataTransfer.files) === null || _a === void 0 ? void 0 : _a.length)
                                        onFilesPicked(e.dataTransfer.files);
                                }, placeholder: "Write a message\u2026 (drag files here or use Browse)", rows: 3, className: "w-full resize-none rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--z-accent)]" })] }), _jsxs("div", { className: "relative z-0 mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[var(--z-muted)]", children: [_jsxs("label", { className: "cursor-pointer rounded border border-[var(--z-border)] px-2 py-1 hover:bg-white/[0.04]", children: [_jsx("input", { type: "file", className: "hidden", multiple: true, onChange: (e) => onFilesPicked(e.target.files) }), "Browse files"] }), _jsx("span", { children: "Files are uploaded and attached to the outgoing message." })] })] }), attachments.length > 0 ? (_jsx("ul", { className: "flex flex-wrap gap-1.5 text-[11px] text-[var(--z-fg)]", children: attachments.map((a) => (_jsxs("li", { className: "inline-flex items-center gap-1 rounded-full border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-0.5", children: [_jsx("span", { className: "max-w-[180px] truncate", children: a.name }), _jsx("button", { type: "button", className: "text-[var(--z-muted)] hover:text-[var(--z-fg)]", "aria-label": `Remove ${a.name}`, onClick: () => setAttachments((prev) => prev.filter((x) => x.id !== a.id)), children: "\u00D7" })] }, a.id))) })) : null, error ? (_jsx("p", { className: "text-xs text-[var(--z-danger,#b91c1c)]", children: error })) : null, _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("span", { className: "text-[11px] text-[var(--z-muted)]", children: "Press send or Cmd/Ctrl+Enter" }), _jsxs("div", { className: "flex flex-wrap items-center justify-end gap-2", children: [_jsxs("button", { type: "button", onClick: handleSendTest, disabled: testSending ||
                                    pending ||
                                    (!body.trim() && attachments.length === 0), className: "inline-flex items-center gap-1.5 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-1.5 text-xs font-medium text-[var(--z-muted)] transition hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)] disabled:cursor-not-allowed disabled:opacity-50", children: [_jsx(Sparkles, { className: "size-3.5 shrink-0 opacity-80", "aria-hidden": true }), testSending ? "Sending test…" : "Send test to myself"] }), _jsx("button", { type: "submit", disabled: !canSendWithAttach || testSending, className: "rounded-md bg-[var(--z-accent)] px-4 py-1.5 text-xs font-semibold text-[var(--z-on-accent,white)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50", children: pending ? "Sending…" : "Send" })] })] }), selectedTemplate ? (_jsx(TemplatePreviewModal, { open: previewOpen, onClose: () => setPreviewOpen(false), templateName: selectedTemplate.name, renderedSubject: previewSubject, renderedBody: previewBody })) : null] }));
}
