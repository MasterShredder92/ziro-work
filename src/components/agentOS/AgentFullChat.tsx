"use client";

import * as React from "react";
import { X, Send, Loader2 } from "lucide-react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useAgentOS } from "./AgentOSContext";
import { AgentAvatarImage } from "./AgentAvatarImage";

type ChatMessage = { id: string; role: "user" | "assistant" | "system"; text: string };

export function AgentFullChat() {
  const { fullChatOpen, closeFullChat, meta, agentId, setState } = useAgentOS();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // Pick up a "seed" message from AgentBubble on open.
  React.useEffect(() => {
    if (!fullChatOpen) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { agentId?: string; text?: string } | undefined;
      if (!detail?.text) return;
      void send(detail.text);
    };
    window.addEventListener("ziro:agent-chat-seed", handler as EventListener);
    return () => window.removeEventListener("ziro:agent-chat-seed", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullChatOpen, agentId]);

  // Reset on close.
  React.useEffect(() => {
    if (fullChatOpen) return;
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, [fullChatOpen]);

  // Auto-scroll to bottom on new content.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const appendAssistantDelta = React.useCallback((delta: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "assistant") {
        const next = prev.slice(0, -1);
        next.push({ ...last, text: last.text + delta });
        return next;
      }
      return [...prev, { id: cryptoId(), role: "assistant", text: delta }];
    });
  }, []);

  const send = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      setInput("");
      setMessages((prev) => [...prev, { id: cryptoId(), role: "user", text: trimmed }]);
      setStreaming(true);
      setState("thinking");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Build history from current messages (exclude the user msg we just added)
        const history = messages.map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        }));

        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            message: trimmed,
            context: {},
            history,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`${res.status} ${body || "request failed"}`);
        }
        setState("speaking");

        const j = await res.json().catch(() => null);
        const replyText = j?.reply ?? "Got it.";
        appendAssistantDelta(replyText);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") {
          setMessages((prev) => [
            ...prev,
            { id: cryptoId(), role: "system", text: "Stopped." },
          ]);
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          setMessages((prev) => [
            ...prev,
            { id: cryptoId(), role: "system", text: `Couldn’t reach ${meta.displayName}: ${msg}` },
          ]);
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
        setState("idle");
      }
    },
    [agentId, appendAssistantDelta, meta.displayName, setState, streaming],
  );

  if (!fullChatOpen) return null;

  const style = {
    "--z-agent-accent": meta.accent,
    "--z-agent-glow": meta.glow,
  } as React.CSSProperties;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Chat with ${meta.displayName}`}
      className="fixed inset-0 z-[9999] flex flex-col bg-[var(--z-bg)]/95 backdrop-blur-md"
      style={style}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-[var(--z-border)] px-4 py-3 sm:px-6">
        <div
          className="h-10 w-10 shrink-0 overflow-hidden rounded-full border"
          style={{ borderColor: "color-mix(in oklab, var(--z-agent-accent), transparent 35%)" }}
        >
          <AgentAvatarImage src={meta.imagePath} name={meta.displayName} accent={meta.accent} className="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[10px] font-extrabold uppercase tracking-[0.16em]"
            style={{ color: "var(--z-agent-accent)" }}
          >
            ZiroWork · Full Chat
          </div>
          <h2 className="truncate text-lg font-bold tracking-tight text-[var(--z-fg)]">{meta.displayName}</h2>
        </div>
        <button
          type="button"
          onClick={closeFullChat}
          aria-label="Close"
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full text-[var(--z-muted)] transition-colors hover:bg-white/5 hover:text-[var(--z-fg)]",
            focusRingClassName(),
          )}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {messages.length === 0 ? (
            <div className="mt-8 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_25%)]">
              <div
                className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em]"
                style={{ color: "var(--z-agent-accent)" }}
              >
                {meta.tagline}
              </div>
              Start a conversation. Ask anything or try a quick action from the bubble.
            </div>
          ) : null}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {streaming && messages[messages.length - 1]?.role !== "assistant" ? (
            <div className="flex items-center gap-2 text-xs text-[var(--z-muted)]">
              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              <span>Thinking…</span>
            </div>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="shrink-0 border-t border-[var(--z-border)] bg-[var(--z-surface-2)] px-4 py-3 sm:px-8"
      >
        <div
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-[var(--z-radius-lg)] border bg-[var(--z-surface)] px-3 py-2 focus-within:border-[color-mix(in_oklab,var(--z-agent-accent),transparent_45%)]"
          style={{ borderColor: "var(--z-border)" }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder={`Message ${meta.displayName}…`}
            className="min-h-[36px] max-h-40 w-full resize-none bg-transparent text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none"
            disabled={streaming}
          />
          {streaming ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className={cn(
                "h-9 rounded-[var(--z-radius-md)] border px-3 text-xs font-semibold text-[var(--z-fg)] hover:bg-white/5",
                focusRingClassName(),
              )}
              style={{ borderColor: "var(--z-border)" }}
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-[var(--z-radius-md)] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
                focusRingClassName(),
              )}
              style={{ background: "var(--z-agent-accent)" }}
            >
              <Send size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  return (
    <div
      className={cn(
        "max-w-[85%] whitespace-pre-wrap rounded-[var(--z-radius-lg)] border px-4 py-2.5 text-sm leading-relaxed",
        isUser && "ml-auto",
        isSystem && "mx-auto text-center text-xs italic",
      )}
      style={{
        borderColor: isUser
          ? "color-mix(in oklab, var(--z-agent-accent), transparent 55%)"
          : "var(--z-border)",
        background: isUser
          ? "color-mix(in oklab, var(--z-agent-accent), transparent 88%)"
          : isSystem
            ? "transparent"
            : "var(--z-surface)",
        color: isSystem ? "var(--z-muted)" : "var(--z-fg)",
      }}
    >
      {message.text}
    </div>
  );
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
