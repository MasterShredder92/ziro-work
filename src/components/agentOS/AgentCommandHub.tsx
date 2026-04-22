"use client";

import * as React from "react";
import { AGENT_DEFINITIONS } from "@/lib/ziro/agents/definitions";
import { getAgentMetadata } from "@/lib/agents/agentMetadata";
import { cn } from "@/components/ui/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
};

export function AgentCommandHub({ isOpen, onClose, agentId }: Props) {
  const [input, setInput] = React.useState("");
  const agentDef = AGENT_DEFINITIONS[agentId] || AGENT_DEFINITIONS.ziro;
  const agentMeta = getAgentMetadata(agentId);
  
  const [messages, setMessages] = React.useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { 
      role: "assistant", 
      content: `Hello, I am ${agentDef.name}. I'm synchronized with your ${agentDef.role.toLowerCase()} view. How can I help you?` 
    }
  ]);
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset messages when agent changes
  React.useEffect(() => {
    setMessages([
      { 
        role: "assistant", 
        content: `Hello, I am ${agentDef.name}. I'm synchronized with your ${agentDef.role.toLowerCase()} view. How can I help you?` 
      }
    ]);
  }, [agentId, agentDef.name, agentDef.role]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    
    // Explicitly mapping to 'content' to perfectly match AI SDK expectations
    const newMessages = [...messages, { role: "user" as const, content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userText, 
          agentId: agentId,
          history: messages // Send previous history exactly as { role, content }
        }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Unified parsing logic perfectly mapped to our custom route.ts JSON payload
      const assistantContent = data.reply || data.content?.[0]?.text || "Execution complete.";
      setMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message || "Connection failed."}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative w-full max-w-[500px] h-[600px] max-h-[90vh] bg-[#0f0f12] border border-[var(--z-border)] rounded-[32px] shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 fade-in duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        )}
      >
        <div 
          className="p-6 border-b border-[var(--z-border)] relative overflow-hidden shrink-0"
          style={{ background: `linear-gradient(160deg, #16161a 0%, #0f0f12 100%)` }}
        >
          <div 
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-[0.2] blur-3xl"
            style={{ background: agentDef.accent }}
          />

          <div className="relative flex items-start justify-between">
            <div className="flex gap-4">
              <div 
                className="relative h-16 w-16 rounded-full border-2 overflow-hidden bg-[var(--z-surface-2)] shrink-0"
                style={{ 
                  borderColor: `${agentDef.accent}44`,
                  boxShadow: `0 0 30px ${agentDef.glow}`
                }}
              >
                <img 
                  src={agentMeta?.imagePath || `/static/agents/${agentId}.png`} 
                  alt={agentDef.name} 
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${agentDef.name}&background=${agentDef.accent.replace('#', '')}&color=fff`; }}
                />
                <div className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-[#00ff88] border-2 border-[#0f0f12]" />
              </div>

              <div className="pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: agentDef.accent }}>{agentDef.role}</span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="text-[9px] font-bold text-[#00ff88] uppercase tracking-widest">Active</span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight leading-none mb-1.5">{agentDef.name.toUpperCase()}</h2>
                <p className="text-[10px] text-[var(--z-muted)] leading-tight font-medium uppercase tracking-widest">{agentDef.tagline}</p>
              </div>
            </div>

            <button onClick={onClose} className="h-10 w-10 rounded-2xl flex items-center justify-center text-[var(--z-muted)] hover:text-white hover:bg-white/5 transition-all active:scale-90">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none bg-[#0f0f12]">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
              <div className={cn("max-w-[85%] rounded-[24px] px-5 py-3.5 text-sm leading-relaxed", m.role === "user" ? "bg-[var(--z-accent)] text-black font-bold shadow-[0_8px_24px_rgba(var(--z-accent-rgb),0.25)] rounded-tr-none" : "bg-[var(--z-surface-2)] text-[var(--z-fg)] border border-[var(--z-border)] rounded-tl-none")}>
                {m.content}
              </div>
              <span className="text-[9px] font-black text-[var(--z-muted)] uppercase tracking-[0.15em] mt-2 px-1">{m.role === "user" ? "Owner" : `${agentDef.name} Operator`}</span>
            </div>
          ))}
          {loading && (
            <div className="flex flex-col items-start">
              <div className="bg-[var(--z-surface-2)] border border-[var(--z-border)] rounded-[24px] rounded-tl-none px-5 py-4">
                <div className="flex gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--z-accent)] animate-bounce" style={{ backgroundColor: agentDef.accent }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--z-accent)] animate-bounce [animation-delay:0.2s]" style={{ backgroundColor: agentDef.accent }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--z-accent)] animate-bounce [animation-delay:0.4s]" style={{ backgroundColor: agentDef.accent }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[var(--z-border)] bg-[#16161a] shrink-0">
          <form onSubmit={handleSubmit} className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Command ${agentDef.name} Operator...`}
              className="w-full bg-[#0f0f12] border border-[var(--z-border)] rounded-[20px] pl-5 pr-20 py-4 text-sm text-white placeholder:text-[var(--z-muted)] focus:outline-none focus:border-[var(--z-accent)] focus:ring-1 focus:ring-[var(--z-accent)]/30 transition-all shadow-inner"
              style={{ "--z-accent": agentDef.accent } as React.CSSProperties}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || loading} 
              className="absolute right-2 top-2 bottom-2 px-4 rounded-[14px] text-black font-black text-[10px] uppercase tracking-widest disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
              style={{ backgroundColor: agentDef.accent }}
            >
              EXECUTE
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}