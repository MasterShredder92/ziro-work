"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Send, MessageSquare, ListTodo, Loader2 } from "lucide-react";
import clsx from "clsx";
import TaskLog from "./TaskLog";

interface Agent {
  id: string;
  slug: string;
  name: string;
  role: string;
  color: string;
  status: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ChatSidebarProps {
  agent: Agent | null;
  onClose: () => void;
}

export default function ChatSidebar({ agent, onClose }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"chat" | "tasks">("chat");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversation history when agent changes
  useEffect(() => {
    if (!agent) return;
    setTab("chat");
    setLoadingHistory(true);
    supabase
      .from("agent_conversations")
      .select("*")
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        setMessages(data || []);
        setLoadingHistory(false);
      });
  }, [agent]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !agent || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content: userMessage, created_at: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, message: userMessage }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `resp-${Date.now()}`,
            role: "assistant",
            content: data.reply,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Failed to get a response. Try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={clsx(
        "chat-sidebar fixed right-0 top-0 h-full w-[400px] bg-[#0a0a0a] border-l border-[#1a1a1a] z-50 flex flex-col",
        agent ? "open" : "closed"
      )}
    >
      {agent && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: agent.color }}
              />
              <div>
                <div className="text-sm font-bold" style={{ color: agent.color }}>
                  {agent.name}
                </div>
                <div className="text-[11px] text-[#666]">{agent.role}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[#666] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#1a1a1a]">
            <button
              onClick={() => setTab("chat")}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
                tab === "chat"
                  ? "text-[#00ff88] border-b-2 border-[#00ff88]"
                  : "text-[#666] hover:text-white"
              )}
            >
              <MessageSquare size={13} />
              Chat
            </button>
            <button
              onClick={() => setTab("tasks")}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
                tab === "tasks"
                  ? "text-[#00ff88] border-b-2 border-[#00ff88]"
                  : "text-[#666] hover:text-white"
              )}
            >
              <ListTodo size={13} />
              Tasks
            </button>
          </div>

          {/* Content */}
          {tab === "tasks" ? (
            <div className="flex-1 overflow-y-auto">
              <TaskLog agentId={agent.id} />
            </div>
          ) : (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={18} className="animate-spin text-[#444]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-[#555] text-sm">No messages yet</div>
                    <div className="text-[#444] text-xs mt-1">
                      Start a conversation with {agent.name}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={clsx(
                        "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "ml-auto bg-[#00ff88]/10 text-[#ccc] border border-[#00ff88]/20"
                          : "bg-[#151515] text-[#bbb] border border-[#1a1a1a]"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    </div>
                  ))
                )}
                {sending && (
                  <div className="flex items-center gap-2 text-[#555] text-xs">
                    <Loader2 size={12} className="animate-spin" />
                    {agent.name} is thinking...
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-[#1a1a1a]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={`Message ${agent.name}...`}
                    disabled={sending}
                    className="flex-1 bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555] outline-none focus:border-[#00ff88]/50 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="px-3 py-2 bg-[#00ff88] text-black rounded-lg font-medium text-sm hover:bg-[#33ffaa] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
