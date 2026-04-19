"use client";
import * as React from "react";
import { AgentAvatarImage } from "@/components/agentOS/AgentAvatarImage";

const RUBY_IMAGE = "/static/agents/ruby.png";
const RUBY_ACCENT = "#fb923c";
const RUBY_GLOW = "rgba(251,146,60,0.35)";

// ─── Ruby event type ──────────────────────────────────────────────────────────
export type RubyEvent = {
  type:
    | "book_student"
    | "check_in"
    | "call_out"
    | "go_virtual"
    | "move_student"
    | "sub_added"
    | "conflict"
    | "error"
    | "idle";
  message: string;
  detail?: string;
  timestamp?: number;
};

type Props = {
  locationName: string;
  selectedDate: string;
  event?: RubyEvent | null;
  onChat?: (message: string) => void;
};

const IDLE_LINES = [
  "Ready when you are.",
  "All clear — schedule looks good.",
  "I'm watching everything. You're good.",
  "Nothing to flag right now.",
  "Tap me if you need anything.",
];

function randomIdle() {
  return IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)];
}

export function RubyScheduleBar({ locationName, selectedDate, event }: Props) {
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatInput, setChatInput] = React.useState("");
  const [messages, setMessages] = React.useState<Array<{ role: "user" | "ruby"; text: string }>>([
    {
      role: "ruby",
      text: `Hey — I'm Ruby, your scheduling assistant for ${locationName}. I can move students, flag conflicts, find coverage, or just answer questions. What do you need?`,
    },
  ]);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [idleLine] = React.useState(randomIdle);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isConflict = event?.type === "conflict" || event?.type === "error";
  const isSuccess = event?.type === "book_student" || event?.type === "check_in" || event?.type === "sub_added";
  const isAction = event?.type === "call_out" || event?.type === "go_virtual" || event?.type === "move_student";

  const glowColor = isConflict ? "#ef4444" : isSuccess ? "#22c55e" : isAction ? "#f59e0b" : RUBY_ACCENT;
  const statusText = event?.message ?? idleLine;
  const statusTextColor = isConflict ? "#fca5a5" : isSuccess ? "#86efac" : isAction ? "#fde68a" : "#94a3b8";

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/ruby/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, context: { locationName, selectedDate, recentEvent: event } }),
      });
      if (res.ok) {
        const j = await res.json().catch(() => null);
        setMessages((prev) => [...prev, { role: "ruby", text: j?.reply ?? j?.message ?? "Got it — working on it." }]);
      } else {
        setMessages((prev) => [...prev, { role: "ruby", text: "I heard you — the chat API isn't wired up yet, but I'm logging this. Once the integration is set up I'll be able to act on requests like this directly." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "ruby", text: "I'm here — just can't reach the server right now. Try again in a sec." }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <>
      {/* ── Ruby inline bar — prominent center piece ── */}
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="flex items-center gap-3 rounded-2xl px-4 py-2 transition-all hover:bg-white/5 group"
        style={{
          background: `linear-gradient(135deg, ${RUBY_ACCENT}10 0%, transparent 60%)`,
          border: `1px solid ${glowColor}35`,
          boxShadow: `0 0 24px ${glowColor}20`,
          minWidth: 220,
        }}
        aria-label="Open Ruby chat"
        title="Ask Ruby"
      >
        {/* Photo + pulse ring */}
        <div className="relative shrink-0">
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-25"
            style={{ backgroundColor: glowColor, animationDuration: "3s" }}
          />
          <div
            className="relative h-14 w-14 overflow-hidden rounded-full"
            style={{
              boxShadow: `0 0 22px ${glowColor}70`,
              border: `2.5px solid ${glowColor}80`,
            }}
          >
            <AgentAvatarImage src={RUBY_IMAGE} name="Ruby" accent={RUBY_ACCENT} className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Name + status */}
        <div className="text-left min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-tight" style={{ color: RUBY_ACCENT }}>
              Ruby
            </span>
            <span
              className="rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
              style={{ borderColor: `${RUBY_ACCENT}40`, color: RUBY_ACCENT, backgroundColor: `${RUBY_ACCENT}10` }}
            >
              AI
            </span>
            {isConflict && (
              <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-300 animate-pulse">
                ⚠ Alert
              </span>
            )}
          </div>
          <p
            className="text-[11px] leading-snug truncate max-w-[200px] transition-all duration-500 mt-0.5"
            style={{ color: statusTextColor }}
          >
            {statusText}
          </p>
          <p className="text-[9px] mt-0.5 opacity-50" style={{ color: RUBY_ACCENT }}>Tap to chat</p>
        </div>
      </button>

      {/* ── Ruby Chat Modal ── */}
      {chatOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setChatOpen(false)}
            aria-hidden
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border shadow-2xl"
            style={{
              borderColor: `${RUBY_ACCENT}55`,
              backgroundColor: "#0a0a0e",
              height: "min(600px, 85vh)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Ruby chat"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[var(--z-border)] px-5 py-4">
              <div
                className="h-10 w-10 shrink-0 overflow-hidden rounded-full"
                style={{ border: `1.5px solid ${RUBY_ACCENT}60`, boxShadow: `0 0 16px ${RUBY_GLOW}` }}
              >
                <AgentAvatarImage src={RUBY_IMAGE} name="Ruby" accent={RUBY_ACCENT} className="h-full w-full" />
              </div>
              <div>
                <div className="text-sm font-black text-[var(--z-fg)]">Ruby</div>
                <div className="text-[10px] text-[var(--z-muted)]">
                  Schedule AI · {locationName} · {selectedDate}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="ml-auto rounded-lg p-1.5 text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)] transition-colors"
                aria-label="Close"
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "ruby" && (
                    <div
                      className="h-7 w-7 shrink-0 overflow-hidden rounded-full"
                      style={{ border: `1px solid ${RUBY_ACCENT}60`, boxShadow: `0 0 8px ${RUBY_GLOW}` }}
                    >
                      <AgentAvatarImage src={RUBY_IMAGE} name="Ruby" accent={RUBY_ACCENT} className="h-full w-full" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-tr-sm bg-[var(--z-surface-2)] text-[var(--z-fg)]"
                        : "rounded-tl-sm text-[var(--z-fg)]"
                    }`}
                    style={
                      msg.role === "ruby"
                        ? { backgroundColor: `${RUBY_ACCENT}12`, border: `1px solid ${RUBY_ACCENT}25` }
                        : {}
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2">
                  <div
                    className="h-7 w-7 shrink-0 overflow-hidden rounded-full"
                    style={{ border: `1px solid ${RUBY_ACCENT}60` }}
                  >
                    <AgentAvatarImage src={RUBY_IMAGE} name="Ruby" accent={RUBY_ACCENT} className="h-full w-full" />
                  </div>
                  <div
                    className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm"
                    style={{ backgroundColor: `${RUBY_ACCENT}12`, border: `1px solid ${RUBY_ACCENT}25` }}
                  >
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                      <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                      <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[var(--z-border)] px-4 py-3">
              <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Ruby anything about the schedule…"
                  className="flex-1 rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3.5 py-2.5 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none transition-colors"
                  style={{ focusBorderColor: `${RUBY_ACCENT}50` } as React.CSSProperties}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border disabled:opacity-40 transition-colors"
                  style={{ borderColor: `${RUBY_ACCENT}40`, backgroundColor: `${RUBY_ACCENT}15`, color: RUBY_ACCENT }}
                  aria-label="Send"
                >
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
                    <path d="M2 8l12-6-6 12V8H2z" fill="currentColor"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
