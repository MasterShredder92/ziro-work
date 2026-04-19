import Link from "next/link";
import type {
  Message,
  MessageParticipant,
  MessageThread,
} from "@/lib/messaging/types";

interface ThreadViewProps {
  thread: MessageThread;
  messages: Message[];
  participants: MessageParticipant[];
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

export function ThreadView({
  thread,
  messages,
  participants,
  currentProfileId,
}: ThreadViewProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <header className="flex flex-col gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-base font-semibold text-[var(--z-fg)]">
              {thread.subject ?? "Conversation"}
            </h1>
            <p className="text-xs text-[var(--z-muted)]">
              {participants.length} participant
              {participants.length === 1 ? "" : "s"} ·{" "}
              <span className="uppercase tracking-wide">
                {thread.channelType}
              </span>{" "}
              · {thread.status}
            </p>
          </div>
          <Link
            href="/messages"
            className="rounded-md border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]"
          >
            Back
          </Link>
        </div>
        {participants.length > 0 ? (
          <ul className="flex flex-wrap gap-1">
            {participants.map((p) => (
              <li
                key={p.id}
                className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)]"
              >
                {p.display?.fullName ?? p.profileId.slice(0, 8)}
                {p.role ? ` · ${p.role}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[var(--z-border)] p-8 text-center text-sm text-[var(--z-muted)]">
          No messages yet. Send the first one below.
        </div>
      ) : (
        <ol className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3">
          {messages.map((msg) => {
            const mine = msg.senderId === currentProfileId;
            return (
              <li
                key={msg.id}
                className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    mine
                      ? "bg-[var(--z-accent)] text-[var(--z-on-accent,white)]"
                      : "bg-[var(--z-surface-hover)] text-[var(--z-fg)]"
                  }`}
                >
                  {msg.subject ? (
                    <div className="mb-1 text-[10px] uppercase tracking-wide opacity-80">
                      {msg.subject}
                    </div>
                  ) : null}
                  <div className="whitespace-pre-wrap">{msg.body}</div>
                  {msg.attachments.length > 0 ? (
                    <ul className="mt-2 flex flex-col gap-1 border-t border-white/20 pt-2">
                      {msg.attachments.map((a) => (
                        <li key={a.id} className="text-[11px]">
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            {a.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-[var(--z-muted)]">
                  <span>
                    {mine ? "You" : msg.senderId.slice(0, 8)} ·{" "}
                    {formatTimestamp(msg.createdAt)}
                  </span>
                  <span className="rounded-full border border-[var(--z-border)] px-1.5 py-0.5">
                    {msg.channelType}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 ${
                      msg.deliveryStatus === "delivered" ||
                      msg.deliveryStatus === "read"
                        ? "bg-green-100 text-green-800"
                        : msg.deliveryStatus === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {msg.deliveryStatus}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
