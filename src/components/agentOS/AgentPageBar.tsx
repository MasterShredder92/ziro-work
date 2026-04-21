"use client";
import * as React from "react";
import { AgentAvatarImage } from "./AgentAvatarImage";
import { AGENT_METADATA } from "@/lib/agents/agentMetadata";

export type AgentPageBarProps = {
  /** Agent ID — must match a key in AGENT_METADATA (ruby, bub, star, stewie, vader, ziro, sid) */
  agentId: string;
  /** Page context passed to the AI */
  pageContext?: Record<string, unknown>;
  /** Short status/idle line shown in the bar */
  statusLine?: string;
  /** Placeholder text for the chat input */
  chatPlaceholder?: string;
  /** System prompt override for this agent on this page */
  systemPrompt?: string;
  /** API route for chat — defaults to /api/agent/chat */
  chatRoute?: string;
};

const IDLE_LINES_BY_AGENT: Record<string, string[]> = {
  ruby: [
    "Ready when you are.",
    "All clear — schedule looks good.",
    "I'm watching everything.",
    "Nothing to flag right now.",
  ],
  bub: [
    "Money in, money out — I'm on it.",
    "Watching your revenue.",
    "Ready to pull the numbers.",
    "Ask me about any invoice.",
  ],
  star: [
    "Your leads are ready.",
    "I know who to call first.",
    "Watching your pipeline.",
    "Ready to prioritize.",
  ],
  stewie: [
    "I know who needs a follow-up.",
    "Watching your contacts.",
    "Ready when you are.",
    "No one slips through.",
  ],
  vader: [
    "Ready to send a message.",
    "Watching your inbox.",
    "I'll handle the outreach.",
    "Who do you need to reach?",
  ],
  ziro: [
    "How can I help?",
    "Ask me anything.",
    "I know this system inside out.",
    "Ready.",
  ],
  sid: [
    "I see who might be at risk.",
    "Watching retention signals.",
    "Ready to flag concerns.",
    "Ask me about any student.",
  ],
};

function randomIdle(agentId: string): string {
  const lines = IDLE_LINES_BY_AGENT[agentId] ?? ["Ready."];
  return lines[Math.floor(Math.random() * lines.length)];
}

type ChatMessage = { role: "user" | "agent"; text: string };

export function AgentPageBar({
  agentId,
  pageContext = {},
  statusLine,
  chatPlaceholder,
  systemPrompt,
  chatRoute = "/api/agent/chat",
}: AgentPageBarProps) {
  const meta = AGENT_METADATA[agentId] ?? AGENT_METADATA["ziro"];
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatInput, setChatInput] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: "agent",
      text: `Hey — I'm ${meta.displayName}. ${meta.tagline} What do you need?`,
    },
  ]);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [idleLine] = React.useState(() => statusLine ?? randomIdle(agentId));
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const chatModalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // On desktop (md+) center the modal; on mobile keep it anchored to bottom
  React.useEffect(() => {
    if (!chatOpen) return;
    function reposition() {
      const el = chatModalRef.current;
      if (!el) return;
      if (window.innerWidth >= 768) {
        el.style.bottom = "auto";
        el.style.top = "50%";
        el.style.transform = "translate(-50%, -50%)";
        el.style.borderRadius = "1rem";
      } else {
        el.style.bottom = "0";
        el.style.top = "auto";
        el.style.transform = "translateX(-50%)";
        el.style.borderRadius = "1rem 1rem 0 0";
      }
    }
    reposition();
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [chatOpen]);

  const accent = meta.accent;
  const glow = meta.glow;
  const image = meta.imagePath;
  const name = meta.displayName;

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setChatLoading(true);
    try {
      const history = newMessages.slice(1).map((m) => ({
        role: m.role === "agent" ? "assistant" : "user",
        content: m.text,
      }));
      const res = await fetch(chatRoute, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: text,
          agentId,
          context: pageContext,
          history: history.slice(0, -1),
          systemPrompt,
        }),
      });
      if (res.ok) {
        const j = await res.json().catch(() => null);
        setMessages((prev) => [...prev, { role: "agent", text: j?.reply ?? "Got it." }]);
      } else {
        setMessages((prev) => [...prev, { role: "agent", text: "Hit a snag — try again in a second." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "agent", text: "Can't reach the server right now." }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <>
      {/* ── Agent inline bar ── */}
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="flex items-center gap-3 rounded-2xl px-4 py-2 transition-all hover:bg-white/5 group w-full"
        style={{
          background: `linear-gradient(135deg, ${accent}10 0%, transparent 60%)`,
          border: `1px solid ${accent}35`,
          boxShadow: `0 0 24px ${accent}18`,
        }}
        aria-label={`Open ${name} chat`}
      >
        {/* Photo + pulse ring */}
        <div className="relative shrink-0">
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: accent, animationDuration: "3s" }}
          />
          <div
            className="relative h-14 w-14 overflow-hidden rounded-full"
            style={{
              boxShadow: `0 0 22px ${glow}`,
              border: `2.5px solid ${accent}80`,
            }}
          >
            <AgentAvatarImage src={image} name={name} accent={accent} className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Name + status */}
        <div className="text-left min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-tight" style={{ color: accent }}>
              {name}
            </span>
            <span
              className="rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
              style={{ borderColor: `${accent}40`, color: accent, backgroundColor: `${accent}10` }}
            >
              AI
            </span>
          </div>
          <p className="text-[11px] leading-snug truncate max-w-[260px] mt-0.5 text-[#94a3b8]">
            {idleLine}
          </p>
          <p className="text-[9px] mt-0.5 opacity-50" style={{ color: accent }}>Tap to chat</p>
        </div>
      </button>

      {/* ── Chat Modal — always on top ── */}
      {chatOpen && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            onClick={() => setChatOpen(false)}
            aria-hidden
          />
          <div
            className="fixed z-[201] flex w-full max-w-lg flex-col rounded-2xl border shadow-2xl"
            style={{
              borderColor: `${accent}55`,
              backgroundColor: "#0a0a0e",
              /* Mobile: anchor to bottom so keyboard pushes it up naturally */
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              /* On larger screens: center vertically */
              height: "min(600px, 85dvh)",
              /* Prevent iOS bounce from shrinking the panel */
              maxHeight: "100dvh",
            }}
            // On md+ screens, switch to centered modal
            ref={chatModalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${name} chat`}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[var(--z-border)] px-5 py-4">
              <div
                className="h-10 w-10 shrink-0 overflow-hidden rounded-full"
                style={{ border: `1.5px solid ${accent}60`, boxShadow: `0 0 16px ${glow}` }}
              >
                <AgentAvatarImage src={image} name={name} accent={accent} className="h-full w-full" />
              </div>
              <div>
                <div className="text-sm font-black text-[var(--z-fg)]">{name}</div>
                <div className="text-[10px] text-[var(--z-muted)]">{meta.tagline}</div>
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
                  {msg.role === "agent" && (
                    <div
                      className="h-7 w-7 shrink-0 overflow-hidden rounded-full"
                      style={{ border: `1px solid ${accent}60`, boxShadow: `0 0 8px ${glow}` }}
                    >
                      <AgentAvatarImage src={image} name={name} accent={accent} className="h-full w-full" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "rounded-tr-sm bg-[var(--z-surface-2)] text-[var(--z-fg)]"
                        : "rounded-tl-sm text-[var(--z-fg)]"
                    }`}
                    style={
                      msg.role === "agent"
                        ? { backgroundColor: `${accent}12`, border: `1px solid ${accent}25` }
                        : {}
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2">
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full" style={{ border: `1px solid ${accent}60` }}>
                    <AgentAvatarImage src={image} name={name} accent={accent} className="h-full w-full" />
                  </div>
                  <div
                    className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm"
                    style={{ backgroundColor: `${accent}12`, border: `1px solid ${accent}25` }}
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
                  inputMode="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={chatPlaceholder ?? `Ask ${name} anything…`}
                  className="flex-1 rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3.5 py-2.5 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none transition-colors"
                  style={{ fontSize: "16px" }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border disabled:opacity-40 transition-colors"
                  style={{ borderColor: `${accent}40`, backgroundColor: `${accent}15`, color: accent }}
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
