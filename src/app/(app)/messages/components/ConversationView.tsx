import type { ConversationDetail } from "@/lib/messaging/types";

interface ConversationViewProps {
  detail: ConversationDetail | null;
  currentProfileId: string;
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ConversationView({
  detail,
  currentProfileId,
}: ConversationViewProps) {
  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-[var(--z-muted)]">
        Select a thread on the left to view the conversation.
      </div>
    );
  }

  const { thread, messages } = detail;
  const title =
    thread.counterpart?.fullName ?? thread.subject ?? "Conversation";

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-col gap-1 border-b border-[var(--z-border)] bg-[var(--z-surface)] px-5 py-4">
        <h1 className="text-base font-semibold text-[var(--z-fg)]">{title}</h1>
        <p className="text-xs text-[var(--z-muted)]">
          {detail.participants.length} participant
          {detail.participants.length === 1 ? "" : "s"}
          {thread.counterpart?.role ? ` · ${thread.counterpart.role}` : ""}
        </p>
      </header>

      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-[var(--z-muted)]">
          No messages yet. Send the first one below.
        </div>
      ) : (
        <ol className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          {messages.map((msg) => {
            const mine = msg.authorProfileId === currentProfileId;
            return (
              <li
                key={msg.id}
                className={`flex flex-col gap-1 ${
                  mine ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    mine
                      ? "bg-[var(--z-accent)] text-[var(--z-on-accent,white)]"
                      : "bg-[var(--z-surface-hover)] text-[var(--z-fg)]"
                  }`}
                >
                  {msg.body}
                </div>
                <span className="text-[10px] uppercase tracking-wide text-[var(--z-muted)]">
                  {msg.authorName ?? (mine ? "You" : "Them")} ·{" "}
                  {formatTimestamp(msg.createdAt)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
