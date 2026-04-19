"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { ChannelType } from "@/lib/messaging/types";
import { sendTestMessage } from "../actions/sendTestMessage";
import { isFileDragTransfer, isDragLeaveToOutside } from "./messagingDnD";
import { showMessagingToast } from "./messagingToast";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import {
  previewMergeTemplateText,
  type MessagingTemplateOption,
} from "./templatePreviewMerge";

type ComposerAttachment = { id: string; name: string; size: number };

interface ThreadComposerProps {
  threadId: string;
  defaultChannel: ChannelType;
  templates: MessagingTemplateOption[];
  mergeFields: string[];
  /** Values for `{{field}}` preview substitution (optional). */
  mergeVars?: Record<string, string>;
  /** Thread title (optional) — used as test email subject when no template subject. */
  threadSubject?: string | null;
  canWrite: boolean;
}

export function ThreadComposer({
  threadId,
  defaultChannel,
  templates,
  mergeFields,
  mergeVars = {},
  threadSubject = null,
  canWrite,
}: ThreadComposerProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<ChannelType>(defaultChannel);
  const [templateId, setTemplateId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const onFilesPicked = useCallback((list: FileList | File[] | null) => {
    if (!list?.length) return;
    const next: ComposerAttachment[] = Array.from(list as File[]).map((f) => ({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: f.size,
    }));
    setAttachments((prev) => [...prev, ...next].slice(0, 8));
  }, []);

  function insertMergeField(field: string) {
    setBody((prev) => `${prev}{{${field}}}`);
  }

  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) {
      setBody(t.body);
    }
  }

  const selectedTemplate = templateId
    ? templates.find((x) => x.id === templateId)
    : undefined;
  const previewVars = mergeVars as Record<string, unknown>;
  const previewSubject = selectedTemplate
    ? previewMergeTemplateText(selectedTemplate.subject ?? "", previewVars)
    : "";
  const previewBody = selectedTemplate
    ? previewMergeTemplateText(selectedTemplate.body, previewVars)
    : "";

  const testEmailSubjectRaw = selectedTemplate
    ? (selectedTemplate.subject ?? "")
    : (threadSubject ?? "");
  const testEmailSubject =
    previewMergeTemplateText(testEmailSubjectRaw, previewVars).trim() || null;

  async function handleSendTest() {
    if (testSending || submitting) return;
    const trimmed = body.trim();
    const attachNote =
      attachments.length > 0
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
      showMessagingToast(
        result.ok
          ? "Test message sent to your email."
          : "Could not send test message.",
        result.ok ? "success" : "error",
      );
    } catch {
      showMessagingToast("Could not send test message.", "error");
    } finally {
      setTestSending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const trimmed = body.trim();
    const attachNote =
      attachments.length > 0
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
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to send");
      }
      setBody("");
      setTemplateId("");
      setAttachments([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canWrite) {
    return (
      <div className="rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-sm text-[var(--z-muted)]">
        You do not have permission to send messages in this thread.
      </div>
    );
  }

  const canSend =
    !submitting &&
    (body.trim().length > 0 || attachments.length > 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as ChannelType)}
          className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]"
        >
          <option value="in_app">In-app</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="push">Push</option>
        </select>
        {templates.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            <select
              value={templateId}
              onChange={(e) => applyTemplate(e.target.value)}
              className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]"
            >
              <option value="">Insert template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {templateId && selectedTemplate ? (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs font-medium text-[var(--z-fg)] hover:bg-[var(--z-surface-hover)]"
              >
                Preview
              </button>
            ) : null}
          </div>
        ) : null}
        {mergeFields.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {mergeFields.map((field) => (
              <button
                type="button"
                key={field}
                onClick={() => insertMergeField(field)}
                className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]"
              >
                {field}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className={`relative rounded-md border border-dashed transition-colors ${
          dragOver
            ? "border-[var(--z-accent)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)]"
            : "border-[var(--z-border)]"
        }`}
        onDragEnter={(e) => {
          if (!isFileDragTransfer(e.dataTransfer)) return;
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          if (!isFileDragTransfer(e.dataTransfer)) return;
          if (!isDragLeaveToOutside(e, e.currentTarget)) return;
          setDragOver(false);
        }}
        onDragOver={(e) => {
          if (!isFileDragTransfer(e.dataTransfer)) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          if (!isFileDragTransfer(e.dataTransfer)) return;
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          if (e.dataTransfer.files?.length) onFilesPicked(e.dataTransfer.files);
        }}
      >
        {dragOver ? (
          <div
            className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center rounded-md border-2 border-dashed border-[var(--z-accent)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)] text-xs font-semibold text-[var(--z-fg)]"
            aria-hidden
          >
            Drop files to attach
          </div>
        ) : null}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onDragOver={(e) => {
            if (!isFileDragTransfer(e.dataTransfer)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(e) => {
            if (!isFileDragTransfer(e.dataTransfer)) return;
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            if (e.dataTransfer.files?.length) onFilesPicked(e.dataTransfer.files);
          }}
          rows={4}
          placeholder="Write a reply… (drag files here or use Browse)"
          className="relative z-0 w-full resize-y rounded-md border border-transparent bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] focus:border-[var(--z-border)] focus:outline-none focus:ring-2 focus:ring-[var(--z-accent)]"
        />
        <div className="relative z-0 flex flex-wrap items-center gap-2 border-t border-[var(--z-border)] px-2 py-1.5 text-[10px] text-[var(--z-muted)]">
          <label className="cursor-pointer rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 hover:bg-[var(--z-surface-hover)]">
            <input
              type="file"
              className="hidden"
              multiple
              onChange={(e) => onFilesPicked(e.target.files)}
            />
            Browse files
          </label>
          <span>
            Up to 8 files; names are appended to the message (binary upload not
            wired yet).
          </span>
        </div>
      </div>

      {attachments.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5 text-[11px] text-[var(--z-fg)]">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-0.5"
            >
              <span className="max-w-[200px] truncate" title={a.name}>
                {a.name}
              </span>
              <span className="text-[var(--z-muted)]">
                {(a.size / 1024).toFixed(a.size < 1024 ? 1 : 0)} KB
              </span>
              <button
                type="button"
                className="text-[var(--z-muted)] hover:text-[var(--z-fg)]"
                aria-label={`Remove ${a.name}`}
                onClick={() =>
                  setAttachments((prev) => prev.filter((x) => x.id !== a.id))
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {error}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleSendTest}
          disabled={
            testSending ||
            submitting ||
            (!body.trim() && attachments.length === 0)
          }
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-1.5 text-xs font-medium text-[var(--z-muted)] transition hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles className="size-3.5 shrink-0 opacity-80" aria-hidden />
          {testSending ? "Sending test…" : "Send test to myself"}
        </button>
        <button
          type="submit"
          disabled={!canSend || testSending}
          className="rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-sm font-semibold text-[var(--z-on-accent,white)] shadow-sm hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Send"}
        </button>
      </div>

      {selectedTemplate ? (
        <TemplatePreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          templateName={selectedTemplate.name}
          renderedSubject={previewSubject}
          renderedBody={previewBody}
        />
      ) : null}
    </form>
  );
}
