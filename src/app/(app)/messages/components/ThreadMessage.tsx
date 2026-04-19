"use client";

import {
  useEffect,
  useRef,
  useState,
  type TextareaHTMLAttributes,
} from "react";
import { Loader2, MoreHorizontal, Pencil, Pin, SmilePlus, Trash2 } from "lucide-react";
import type { Message } from "@/lib/messaging/types";
import { renderMessageMetadata } from "./messageMetadata";
import { buildPlainSearchText, splitWithHighlights } from "./searchThreadMessages";
import { ReactionPicker } from "./ReactionPicker";
import type { AllowedReaction } from "./useMessageReactions";

export type ThreadMessageProps = {
  message: Message;
  senderLabel: string;
  isMine: boolean;
  isSystem: boolean;
  compactMeta: boolean;
  groupedWithPrevious: boolean;
  searchQuery?: string;
  isActiveSearchMatch?: boolean;
  reactions?: Record<string, number>;
  hasReaction?: (reaction: AllowedReaction) => boolean;
  onToggleReaction?: (reaction: AllowedReaction) => {
    added: boolean;
    removed: boolean;
  };
  onReactionAdded?: (reaction: AllowedReaction) => void;
  isPinned?: boolean;
  onTogglePin?: () => { pinned: boolean; unpinned: boolean };
  onPinAdded?: () => void;
  pulseToken?: number;
  canEdit?: boolean;
  isEditing?: boolean;
  editIsSaving?: boolean;
  onStartEdit?: () => void;
  editInputProps?: TextareaHTMLAttributes<HTMLTextAreaElement>;
  canDelete?: boolean;
  isDeleted?: boolean;
  onDelete?: () => void;
  onUndoDelete?: () => void;
  showUndoEdit?: boolean;
  onUndoEdit?: () => void;
  onQuickReact?: () => void;
  onFocusMessage?: () => void;
};

function HighlightedText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  return (
    <>
      {splitWithHighlights(text, q).map((seg, i) =>
        seg.hit ? (
          <span key={i} className="rounded bg-yellow-500/30 px-0.5">
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

export function ThreadMessage({
  message,
  senderLabel,
  isMine,
  isSystem,
  compactMeta,
  groupedWithPrevious,
  searchQuery = "",
  isActiveSearchMatch = false,
  reactions = {},
  hasReaction = () => false,
  onToggleReaction,
  onReactionAdded,
  isPinned = false,
  onTogglePin,
  onPinAdded,
  pulseToken = 0,
  canEdit = false,
  isEditing = false,
  editIsSaving = false,
  onStartEdit,
  editInputProps,
  canDelete = false,
  isDeleted = false,
  onDelete,
  onUndoDelete,
  showUndoEdit = false,
  onUndoEdit,
  onQuickReact,
  onFocusMessage,
}: ThreadMessageProps) {
  const marginTop = groupedWithPrevious ? "mt-0.5" : "mt-3";
  const q = searchQuery.trim();
  const searchOn = q.length > 0;
  const metadata = renderMessageMetadata(message);
  const activeRing =
    isActiveSearchMatch && searchOn
      ? "motion-safe:animate-[pulse_1.2s_ease-out] ring-2 ring-[var(--z-accent)]/55"
      : "";

  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const editRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (pulseToken <= 0) return;
    if (!bubbleRef.current || typeof bubbleRef.current.animate !== "function") return;
    bubbleRef.current.animate(
      [
        { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(250,204,21,0)" },
        { transform: "scale(1.01)", boxShadow: "0 0 0 6px rgba(250,204,21,0.2)" },
        { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(250,204,21,0)" },
      ],
      { duration: 560, easing: "cubic-bezier(0.22,1,0.36,1)" },
    );
  }, [pulseToken]);

  useEffect(() => {
    if (!isEditing || !editRef.current) return;
    const el = editRef.current;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 280)}px`;
  }, [isEditing, editInputProps?.value]);

  if (isSystem) {
    return (
      <div className={`mx-auto max-w-lg px-2 text-center text-xs text-zinc-500 ${marginTop}`}>
        {searchOn ? <HighlightedText text={message.body} query={q} /> : message.body}
      </div>
    );
  }

  const timestampEl = metadata.deleted.show ? (
    <span
      title={metadata.deleted.tooltip ?? undefined}
      className="text-zinc-400"
    >
      {metadata.deleted.label}
    </span>
  ) : (
    <span title={metadata.timestampTooltip} className="text-zinc-400">
      {metadata.timestampLabel}
    </span>
  );

  const header = compactMeta ? (
    <span className="inline-flex items-center gap-1">
      {timestampEl}
      {metadata.edited.show ? (
        <span
          title={metadata.edited.tooltip ?? undefined}
          className="rounded-full border border-[var(--z-border)] px-1 py-0 text-[10px] tracking-normal text-[var(--z-muted)]"
        >
          {metadata.edited.label}
        </span>
      ) : null}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-zinc-400">
      {searchOn && !metadata.deleted.show ? (
        <HighlightedText text={`${senderLabel} ${"\u2022"}`} query={q} />
      ) : (
        <>
          {senderLabel} {"\u2022"}
        </>
      )}
      {timestampEl}
      {metadata.edited.show ? (
        <span
          title={metadata.edited.tooltip ?? undefined}
          className="rounded-full border border-[var(--z-border)] px-1 py-0 text-[10px] tracking-normal text-[var(--z-muted)]"
        >
          {metadata.edited.label}
        </span>
      ) : null}
    </span>
  );

  const hasHtml = Boolean(message.bodyHtml?.trim());
  const plainForSearch = buildPlainSearchText(message);
  const bodyBlock =
    searchOn && hasHtml ? (
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--z-fg)]">
        <HighlightedText text={plainForSearch} query={q} />
      </div>
    ) : hasHtml ? (
      <div
        className="text-sm leading-relaxed text-[var(--z-fg)] [&_a]:text-[var(--z-accent)] [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: message.bodyHtml as string }}
      />
    ) : (
      <div className="whitespace-pre-wrap text-sm text-[var(--z-fg)]">
        {searchOn ? <HighlightedText text={message.body} query={q} /> : message.body}
      </div>
    );

  const orderedReactions = (
    ["\u{1F44D}", "\u{2764}\u{FE0F}", "\u{2714}\u{FE0F}", "\u{2757}"] as const
  ).filter(
    (reaction) => (reactions[reaction] ?? 0) > 0,
  );

  const handleToggleReaction = (reaction: AllowedReaction) => {
    if (!onToggleReaction) return;
    const result = onToggleReaction(reaction);
    if (result.added) onReactionAdded?.(reaction);
  };

  const handleTogglePin = () => {
    if (!onTogglePin) return;
    const result = onTogglePin();
    if (result.pinned) onPinAdded?.();
  };

  return (
    <div
      tabIndex={0}
      onFocus={onFocusMessage}
      className={`group relative flex w-full flex-col ${isMine ? "items-end" : "items-start"} ${marginTop}`}
    >
      {!isDeleted ? (
        <div
          className={`pointer-events-none absolute top-1 z-10 hidden items-center gap-1 rounded-full border border-[var(--z-border)] bg-[var(--z-surface)] px-1.5 py-1 text-[var(--z-muted)] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 sm:flex ${
            isMine ? "right-[calc(100%+8px)]" : "right-2"
          }`}
        >
          <button
            type="button"
            onClick={onQuickReact}
            className="pointer-events-auto rounded p-1 hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)]"
            aria-label="React"
          >
            <SmilePlus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleTogglePin}
            className="pointer-events-auto rounded p-1 hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)]"
            aria-label={isPinned ? "Unpin" : "Pin"}
          >
            <Pin className={`size-3.5 ${isPinned ? "fill-current text-amber-300" : ""}`} />
          </button>
          {canEdit ? (
            <button
              type="button"
              onClick={onStartEdit}
              className="pointer-events-auto rounded p-1 hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)]"
              aria-label="Edit"
            >
              <Pencil className="size-3.5" />
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="pointer-events-auto rounded p-1 text-red-300 hover:bg-red-500/10"
              aria-label="Delete"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
      <div
        ref={bubbleRef}
        className={`max-w-[min(85%,520px)] rounded-lg border p-3 shadow-sm ${activeRing} ${
          isMine
            ? "border-[var(--z-accent)]/40 bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)]"
            : "border-[var(--z-border)] bg-[var(--z-surface-2)]"
        } ${isPinned ? "border-l-4 border-l-amber-400" : ""} ${
          isDeleted
            ? "border-dashed border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),transparent_22%)]"
            : ""
        }`}
      >
        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
          <div>{header}</div>
          {isPinned ? (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-amber-300">
              <Pin className="size-3" />
              Pinned
            </span>
          ) : null}
        </div>
        {message.subject && !isDeleted ? (
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--z-muted)]">
            {searchOn ? (
              <HighlightedText text={message.subject ?? ""} query={q} />
            ) : (
              message.subject
            )}
          </div>
        ) : null}
        {isDeleted ? (
          <div className="flex items-center gap-2 text-sm italic text-[var(--z-muted)]">
            <span>
              Message deleted {"\u2022"}
            </span>
            <button
              type="button"
              onClick={onUndoDelete}
              className="rounded px-1.5 py-0.5 text-xs text-[var(--z-accent)] hover:bg-[var(--z-surface-hover)]"
            >
              Undo
            </button>
          </div>
        ) : isEditing ? (
          <div className="space-y-1">
            <textarea
              {...editInputProps}
              ref={editRef}
              rows={3}
              className="w-full resize-none rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--z-accent)]"
              onInput={(event) => {
                const el = event.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 280)}px`;
              }}
            />
            <div className="flex items-center gap-1 text-[10px] text-[var(--z-muted)]">
              {editIsSaving ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Saving...
                </>
              ) : (
                "Editing... Enter to save, Shift+Enter for newline, Esc to cancel"
              )}
            </div>
          </div>
        ) : (
          bodyBlock
        )}
        {message.attachments.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {message.attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-[220px] items-center truncate rounded-full border border-[var(--z-border)] bg-[var(--z-bg)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--z-fg)] transition hover:bg-[var(--z-surface-hover)]"
                >
                  {searchOn ? <HighlightedText text={a.name} query={q} /> : a.name}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {!isDeleted ? (
        <button
          type="button"
          onClick={handleTogglePin}
          className={`absolute top-2 rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] p-1 text-[var(--z-muted)] transition hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)] ${
            isMine ? "right-2" : "left-2"
          } hidden sm:inline-flex ${isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          aria-label={isPinned ? "Unpin message" : "Pin message"}
        >
          <Pin className={`size-3 ${isPinned ? "fill-current text-amber-300" : ""}`} />
        </button>
      ) : null}

      <div className={`absolute top-2 ${isMine ? "right-10" : "left-10"} inline-flex`}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] transition hover:bg-[var(--z-surface-hover)] sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Message options"
          aria-expanded={menuOpen}
        >
          <MoreHorizontal className="size-3.5" />
        </button>
        {menuOpen ? (
          <div className="absolute top-7 z-20 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-1 shadow-md">
            {!isDeleted ? (
              <button
                type="button"
                onClick={() => {
                  handleTogglePin();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs text-[var(--z-fg)] hover:bg-[var(--z-surface-hover)]"
              >
                <Pin className="size-3.5" />
                {isPinned ? "Unpin" : "Pin"}
              </button>
            ) : null}
            {canEdit ? (
              <button
                type="button"
                onClick={() => {
                  onStartEdit?.();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs text-[var(--z-fg)] hover:bg-[var(--z-surface-hover)]"
              >
                Edit
              </button>
            ) : null}
            {canDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete?.();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {!isDeleted && showUndoEdit ? (
        <div
          className={`mt-1 flex items-center gap-1 text-xs text-[var(--z-muted)] ${
            isMine ? "justify-end" : "justify-start pl-8"
          }`}
        >
          <button
            type="button"
            onClick={onUndoEdit}
            className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-accent)] transition hover:bg-[var(--z-surface-hover)]"
          >
            Undo edit
          </button>
        </div>
      ) : null}

      {!isDeleted ? (
        <div
          className={`mt-1 flex items-center gap-1 text-xs text-[var(--z-muted)] ${
            isMine ? "justify-end" : "justify-start pl-8"
          }`}
        >
        {orderedReactions.map((reaction) => {
          const count = reactions[reaction] ?? 0;
          const active = hasReaction(reaction);
          return (
            <button
              key={reaction}
              type="button"
              onClick={() => handleToggleReaction(reaction)}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
                active
                  ? "border-[var(--z-accent)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)] text-[var(--z-fg)]"
                  : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]"
              }`}
              aria-label={`Toggle reaction ${reaction}`}
            >
              <span>{reaction}</span>
              <span>{count}</span>
            </button>
          );
        })}
        <button
          ref={addButtonRef}
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] text-xs text-[var(--z-muted)] transition hover:bg-[var(--z-surface-hover)]"
          aria-label="Add reaction"
          aria-expanded={pickerOpen}
        >
          +
        </button>
        <ReactionPicker
          open={pickerOpen}
          anchorRef={addButtonRef}
          onClose={() => setPickerOpen(false)}
          onToggleReaction={handleToggleReaction}
          hasReaction={hasReaction}
        />
        </div>
      ) : null}

      {!compactMeta ? (
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)]">
          <span className="rounded-full border border-[var(--z-border)] px-1.5 py-0.5">
            {searchOn ? (
              <HighlightedText text={message.channelType} query={q} />
            ) : (
              message.channelType
            )}
          </span>
          <span
            className={`rounded-full px-1.5 py-0.5 ${
              message.deliveryStatus === "delivered" || message.deliveryStatus === "read"
                ? "bg-emerald-500/15 text-emerald-200"
                : message.deliveryStatus === "failed"
                  ? "bg-red-500/15 text-red-200"
                  : "bg-amber-500/15 text-amber-100"
            }`}
          >
            {message.deliveryStatus}
          </span>
        </div>
      ) : null}
    </div>
  );
}
