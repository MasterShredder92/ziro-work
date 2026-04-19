"use client";

import { useMemo, useRef, useState } from "react";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_CHANNELS,
  type MergeField,
  type RenderedTemplate,
  type Template,
  type TemplateContext,
  type TemplateVersion,
} from "@/lib/templates/types";
import { renderTemplate } from "@/lib/templates/renderer";
import { MergeFieldBrowser } from "./MergeFieldBrowser";
import { PreviewModal } from "./PreviewModal";
import { TemplatePreview } from "./TemplatePreview";
import { VersionHistoryDrawer } from "./VersionHistoryDrawer";

export interface TemplateEditorProps {
  template: Template;
  mergeFields: MergeField[];
  versions?: TemplateVersion[];
  sampleContext?: TemplateContext;
}

const DEFAULT_SAMPLE: TemplateContext = {
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

export function TemplateEditor({
  template,
  mergeFields,
  versions,
  sampleContext,
}: TemplateEditorProps) {
  const [name, setName] = useState(template.name);
  const [category, setCategory] = useState<string>(template.category);
  const [channel, setChannel] = useState<string>(template.channel);
  const [description, setDescription] = useState<string>(
    template.description ?? "",
  );
  const [subject, setSubject] = useState<string>(template.subject ?? "");
  const [body, setBody] = useState<string>(template.body);
  const [changeSummary, setChangeSummary] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [contextJson, setContextJson] = useState<string>(() =>
    JSON.stringify(sampleContext ?? DEFAULT_SAMPLE, null, 2),
  );
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  function insertToken(token: string) {
    const el = bodyRef.current;
    if (!el) {
      setBody((b) => b + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      if (!bodyRef.current) return;
      const pos = start + token.length;
      bodyRef.current.focus();
      bodyRef.current.setSelectionRange(pos, pos);
    });
  }

  const preview = useMemo<RenderedTemplate>(() => {
    let parsedCtx: TemplateContext = sampleContext ?? DEFAULT_SAMPLE;
    try {
      const parsed = JSON.parse(contextJson);
      if (parsed && typeof parsed === "object") {
        parsedCtx = parsed as TemplateContext;
      }
    } catch {
      // Ignore parse errors; use previous context.
    }
    return renderTemplate(body, parsedCtx, {
      templateId: template.id,
      version: template.currentVersion,
      subject: subject || null,
    });
  }, [body, subject, contextJson, sampleContext, template.id, template.currentVersion]);

  async function handleSave(): Promise<void> {
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
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      setStatus("Template saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishVersion(): Promise<void> {
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
      if (!res.ok) throw new Error(`Publish failed (${res.status})`);
      setStatus("New version published.");
      setChangeSummary("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setSavingVersion(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <section className="space-y-3 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Description
              </span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Category
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
              >
                {TEMPLATE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Channel
              </span>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
              >
                {TEMPLATE_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2 flex flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Subject
              </span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Optional subject line (supports merge fields)"
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
              />
            </label>
            <label className="md:col-span-2 flex flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Body
              </span>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={14}
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 font-mono text-sm text-[var(--z-fg)]"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 border-t border-[var(--z-border)] pt-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <input
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="Change summary for new version (optional)"
                className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm font-semibold text-[var(--z-fg)]"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || savingVersion}
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm font-semibold text-[var(--z-fg)] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button
                type="button"
                onClick={handlePublishVersion}
                disabled={saving || savingVersion}
                className="rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] px-3 py-2 text-sm font-semibold text-[var(--z-accent)] disabled:opacity-50"
              >
                {savingVersion ? "Publishing…" : "Publish new version"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-[color-mix(in_oklab,var(--z-danger),transparent_55%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] p-2 text-xs text-[var(--z-danger)]">
              {error}
            </div>
          ) : null}
          {status ? (
            <div className="rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] p-2 text-xs text-[var(--z-accent)]">
              {status}
            </div>
          ) : null}
        </section>

        <section className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Preview context (JSON)
          </div>
          <textarea
            value={contextJson}
            onChange={(e) => setContextJson(e.target.value)}
            rows={10}
            className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 font-mono text-xs text-[var(--z-fg)]"
          />
        </section>
      </div>

      <aside className="space-y-4">
        <TemplatePreview rendered={preview} />
        <MergeFieldBrowser
          mergeFields={mergeFields}
          missing={preview.missingMergeFields}
          onInsert={insertToken}
        />
        {versions && versions.length > 0 ? (
          <VersionHistoryDrawer
            templateId={template.id}
            versions={versions}
            currentBody={body}
            currentSubject={subject || null}
          />
        ) : null}
      </aside>

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        rendered={preview}
        templateId={template.id}
        channel={channel}
      />
    </div>
  );
}
