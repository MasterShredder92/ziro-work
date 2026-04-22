"use client";
import React, { useEffect, useState } from "react";

type StudentMessage = {
  id: string;
  student_id: string | null;
  family_id: string | null;
  category: string;
  content: string;
  is_anonymous: boolean;
  admin_reviewed: boolean;
  forwarded_to_teacher: boolean;
  created_at: string;
};

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Issue: { bg: "#ef444420", color: "#ef4444" },
  Note: { bg: "#3b82f620", color: "#3b82f6" },
  Billing: { bg: "#f59e0b20", color: "#f59e0b" },
  General: { bg: "#60606020", color: "#909098" },
};

export function StudentMessagesInbox() {
  const [messages, setMessages] = useState<StudentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unreviewed">("unreviewed");

  async function load() {
    setLoading(true);
    try {
      const url = filter === "unreviewed"
        ? "/api/student-messages?unreviewed=true"
        : "/api/student-messages";
      const res = await fetch(url);
      const j = await res.json();
      setMessages(j.data ?? []);
    } catch { /* noop */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function markReviewed(id: string) {
    await fetch(`/api/student-messages/${id}/review`, { method: "PATCH" });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, admin_reviewed: true } : m));
  }

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Feedback
          </div>
          <h2 className="text-lg font-semibold text-[var(--z-fg)]">
            Student Messages
          </h2>
          <div className="text-xs text-[var(--z-muted)]">
            All messages route here first — never directly to teachers.
          </div>
        </div>
        <div className="flex gap-2">
          {(["unreviewed", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors"
              style={{
                background: filter === f ? "var(--z-accent)/15" : "var(--z-surface)",
                color: filter === f ? "var(--z-accent)" : "var(--z-muted)",
                border: `1px solid ${filter === f ? "var(--z-accent)/40" : "var(--z-border)"}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="py-8 text-center text-sm text-[var(--z-muted)]">Loading…</div>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] py-10 text-center">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-sm font-medium text-[var(--z-fg)]">All clear</div>
          <div className="text-xs text-[var(--z-muted)] mt-1">No unreviewed messages</div>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => {
            const cat = CATEGORY_COLORS[msg.category] ?? CATEGORY_COLORS.General;
            return (
              <div
                key={msg.id}
                className="rounded-xl border bg-[var(--z-surface)] px-4 py-3 flex items-start gap-4"
                style={{
                  borderColor: msg.admin_reviewed ? "var(--z-border)" : "var(--z-accent)/30",
                  opacity: msg.admin_reviewed ? 0.6 : 1,
                }}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: cat.bg, color: cat.color }}
                    >
                      {msg.category}
                    </span>
                    {msg.is_anonymous && (
                      <span className="text-[10px] text-[var(--z-muted)]">Anonymous</span>
                    )}
                    <span className="text-[10px] text-[var(--z-muted)] ml-auto">
                      {new Date(msg.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--z-fg)]">{msg.content}</div>
                </div>
                {!msg.admin_reviewed && (
                  <button
                    onClick={() => markReviewed(msg.id)}
                    className="shrink-0 text-xs font-semibold text-[var(--z-accent)] hover:opacity-70 transition-opacity"
                  >
                    Mark reviewed
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
