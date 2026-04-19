"use client";
import * as React from "react";

// ─── Ruby context type ────────────────────────────────────────────────────────
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

export function RubyScheduleBar({ locationName, selectedDate, event, onChat }: Props) {
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

  // Auto-scroll chat to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Determine current status display
  const isConflict = event?.type === "conflict" || event?.type === "error";
  const isSuccess = event?.type === "book_student" || event?.type === "check_in" || event?.type === "sub_added";
  const isAction = event?.type === "call_out" || event?.type === "go_virtual" || event?.type === "move_student";

  const statusColor = isConflict
    ? "#ef4444"
    : isSuccess
    ? "#00ff88"
    : isAction
    ? "#f59e0b"
    : "#a855f7";

  const statusText = event?.message ?? idleLine;

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
        body: JSON.stringify({
          message: text,
          context: {
            locationName,
            selectedDate,
            recentEvent: event,
          },
        }),
      });
      if (res.ok) {
        const j = await res.json().catch(() => null);
        const reply = j?.reply ?? j?.message ?? "Got it — working on it.";
        setMessages((prev) => [...prev, { role: "ruby", text: reply }]);
      } else {
        // Graceful fallback — Ruby responds even without a backend
        setMessages((prev) => [
          ...prev,
          {
            role: "ruby",
            text: "I heard you — the chat API isn't wired up yet, but I'm logging this. Once the integration is set up I'll be able to act on requests like this directly.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ruby",
          text: "I'm here — just can't reach the server right now. Try again in a sec.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <>
      {/* ── Ruby Bar ── */}
      <div className="relative flex items-center justify-center border-b border-[var(--z-border)] bg-[#0a0a0e] px-4 py-3">
        {/* Subtle radial glow behind Ruby */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 100% at 50% 50%, ${statusColor}12 0%, transparent 70%)`,
            transition: "background 0.8s ease",
          }}
        />

        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="relative flex items-center gap-4 rounded-2xl px-6 py-3 transition-all hover:bg-white/3 group"
          aria-label="Open Ruby chat"
        >
          {/* Ruby orb */}
          <div className="relative shrink-0">
            {/* Outer pulse ring */}
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ backgroundColor: statusColor, animationDuration: "2.5s" }}
            />
            {/* Inner orb */}
            <div
              className="relative flex h-12 w-12 items-center justify-center rounded-full text-lg font-black shadow-lg"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${statusColor}cc, ${statusColor}55)`,
                boxShadow: `0 0 20px ${statusColor}40, 0 0 40px ${statusColor}20`,
                border: `1.5px solid ${statusColor}60`,
                color: "#fff",
                fontSize: "20px",
              }}
            >
              ✦
            </div>
          </div>

          {/* Ruby name + status */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span
                className="text-base font-black tracking-tight"
                style={{ color: statusColor }}
              >
                Ruby
              </span>
              <span className="rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                style={{ borderColor: `${statusColor}40`, color: statusColor, backgroundColor: `${statusColor}10` }}
              >
                AI
              </span>
              {isConflict && (
                <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-300 animate-pulse">
                  Needs Attention
                </span>
              )}
            </div>
            <p
              className="mt-0.5 max-w-sm text-sm leading-snug transition-all duration-500"
              style={{ color: isConflict ? "#fca5a5" : isSuccess ? "#86efac" : "#94a3b8" }}
            >
              {statusText}
            </p>
          </div>

          {/* Tap hint */}
          <div className="ml-4 shrink-0 rounded-xl border border-[var(--z-border)] px-3 py-1.5 text-[11px] font-semibold text-[var(--z-muted)] group-hover:border-[var(--z-fg)]/20 group-hover:text-[var(--z-fg)] transition-colors">
            Ask Ruby
          </div>
        </button>
      </div>

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
              borderColor: "rgba(168,85,247,0.35)",
              backgroundColor: "#0a0a0e",
              height: "min(600px, 85vh)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Ruby chat"
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-[var(--z-border)] px-5 py-4">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-black"
                style={{
                  background: "radial-gradient(circle at 35% 35%, #a855f7cc, #a855f755)",
                  boxShadow: "0 0 16px #a855f740",
                  border: "1.5px solid #a855f760",
                  color: "#fff",
                }}
              >
                ✦
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
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {msg.role === "ruby" && (
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
                      style={{
                        background: "radial-gradient(circle at 35% 35%, #a855f7cc, #a855f755)",
                        border: "1px solid #a855f760",
                        color: "#fff",
                      }}
                    >
                      ✦
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
                        ? {
                            backgroundColor: "rgba(168,85,247,0.12)",
                            border: "1px solid rgba(168,85,247,0.2)",
                          }
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
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
                    style={{
                      background: "radial-gradient(circle at 35% 35%, #a855f7cc, #a855f755)",
                      border: "1px solid #a855f760",
                      color: "#fff",
                    }}
                  >
                    ✦
                  </div>
                  <div
                    className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm"
                    style={{
                      backgroundColor: "rgba(168,85,247,0.12)",
                      border: "1px solid rgba(168,85,247,0.2)",
                    }}
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
              <form
                onSubmit={(e) => { e.preventDefault(); sendChat(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Ruby anything about the schedule…"
                  className="flex-1 rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3.5 py-2.5 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:border-[#a855f7]/50 focus:outline-none transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#a855f7]/40 bg-[#a855f7]/15 text-[#a855f7] disabled:opacity-40 hover:bg-[#a855f7]/25 transition-colors"
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
