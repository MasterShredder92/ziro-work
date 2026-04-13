"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Circle, Loader2, X, AlertTriangle, Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  result: string | null;
  created_at: string;
  completed_at: string | null;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    complete: { bg: "bg-[#00ff88]/10", text: "text-[#00ff88]", label: "Complete" },
    completed: { bg: "bg-[#00ff88]/10", text: "text-[#00ff88]", label: "Complete" },
    failed: { bg: "bg-[#ff4444]/10", text: "text-[#ff4444]", label: "Failed" },
    failed_permanent: { bg: "bg-[#ff4444]/10", text: "text-[#ff4444]", label: "Failed" },
    running: { bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]", label: "Running" },
    in_progress: { bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]", label: "Running" },
    pending: { bg: "bg-[#555]/10", text: "text-[#888]", label: "Pending" },
  };
  const c = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "complete":
    case "completed":
      return <CheckCircle size={14} className="text-[#00ff88] mt-0.5 shrink-0" />;
    case "running":
    case "in_progress":
      return <Loader2 size={14} className="animate-spin text-[#f59e0b] mt-0.5 shrink-0" />;
    case "failed":
    case "failed_permanent":
      return <AlertTriangle size={14} className="text-[#ff4444] mt-0.5 shrink-0" />;
    default:
      return <Circle size={14} className="text-[#444] mt-0.5 shrink-0" />;
  }
}

function TaskModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const isFailed = task.status === "failed" || task.status === "failed_permanent";
  const isComplete = task.status === "complete" || task.status === "completed";
  const showResult = (isComplete || isFailed) && task.result;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[90%] max-w-[520px] max-h-[80vh] bg-[#0c0c0c] border border-[#1a1a1a] rounded-xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white leading-snug break-words">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusBadge status={task.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-[#666] hover:text-white transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Timestamps */}
        <div className="flex gap-4 px-5 pb-3 text-[10px] text-[#555]">
          <div className="flex items-center gap-1">
            <Clock size={10} />
            Created {formatTimestamp(task.created_at)}
          </div>
          {task.completed_at && (
            <div className="flex items-center gap-1">
              <CheckCircle size={10} />
              Completed {formatTimestamp(task.completed_at)}
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
          {/* Description */}
          {task.description && (
            <div>
              <div className="text-[10px] font-semibold text-[#555] uppercase tracking-wider mb-1">
                Description
              </div>
              <div className="text-xs text-[#999] whitespace-pre-wrap break-words bg-[#080808] border border-[#1a1a1a] rounded-lg p-3 max-h-[200px] overflow-y-auto">
                {task.description}
              </div>
            </div>
          )}

          {/* Result */}
          {showResult && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: isFailed ? "#ff4444" : "#555" }}
              >
                {isFailed ? "Error" : "Result"}
              </div>
              <div
                className="text-xs whitespace-pre-wrap break-words border rounded-lg p-3 max-h-[200px] overflow-y-auto"
                style={{
                  color: isFailed ? "#ff8888" : "#999",
                  backgroundColor: isFailed ? "rgba(255,68,68,0.05)" : "#080808",
                  borderColor: isFailed ? "rgba(255,68,68,0.15)" : "#1a1a1a",
                }}
              >
                {task.result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskLog({ agentId }: { agentId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Task | null>(null);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("agent_tasks")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setTasks(data || []);
        setLoading(false);
      });
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={18} className="animate-spin text-[#444]" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-[#555] text-sm">
        No tasks yet
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 p-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => setSelected(task)}
            className="flex items-start gap-2 p-2 rounded-lg bg-[#111] border border-[#1a1a1a] cursor-pointer hover:bg-[#151515] hover:border-[#252525] transition-colors"
          >
            <StatusIcon status={task.status} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[#ccc] truncate">
                {task.title}
              </div>
              {task.description && (
                <div className="text-[10px] text-[#666] mt-0.5 line-clamp-2">
                  {task.description}
                </div>
              )}
            </div>
            <div className="text-[10px] text-[#444] shrink-0 mt-0.5 whitespace-nowrap">
              {formatTimestamp(task.completed_at || task.created_at)}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <TaskModal task={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
