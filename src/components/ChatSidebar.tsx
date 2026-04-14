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
  const abortRef = useRef<AbortController | null>(null);

  // Load conversation history when agent changes
  useEffect(() => {
    if (!agent) return;
    setTab("chat");
    // Abort any in-flight request when switching agents
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setSending(false);
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
    console.log("[ChatSidebar] handleSend called", { input: input.trim(), agent: agent?.slug, sending });
    if (!input.trim() || !agent || sending) return;

    // Abort any previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content: userMessage, created_at: new Date().toISOString() },
    ]);

    const assistantId = `resp-${Date.now()}`;
    let started = false;

    try {
      console.log("[ChatSidebar] Firing fetch to /api/chat", { agentId: agent.id, message: userMessage });
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, message: userMessage }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Stream failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines from the buffer
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const payload = JSON.parse(trimmed.slice(6));

            if (payload.type === "text") {
              if (!started) {
                started = true;
                setMessages((prev) => [
                  ...prev,
                  {
                    id: assistantId,
                    role: "assistant",
                    content: payload.text,
                    created_at: new Date().toISOString(),
                  },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + payload.text }
                      : m
                  )
                );
              }
            } else if (payload.type === "error" && payload.text) {
              // Surface API/server errors to the user instead of silently swallowing
              started = true;
              setMessages((prev) => [
                ...prev,
                {
                  id: assistantId,
                  role: "assistant",
                  content: `⚠ ${payload.text}`,
                  created_at: new Date().toISOString(),
                },
              ]);
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      // If no text was ever streamed, show fallback
      if (!started) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: "No response generated.",
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
      // Clear the abort ref if this is still the active request
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setSending(false);
    }
  }

  return (
    <div
      className={clsx(
        "chat-sidebar fixed right-0 top-0 h-full w-[420px] bg-[#0a0a0c] border-l border-[#1c1c1e] z-50 flex flex-col",
        agent ? "open" : "closed"
      )}
    >
      {agent && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1c1c1e]">
            <div className="flex items-center gap-3">
              <div
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: agent.color }}
              />
              <div>
                <div className="text-[15px] font-bold" style={{ color: agent.color }}>
                  {agent.name}
                </div>
                <div className="text-xs text-[#707078]">{agent.role}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-[#707078] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#1c1c1e]">
            <button
              onClick={() => setTab("chat")}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors",
                tab === "chat"
                  ? "text-[#00ff88] border-b-2 border-[#00ff88]"
                  : "text-[#707078] hover:text-white"
              )}
            >
              <MessageSquare size={13} />
              Chat
            </button>
            <button
              onClick={() => setTab("tasks")}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors",
                tab === "tasks"
                  ? "text-[#00ff88] border-b-2 border-[#00ff88]"
                  : "text-[#707078] hover:text-white"
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
                    <Loader2 size={18} className="animate-spin text-[#505055]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-[#606068] text-[15px]">No messages yet</div>
                    <div className="text-[#505055] text-sm mt-1">
                      Start a conversation with {agent.name}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={clsx(
                        "max-w-[85%] rounded-xl px-3 py-2 text-[15px] leading-relaxed",
                        msg.role === "user"
                          ? "ml-auto bg-[#00ff88]/10 text-[#d0d0d8] border border-[#00ff88]/20"
                          : "bg-[#161618] text-[#c0c0c8] border border-[#1c1c1e]"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    </div>
                  ))
                )}
                {sending && (
                  <div className="flex items-center gap-2 text-[#606068] text-sm">
                    <Loader2 size={12} className="animate-spin" />
                    {agent.name} is thinking...
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[#1c1c1e]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={`Message ${agent.name}...`}
                    disabled={sending}
                    className="flex-1 bg-[#101012] border border-[#232326] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#606068] outline-none focus:border-[#00ff88]/50 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="px-4 py-2.5 bg-[#00ff88] text-black rounded-lg font-medium text-sm hover:bg-[#33ffaa] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
