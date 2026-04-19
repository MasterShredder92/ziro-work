"use client";
/* eslint-disable react-hooks/rules-of-hooks */

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import type { MessagingParticipant } from "@/lib/messaging/types";
import { sendTestMessage } from "../actions/sendTestMessage";
import { isFileDragTransfer, isDragLeaveToOutside } from "./messagingDnD";
import { showMessagingToast } from "./messagingToast";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import {
  previewMergeTemplateText,
  type MessagingTemplateOption,
} from "./templatePreviewMerge";

const DRAFT_KEY_PREFIX = "messaging:draft:";
const DRAFT_SAVE_DEBOUNCE_MS = 300;

function draftKeyForThread(threadId: string): string {
  return `${DRAFT_KEY_PREFIX}${threadId}`;
}

function loadThreadDraft(threadId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(draftKeyForThread(threadId)) ?? "";
  } catch {
    return "";
  }
}

function saveThreadDraft(threadId: string, body: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = draftKeyForThread(threadId);
    if (body.trim().length === 0) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, body);
  } catch {
    // Ignore storage failures (quota/private mode).
  }
}

function clearThreadDraft(threadId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftKeyForThread(threadId));
  } catch {
    // Ignore storage failures.
  }
}

interface MessageComposerProps {
  threadId?: string | null;
  targetId?: string | null;
  canWrite: boolean;
  recipients?: MessagingParticipant[];
  templates?: MessagingTemplateOption[];
  mergeFields?: string[];
  mergeVars?: Record<string, string>;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed reading ${file.name}`));
    reader.onload = () => {
      const value = String(reader.result ?? "");
      const idx = value.indexOf(",");
      resolve(idx >= 0 ? value.slice(idx + 1) : value);
    };
    reader.readAsDataURL(file);
  });
}

export function MessageComposer({
  threadId,
  targetId,
  canWrite,
  recipients = [],
  templates,
  mergeFields = [],
  mergeVars = {},
}: MessageComposerProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<string>(
    targetId ?? recipients[0]?.profileId ?? "",
  );
  const [templateId, setTemplateId] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [attachments, setAttachments] = useState<
    { id: string; name: string; size: number; file: File }[]
  >([]);
  const saveDraftTimerRef = useRef<number | null>(null);

  const onFilesPicked = useCallback((list: FileList | File[] | null) => {
    if (!list?.length) return;
    const next = Array.from(list as File[]).map((f) => ({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: f.size,
      file: f,
    }));
    setAttachments((prev) => [...prev, ...next].slice(0, 8));
  }, []);

  const templateList = templates ?? [];
  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = templateList.find((x) => x.id === id);
    if (t) setBody(t.body);
  }
  function insertMergeField(field: string) {
    setBody((prev) => `${prev}{{${field}}}`);
  }
  const selectedTemplate = templateId
    ? templateList.find((x) => x.id === templateId)
    : undefined;
  const previewVars = mergeVars as Record<string, unknown>;
  const previewSubject = selectedTemplate
    ? previewMergeTemplateText(selectedTemplate.subject ?? "", previewVars)
    : "";
  const previewBody = selectedTemplate
    ? previewMergeTemplateText(selectedTemplate.body, previewVars)
    : "";

  if (!canWrite) {
    return (
      <div className="border-t border-[var(--z-border)] bg-[var(--z-surface)] px-5 py-4 text-xs text-[var(--z-muted)]">
        You have read-only access to messages. Please contact your studio
        administrator to respond.
      </div>
    );
  }

  const activeTarget = targetId ?? selectedTarget;

  useEffect(() => {
    if (saveDraftTimerRef.current != null) {
      window.clearTimeout(saveDraftTimerRef.current);
      saveDraftTimerRef.current = null;
    }
    if (!threadId) return;
    setBody(loadThreadDraft(threadId));
  }, [threadId]);

  useEffect(() => {
    if (!threadId) return;
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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const payload: Record<string, unknown> = { body: body.trim() };
    if (threadId) payload.threadId = threadId;
    if (!threadId && activeTarget) payload.targetId = activeTarget;

    if (!body.trim() && attachments.length === 0) {
      setError("Add a message or attach files.");
      return;
    }
    if (!threadId && !activeTarget) {
      setError("Choose a recipient before sending.");
      return;
    }

    startTransition(async () => {
      try {
        const uploads = await Promise.all(
          attachments.map(async (attachment) => ({
            fileName: attachment.name,
            mimeType: attachment.file.type || "application/octet-stream",
            size: attachment.size,
            base64: await fileToBase64(attachment.file),
          })),
        );
        if (uploads.length > 0) payload.uploads = uploads;
        const res = await fetch("/messages/api/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? `Send failed (${res.status})`);
          return;
        }
        const data = (await res.json()) as {
          thread?: { id?: string };
        };
        setBody("");
        setAttachments([]);
        setTemplateId("");
        if (threadId) clearThreadDraft(threadId);
        const newThreadId = data.thread?.id;
        if (newThreadId) {
          router.replace(`/messages?thread=${newThreadId}`);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Send failed");
      }
    });
  }

  const canSendWithAttach =
    !pending && (body.trim().length > 0 || attachments.length > 0) && (threadId || activeTarget);

  async function handleSendTest() {
    if (testSending || pending) return;
    const trimmed = body.trim();
    const attachNote =
      attachments.length > 0
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
          ? previewMergeTemplateText(
              selectedTemplate.subject ?? "",
              previewVars,
            ).trim() || null
          : null,
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

  return (
    <form
      className="flex flex-col gap-2 border-t border-[var(--z-border)] bg-[var(--z-surface)] px-5 py-4"
      onSubmit={onSubmit}
    >
      {!threadId && recipients.length > 0 ? (
        <label className="flex flex-col gap-1 text-xs text-[var(--z-muted)]">
          <span>Recipient</span>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
          >
            {recipients.map((r) => (
              <option key={r.profileId} value={r.profileId}>
                {r.fullName}
                {r.role ? ` · ${r.role}` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {templateList.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--z-muted)]">
              Template
            </span>
            <select
              value={templateId}
              onChange={(e) => applyTemplate(e.target.value)}
              className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]"
            >
              <option value="">Insert template...</option>
              {templateList.map((t) => (
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
      ) : null}

      <div
        className={`relative rounded-md border border-dashed px-2 py-1 transition-colors ${
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
        <label className="relative z-0 flex flex-col gap-1">
          <span className="sr-only">Message</span>
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
            placeholder="Write a message… (drag files here or use Browse)"
            rows={3}
            className="w-full resize-none rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--z-accent)]"
          />
        </label>
        <div className="relative z-0 mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[var(--z-muted)]">
          <label className="cursor-pointer rounded border border-[var(--z-border)] px-2 py-1 hover:bg-white/[0.04]">
            <input
              type="file"
              className="hidden"
              multiple
              onChange={(e) => onFilesPicked(e.target.files)}
            />
            Browse files
          </label>
          <span>Files are uploaded and attached to the outgoing message.</span>
        </div>
      </div>

      {attachments.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5 text-[11px] text-[var(--z-fg)]">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-0.5"
            >
              <span className="max-w-[180px] truncate">{a.name}</span>
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
        <p className="text-xs text-[var(--z-danger,#b91c1c)]">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-[var(--z-muted)]">
          Press send or Cmd/Ctrl+Enter
        </span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleSendTest}
            disabled={
              testSending ||
              pending ||
              (!body.trim() && attachments.length === 0)
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-1.5 text-xs font-medium text-[var(--z-muted)] transition hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="size-3.5 shrink-0 opacity-80" aria-hidden />
            {testSending ? "Sending test…" : "Send test to myself"}
          </button>
          <button
            type="submit"
            disabled={!canSendWithAttach || testSending}
            className="rounded-md bg-[var(--z-accent)] px-4 py-1.5 text-xs font-semibold text-[var(--z-on-accent,white)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </div>
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
