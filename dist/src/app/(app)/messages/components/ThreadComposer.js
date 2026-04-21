"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { sendTestMessage } from "../actions/sendTestMessage";
import { isFileDragTransfer, isDragLeaveToOutside } from "./messagingDnD";
import { showMessagingToast } from "./messagingToast";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { previewMergeTemplateText, } from "./templatePreviewMerge";
export function ThreadComposer({ threadId, defaultChannel, templates, mergeFields, mergeVars = {}, threadSubject = null, canWrite, }) {
    var _a, _b;
    const router = useRouter();
    const [body, setBody] = useState("");
    const [channel, setChannel] = useState(defaultChannel);
    const [templateId, setTemplateId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [testSending, setTestSending] = useState(false);
    const onFilesPicked = useCallback((list) => {
        if (!(list === null || list === void 0 ? void 0 : list.length))
            return;
        const next = Array.from(list).map((f) => ({
            id: typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}`,
            name: f.name,
            size: f.size,
        }));
        setAttachments((prev) => [...prev, ...next].slice(0, 8));
    }, []);
    function insertMergeField(field) {
        setBody((prev) => `${prev}{{${field}}}`);
    }
    function applyTemplate(id) {
        setTemplateId(id);
        const t = templates.find((x) => x.id === id);
        if (t) {
            setBody(t.body);
        }
    }
    const selectedTemplate = templateId
        ? templates.find((x) => x.id === templateId)
        : undefined;
    const previewVars = mergeVars;
    const previewSubject = selectedTemplate
        ? previewMergeTemplateText((_a = selectedTemplate.subject) !== null && _a !== void 0 ? _a : "", previewVars)
        : "";
    const previewBody = selectedTemplate
        ? previewMergeTemplateText(selectedTemplate.body, previewVars)
        : "";
    const testEmailSubjectRaw = selectedTemplate
        ? ((_b = selectedTemplate.subject) !== null && _b !== void 0 ? _b : "")
        : (threadSubject !== null && threadSubject !== void 0 ? threadSubject : "");
    const testEmailSubject = previewMergeTemplateText(testEmailSubjectRaw, previewVars).trim() || null;
    async function handleSendTest() {
        if (testSending || submitting)
            return;
        const trimmed = body.trim();
        const attachNote = attachments.length > 0
            ? `\n\n— Attached (names only; files are not sent yet): ${attachments.map((a) => a.name).join(", ")} —`
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
                subject: testEmailSubject,
                templateId: templateId || null,
                mergeVars,
            });
            showMessagingToast(result.ok
                ? "Test message sent to your email."
                : "Could not send test message.", result.ok ? "success" : "error");
        }
        catch (_a) {
            showMessagingToast("Could not send test message.", "error");
        }
        finally {
            setTestSending(false);
        }
    }
    async function handleSubmit(e) {
        var _a;
        e.preventDefault();
        if (submitting)
            return;
        const trimmed = body.trim();
        const attachNote = attachments.length > 0
            ? `\n\n— Attached (names only; files are not sent yet): ${attachments.map((a) => a.name).join(", ")} —`
            : "";
        const merged = `${trimmed}${attachNote}`.trim();
        if (!merged) {
            setError("Add a message or drop files to include their names.");
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            const res = await fetch(`/api/messages/threads/${threadId}/messages`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    body: merged,
                    channelType: channel,
                    templateId: templateId || null,
                }),
            });
            if (!res.ok) {
                const data = (await res.json().catch(() => null));
                throw new Error((_a = data === null || data === void 0 ? void 0 : data.error) !== null && _a !== void 0 ? _a : "Failed to send");
            }
            setBody("");
            setTemplateId("");
            setAttachments([]);
            router.refresh();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        }
        finally {
            setSubmitting(false);
        }
    }
    if (!canWrite) {
        return (_jsx("div", { className: "rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-sm text-[var(--z-muted)]", children: "You do not have permission to send messages in this thread." }));
    }
    const canSend = !submitting &&
        (body.trim().length > 0 || attachments.length > 0);
    return (_jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs("select", { value: channel, onChange: (e) => setChannel(e.target.value), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]", children: [_jsx("option", { value: "in_app", children: "In-app" }), _jsx("option", { value: "email", children: "Email" }), _jsx("option", { value: "sms", children: "SMS" }), _jsx("option", { value: "push", children: "Push" })] }), templates.length > 0 ? (_jsxs("div", { className: "flex flex-wrap items-center gap-1", children: [_jsxs("select", { value: templateId, onChange: (e) => applyTemplate(e.target.value), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]", children: [_jsx("option", { value: "", children: "Insert template..." }), templates.map((t) => (_jsx("option", { value: t.id, children: t.name }, t.id)))] }), templateId && selectedTemplate ? (_jsx("button", { type: "button", onClick: () => setPreviewOpen(true), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs font-medium text-[var(--z-fg)] hover:bg-[var(--z-surface-hover)]", children: "Preview" })) : null] })) : null, mergeFields.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-1", children: mergeFields.map((field) => (_jsx("button", { type: "button", onClick: () => insertMergeField(field), className: "rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]", children: field }, field))) })) : null] }), _jsxs("div", { className: `relative rounded-md border border-dashed transition-colors ${dragOver
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
                }, children: [dragOver ? (_jsx("div", { className: "pointer-events-none absolute inset-0 z-[1] flex items-center justify-center rounded-md border-2 border-dashed border-[var(--z-accent)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)] text-xs font-semibold text-[var(--z-fg)]", "aria-hidden": true, children: "Drop files to attach" })) : null, _jsx("textarea", { value: body, onChange: (e) => setBody(e.target.value), onDragOver: (e) => {
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
                        }, rows: 4, placeholder: "Write a reply\u2026 (drag files here or use Browse)", className: "relative z-0 w-full resize-y rounded-md border border-transparent bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] focus:border-[var(--z-border)] focus:outline-none focus:ring-2 focus:ring-[var(--z-accent)]" }), _jsxs("div", { className: "relative z-0 flex flex-wrap items-center gap-2 border-t border-[var(--z-border)] px-2 py-1.5 text-[10px] text-[var(--z-muted)]", children: [_jsxs("label", { className: "cursor-pointer rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 hover:bg-[var(--z-surface-hover)]", children: [_jsx("input", { type: "file", className: "hidden", multiple: true, onChange: (e) => onFilesPicked(e.target.files) }), "Browse files"] }), _jsx("span", { children: "Up to 8 files; names are appended to the message (binary upload not wired yet)." })] })] }), attachments.length > 0 ? (_jsx("ul", { className: "flex flex-wrap gap-1.5 text-[11px] text-[var(--z-fg)]", children: attachments.map((a) => (_jsxs("li", { className: "inline-flex items-center gap-1 rounded-full border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-0.5", children: [_jsx("span", { className: "max-w-[200px] truncate", title: a.name, children: a.name }), _jsxs("span", { className: "text-[var(--z-muted)]", children: [(a.size / 1024).toFixed(a.size < 1024 ? 1 : 0), " KB"] }), _jsx("button", { type: "button", className: "text-[var(--z-muted)] hover:text-[var(--z-fg)]", "aria-label": `Remove ${a.name}`, onClick: () => setAttachments((prev) => prev.filter((x) => x.id !== a.id)), children: "\u00D7" })] }, a.id))) })) : null, error ? (_jsx("div", { className: "rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700", children: error })) : null, _jsxs("div", { className: "flex flex-wrap items-center justify-end gap-2", children: [_jsxs("button", { type: "button", onClick: handleSendTest, disabled: testSending ||
                            submitting ||
                            (!body.trim() && attachments.length === 0), className: "inline-flex items-center gap-1.5 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-1.5 text-xs font-medium text-[var(--z-muted)] transition hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)] disabled:cursor-not-allowed disabled:opacity-50", children: [_jsx(Sparkles, { className: "size-3.5 shrink-0 opacity-80", "aria-hidden": true }), testSending ? "Sending test…" : "Send test to myself"] }), _jsx("button", { type: "submit", disabled: !canSend || testSending, className: "rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-sm font-semibold text-[var(--z-on-accent,white)] shadow-sm hover:brightness-110 disabled:opacity-60", children: submitting ? "Sending..." : "Send" })] }), selectedTemplate ? (_jsx(TemplatePreviewModal, { open: previewOpen, onClose: () => setPreviewOpen(false), templateName: selectedTemplate.name, renderedSubject: previewSubject, renderedBody: previewBody })) : null] }));
}
