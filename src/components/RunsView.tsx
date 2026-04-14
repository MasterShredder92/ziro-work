"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Play,
  CheckCircle,
  AlertTriangle,
  Circle,
  Clock,
  X,
} from "lucide-react";

interface TaskRun {
  id: string;
  runtime: string;
  status: string;
  result_snapshot: string | null;
  duration_ms: number | null;
  attempt_number: number;
  worker_id: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  estimated_cost: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  agent_tasks: { title: string; description: string | null; task_type: string | null } | null;
  agent_templates: { name: string } | null;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  );
}

function formatDuration(ms: number | null): string {
  if (!ms) return "\u2014";
  if (ms < 1000) return `${ms}ms`;
  return `${Math.round(ms / 1000)}s`;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "complete":
      return <CheckCircle size={14} className="text-[#00ff88] shrink-0" />;
    case "running":
      return <Loader2 size={14} className="animate-spin text-[#f59e0b] shrink-0" />;
    case "failed":
    case "failed_permanent":
      return <AlertTriangle size={14} className="text-[#ff4444] shrink-0" />;
    default:
      return <Circle size={14} className="text-[#505055] shrink-0" />;
  }
}

const STATUS_COLORS: Record<string, string> = {
  complete: "#00ff88",
  running: "#f59e0b",
  failed: "#ff4444",
  failed_permanent: "#ff4444",
  pending: "#909098",
};

const RUNTIME_COLORS: Record<string, string> = {
  claude_code: "#00ff88",
  api: "#3b82f6",
  browser: "#f59e0b",
  manual: "#a855f7",
};

export default function RunsView() {
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TaskRun | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("task_runs")
      .select("*, agent_tasks(title, description, task_type), agent_templates(name)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setRuns((data as TaskRun[]) || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-[#505055]" />
      </div>
    );
  }

  const filtered = filterStatus === "all"
    ? runs
    : runs.filter((r) => r.status === filterStatus);

  return (
    <>
      <div className="h-full overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-[#f0f0f0]">Task Runs</h2>
            <p className="text-sm text-[#606068] mt-1">
              Execution history for all routed tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {["all", "complete", "running", "failed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                    filterStatus === s
                      ? "bg-white/10 text-[#f0f0f0]"
                      : "text-[#606068] hover:text-[#a0a0a8]"
                  }`}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
            <span className="text-sm text-[#606068]">{filtered.length} runs</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            <Play size={32} className="mx-auto text-[#3a3a3e] mb-3" />
            <p className="text-[#707078] text-[15px]">No task runs yet</p>
            <p className="text-[#505055] text-sm mt-1">
              Runs appear here when STAR routes tasks through the orchestrator.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((run) => {
              const statusColor = STATUS_COLORS[run.status] || "#888";
              const runtimeColor = RUNTIME_COLORS[run.runtime] || "#888";
              return (
                <div
                  key={run.id}
                  onClick={() => setSelected(run)}
                  className="flex items-center gap-3 p-4 bg-[#101012] border border-[#1c1c1e] rounded-xl cursor-pointer hover:bg-[#161618] hover:border-[#2a2a2e] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                >
                  <StatusIcon status={run.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#ccc] truncate">
                      {run.agent_tasks?.title || "Untitled run"}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {run.agent_templates?.name && (
                        <span className="text-xs text-[#606068]">
                          {run.agent_templates.name}
                        </span>
                      )}
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          color: runtimeColor,
                          backgroundColor: `${runtimeColor}15`,
                        }}
                      >
                        {run.runtime}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          color: statusColor,
                          backgroundColor: `${statusColor}15`,
                        }}
                      >
                        {run.status}
                      </span>
                      {run.attempt_number > 1 && (
                        <span className="text-xs text-[#f59e0b]">
                          attempt {run.attempt_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-[#505055]">
                      {formatTimestamp(run.created_at)}
                    </div>
                    {run.duration_ms && (
                      <div className="flex items-center gap-1 text-xs text-[#606068] mt-0.5 justify-end">
                        <Clock size={9} />
                        {formatDuration(run.duration_ms)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-[90%] max-w-[660px] max-h-[80vh] bg-[#0c0c0e] border border-[#1c1c1e] rounded-xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <h3 className="text-[15px] font-bold text-[#f0f0f0]">
                  {selected.agent_tasks?.title || "Untitled"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded font-semibold"
                    style={{
                      color: STATUS_COLORS[selected.status] || "#888",
                      backgroundColor: `${STATUS_COLORS[selected.status] || "#888"}15`,
                    }}
                  >
                    {selected.status}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      color: RUNTIME_COLORS[selected.runtime] || "#909098",
                      backgroundColor: `${RUNTIME_COLORS[selected.runtime] || "#909098"}15`,
                    }}
                  >
                    {selected.runtime}
                  </span>
                  {selected.agent_templates?.name && (
                    <span className="text-xs text-[#606068]">
                      via {selected.agent_templates.name}
                    </span>
                  )}
                  {selected.attempt_number > 1 && (
                    <span className="text-xs text-[#f59e0b]">
                      attempt {selected.attempt_number}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1 rounded-lg hover:bg-white/5 text-[#707078] hover:text-[#f0f0f0] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
              <div className="flex gap-4 text-xs text-[#606068] flex-wrap">
                <span>Created: {formatTimestamp(selected.created_at)}</span>
                {selected.completed_at && (
                  <span>Completed: {formatTimestamp(selected.completed_at)}</span>
                )}
                {selected.duration_ms && (
                  <span>Duration: {formatDuration(selected.duration_ms)}</span>
                )}
                {selected.tokens_in && (
                  <span>Tokens in: {selected.tokens_in.toLocaleString()}</span>
                )}
                {selected.tokens_out && (
                  <span>Tokens out: {selected.tokens_out.toLocaleString()}</span>
                )}
                {selected.estimated_cost && (
                  <span>Cost: ${selected.estimated_cost.toFixed(4)}</span>
                )}
                {selected.worker_id && (
                  <span>Worker: {selected.worker_id}</span>
                )}
              </div>

              {selected.error_message && (
                <div>
                  <div className="text-xs font-semibold text-[#ff4444] uppercase tracking-wider mb-1">
                    Error
                  </div>
                  <div className="text-sm text-[#ff4444]/80 whitespace-pre-wrap break-words bg-[#ff4444]/5 border border-[#ff4444]/20 rounded-lg p-3 max-h-[150px] overflow-y-auto">
                    {selected.error_message}
                  </div>
                </div>
              )}

              {selected.result_snapshot && (
                <div>
                  <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">
                    Result
                  </div>
                  <div className="text-sm text-[#a0a0a8] whitespace-pre-wrap break-words bg-[#0a0a0c] border border-[#1c1c1e] rounded-lg p-3 max-h-[300px] overflow-y-auto">
                    {selected.result_snapshot}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
