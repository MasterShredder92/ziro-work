"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useRef, useState } from "react";
import { TEMPLATE_CATEGORIES, TEMPLATE_CHANNELS, } from "@/lib/templates/types";
import { renderTemplate } from "@/lib/templates/renderer";
import { MergeFieldBrowser } from "./MergeFieldBrowser";
import { PreviewModal } from "./PreviewModal";
import { TemplatePreview } from "./TemplatePreview";
import { VersionHistoryDrawer } from "./VersionHistoryDrawer";
const DEFAULT_SAMPLE = {
    student: {
        firstName: "Ava",
        lastName: "Nguyen",
        preferredName: "Avi",
        instrument: "piano",
    },
    family: {
        lastName: "Nguyen",
        primaryContactName: "Minh Nguyen",
        primaryEmail: "minh@example.com",
    },
    teacher: {
        firstName: "Rachel",
        lastName: "Kim",
        fullName: "Rachel Kim",
    },
    lesson: {
        date: "2026-04-22",
        startTime: "16:00",
        endTime: "16:45",
        room: "Studio B",
    },
    tenant: { name: "Harmony Music Academy" },
    lessons: [
        {
            date: "2026-04-22",
            startTime: "16:00",
            room: "Studio B",
        },
        {
            date: "2026-04-29",
            startTime: "16:00",
            room: "Studio B",
        },
    ],
};
export function TemplateEditor({ template, mergeFields, versions, sampleContext, }) {
    var _a, _b;
    const [name, setName] = useState(template.name);
    const [category, setCategory] = useState(template.category);
    const [channel, setChannel] = useState(template.channel);
    const [description, setDescription] = useState((_a = template.description) !== null && _a !== void 0 ? _a : "");
    const [subject, setSubject] = useState((_b = template.subject) !== null && _b !== void 0 ? _b : "");
    const [body, setBody] = useState(template.body);
    const [changeSummary, setChangeSummary] = useState("");
    const [saving, setSaving] = useState(false);
    const [savingVersion, setSavingVersion] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [contextJson, setContextJson] = useState(() => JSON.stringify(sampleContext !== null && sampleContext !== void 0 ? sampleContext : DEFAULT_SAMPLE, null, 2));
    const bodyRef = useRef(null);
    function insertToken(token) {
        var _a, _b;
        const el = bodyRef.current;
        if (!el) {
            setBody((b) => b + token);
            return;
        }
        const start = (_a = el.selectionStart) !== null && _a !== void 0 ? _a : body.length;
        const end = (_b = el.selectionEnd) !== null && _b !== void 0 ? _b : body.length;
        const next = body.slice(0, start) + token + body.slice(end);
        setBody(next);
        requestAnimationFrame(() => {
            if (!bodyRef.current)
                return;
            const pos = start + token.length;
            bodyRef.current.focus();
            bodyRef.current.setSelectionRange(pos, pos);
        });
    }
    const preview = useMemo(() => {
        let parsedCtx = sampleContext !== null && sampleContext !== void 0 ? sampleContext : DEFAULT_SAMPLE;
        try {
            const parsed = JSON.parse(contextJson);
            if (parsed && typeof parsed === "object") {
                parsedCtx = parsed;
            }
        }
        catch (_a) {
            // Ignore parse errors; use previous context.
        }
        return renderTemplate(body, parsedCtx, {
            templateId: template.id,
            version: template.currentVersion,
            subject: subject || null,
        });
    }, [body, subject, contextJson, sampleContext, template.id, template.currentVersion]);
    async function handleSave() {
        setSaving(true);
        setError(null);
        setStatus(null);
        try {
            const res = await fetch(`/api/templates/${template.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    name,
                    description: description || null,
                    category,
                    channel,
                    subject: subject || null,
                    body,
                }),
            });
            if (!res.ok)
                throw new Error(`Save failed (${res.status})`);
            setStatus("Template saved.");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Save failed");
        }
        finally {
            setSaving(false);
        }
    }
    async function handlePublishVersion() {
        setSavingVersion(true);
        setError(null);
        setStatus(null);
        try {
            const res = await fetch(`/api/templates/${template.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    name,
                    description: description || null,
                    category,
                    channel,
                    subject: subject || null,
                    body,
                    newVersion: {
                        subject: subject || null,
                        body,
                        changeSummary: changeSummary || null,
                        isCurrent: true,
                    },
                }),
            });
            if (!res.ok)
                throw new Error(`Publish failed (${res.status})`);
            setStatus("New version published.");
            setChangeSummary("");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Publish failed");
        }
        finally {
            setSavingVersion(false);
        }
    }
    return (_jsxs("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("section", { className: "space-y-3 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [_jsxs("label", { className: "flex flex-col gap-1 text-sm", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Name" }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Description" }), _jsx("input", { value: description, onChange: (e) => setDescription(e.target.value), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Category" }), _jsx("select", { value: category, onChange: (e) => setCategory(e.target.value), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", children: TEMPLATE_CATEGORIES.map((c) => (_jsx("option", { value: c, children: c }, c))) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Channel" }), _jsx("select", { value: channel, onChange: (e) => setChannel(e.target.value), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", children: TEMPLATE_CHANNELS.map((c) => (_jsx("option", { value: c, children: c }, c))) })] }), _jsxs("label", { className: "md:col-span-2 flex flex-col gap-1 text-sm", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Subject" }), _jsx("input", { value: subject, onChange: (e) => setSubject(e.target.value), placeholder: "Optional subject line (supports merge fields)", className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "md:col-span-2 flex flex-col gap-1 text-sm", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Body" }), _jsx("textarea", { ref: bodyRef, value: body, onChange: (e) => setBody(e.target.value), rows: 14, className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 font-mono text-sm text-[var(--z-fg)]" })] })] }), _jsxs("div", { className: "flex flex-col gap-2 border-t border-[var(--z-border)] pt-3 md:flex-row md:items-center md:justify-between", children: [_jsx("div", { className: "flex-1", children: _jsx("input", { value: changeSummary, onChange: (e) => setChangeSummary(e.target.value), placeholder: "Change summary for new version (optional)", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]" }) }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setPreviewOpen(true), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm font-semibold text-[var(--z-fg)]", children: "Preview" }), _jsx("button", { type: "button", onClick: handleSave, disabled: saving || savingVersion, className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm font-semibold text-[var(--z-fg)] disabled:opacity-50", children: saving ? "Saving…" : "Save draft" }), _jsx("button", { type: "button", onClick: handlePublishVersion, disabled: saving || savingVersion, className: "rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] px-3 py-2 text-sm font-semibold text-[var(--z-accent)] disabled:opacity-50", children: savingVersion ? "Publishing…" : "Publish new version" })] })] }), error ? (_jsx("div", { className: "rounded-md border border-[color-mix(in_oklab,var(--z-danger),transparent_55%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] p-2 text-xs text-[var(--z-danger)]", children: error })) : null, status ? (_jsx("div", { className: "rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] p-2 text-xs text-[var(--z-accent)]", children: status })) : null] }), _jsxs("section", { className: "space-y-2", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Preview context (JSON)" }), _jsx("textarea", { value: contextJson, onChange: (e) => setContextJson(e.target.value), rows: 10, className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 font-mono text-xs text-[var(--z-fg)]" })] })] }), _jsxs("aside", { className: "space-y-4", children: [_jsx(TemplatePreview, { rendered: preview }), _jsx(MergeFieldBrowser, { mergeFields: mergeFields, missing: preview.missingMergeFields, onInsert: insertToken }), versions && versions.length > 0 ? (_jsx(VersionHistoryDrawer, { templateId: template.id, versions: versions, currentBody: body, currentSubject: subject || null })) : null] }), _jsx(PreviewModal, { open: previewOpen, onClose: () => setPreviewOpen(false), rendered: preview, templateId: template.id, channel: channel })] }));
}
