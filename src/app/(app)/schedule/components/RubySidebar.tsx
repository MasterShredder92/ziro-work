import * as React from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function RubySidebar({ isOpen, onClose }: Props) {
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Array<{ role: "user" | "ruby"; text: string }>>([
    { role: "ruby", text: "Hello, I am Ruby. I'm synchronized with your schedule view. How can I help you?" }
  ]);
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

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
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, agentId: "ruby" }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "ruby", text: data.response || "I encountered an error processing your request." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ruby", text: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-[400px] bg-[#0f0f12] border-l border-[var(--z-border)] shadow-2xl transform transition-transform duration-300 ease-in-out z-[100] flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      }`}
    >
      {/* Ruby Profile Header */}
      <div className="p-6 border-b border-[var(--z-border)] bg-[var(--z-surface-2)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#fb923c] to-[#ea580c] flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(251,146,60,0.45)]">
                🗓️
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#00ff88] border-2 border-[#0f0f12]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">RUBY</h2>
              <p className="text-[10px] font-bold text-[#fb923c] uppercase tracking-widest">Master of the Schedule</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--z-muted)] hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="text-xs text-[var(--z-muted)] leading-relaxed italic bg-[#0f0f12]/50 p-3 rounded-xl border border-[var(--z-border)]">
          "Precise, organized, and calm. I am the master of time. I see what you see."
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-[var(--z-border)]"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user" 
                  ? "bg-[var(--z-accent)] text-black font-semibold rounded-tr-none" 
                  : "bg-[var(--z-surface-2)] text-[var(--z-fg)] border border-[var(--z-border)] rounded-tl-none"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--z-surface-2)] border border-[var(--z-border)] rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-[#fb923c] animate-bounce" />
                <div className="h-1.5 w-1.5 rounded-full bg-[#fb923c] animate-bounce [animation-delay:0.2s]" />
                <div className="h-1.5 w-1.5 rounded-full bg-[#fb923c] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-6 border-t border-[var(--z-border)] bg-[var(--z-surface-2)]">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command Ruby..."
            className="flex-1 bg-[#0f0f12] border border-[var(--z-border)] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#fb923c] transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-11 px-4 rounded-xl bg-[#fb923c] text-black font-bold text-sm hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(251,146,60,0.3)]"
          >
            SEND
          </button>
        </div>
        <p className="mt-3 text-[10px] text-center text-[var(--z-muted)] font-bold uppercase tracking-widest">
          Ruby is tracking your viewport in real-time
        </p>
      </form>
    </div>
  );
}
