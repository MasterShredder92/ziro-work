"use client";

import * as React from "react";
import { AGENT_DEFINITIONS } from "@/lib/agents/agentDefinitions";
import { cn } from "@/components/ui/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function RubySidebar({ isOpen, onClose }: Props) {
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hello, I am Ruby. I'm synchronized with your schedule view. How can I help you?" }
  ]);
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  
  const rubyDef = AGENT_DEFINITIONS.ruby;

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userText, 
          agentId: "ruby",
          history: newMessages.slice(0, -1) // Send history excluding the latest message
        }),
      });
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantContent = data.content?.[0]?.text || "I encountered an error processing your request.";
      setMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (err: any) {
      console.error("Ruby Chat Error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message || "Connection failed."}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px] transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed right-0 top-0 h-full w-[450px] bg-[#0f0f12] border-l border-[var(--z-border)] shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-[100] flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Ruby Production Profile Header */}
        <div 
          className="p-6 border-b border-[var(--z-border)] relative overflow-hidden"
          style={{
            background: `linear-gradient(160deg, #16161a 0%, #0f0f12 100%)`,
          }}
        >
          {/* Accent Glow */}
          <div 
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-[0.15] blur-3xl"
            style={{ background: rubyDef.accent }}
          />

          <div className="relative flex items-start justify-between">
            <div className="flex gap-5">
              {/* Production Orb */}
              <div 
                className="relative h-20 w-20 rounded-full border-2 overflow-hidden bg-[var(--z-surface-2)]"
                style={{ 
                  borderColor: `${rubyDef.accent}44`,
                  boxShadow: `0 0 30px ${rubyDef.glow}`
                }}
              >
                <img 
                  src="/static/agents/ruby.png" 
                  alt="Ruby" 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Ruby&background=fb923c&color=fff";
                  }}
                />
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-[#00ff88] border-2 border-[#0f0f12]" />
              </div>

              <div className="pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{ color: rubyDef.accent }}
                  >
                    {rubyDef.role}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest">Online</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-2">RUBY</h2>
                <p className="text-xs text-[var(--z-muted)] leading-tight max-w-[200px]">
                  {rubyDef.tagline}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-[var(--z-muted)] hover:text-white hover:bg-white/5 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[var(--z-border)] bg-[#0f0f12]"
        >
          {messages.map((m, i) => (
            <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
              <div 
                className={cn(
                  "max-w-[90%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed",
                  m.role === "user" 
                    ? "bg-[#fb923c] text-black font-bold shadow-[0_4px_12px_rgba(251,146,60,0.2)]" 
                    : "bg-[var(--z-surface-2)] text-[var(--z-fg)] border border-[var(--z-border)]"
                )}
              >
                {m.content}
              </div>
              <span className="text-[9px] font-black text-[var(--z-muted)] uppercase tracking-widest mt-1.5 px-1">
                {m.role === "user" ? "You" : "Ruby"}
              </span>
            </div>
          ))}
          {loading && (
            <div className="flex flex-col items-start">
              <div className="bg-[var(--z-surface-2)] border border-[var(--z-border)] rounded-2xl px-5 py-4">
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#fb923c] animate-bounce" />
                  <div className="h-2 w-2 rounded-full bg-[#fb923c] animate-bounce [animation-delay:0.2s]" />
                  <div className="h-2 w-2 rounded-full bg-[#fb923c] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Command Input */}
        <div className="p-6 border-t border-[var(--z-border)] bg-[#16161a]">
          <form onSubmit={handleSubmit} className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Execute command..."
              className="w-full bg-[#0f0f12] border border-[var(--z-border)] rounded-2xl pl-5 pr-20 py-4 text-sm text-white placeholder:text-[var(--z-muted)] focus:outline-none focus:border-[#fb923c] focus:ring-1 focus:ring-[#fb923c]/30 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-[#fb923c] text-black font-black text-xs uppercase tracking-widest hover:bg-[#ea580c] disabled:opacity-30 disabled:grayscale transition-all"
            >
              SEND
            </button>
          </form>
          <div className="mt-4 flex items-center justify-between px-1">
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#fb923c]" />
                <span className="text-[9px] font-black text-[var(--z-muted)] uppercase tracking-tighter">Sync Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#00ff88]" />
                <span className="text-[9px] font-black text-[var(--z-muted)] uppercase tracking-tighter">Tools Ready</span>
              </div>
            </div>
            <span className="text-[9px] font-black text-[var(--z-muted)] uppercase tracking-widest opacity-50">ZiroWork OS v1.0</span>
          </div>
        </div>
      </div>
    </>
  );
}
