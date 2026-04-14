"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  X,
  Zap,
  Bug,
  FileOutput,
} from "lucide-react";

interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  status: string;
  result: string | null;
  review_summary: string | null;
  review_status: string | null;
  failure_stage: string | null;
  task_type: string | null;
  runtime: string | null;
  created_at: string;
  completed_at: string | null;
  started_at: string | null;
  agents: { name: string; slug: string; mode: string | null } | null;
  agent_templates: { name: string } | null;
}

interface ThreadMessage {
  id: string;
  sender_type: string;
  sender_name: string | null;
  message_type: string;
  content: string;
  created_at: string;
}

interface TaskArtifact {
  id: string;
  artifact_type: string;
  title: string;
  url_or_path: string | null;
  created_at: string;
}

interface TaskFailureRecord {
  id: string;
  failure_stage: string;
  error_message: string | null;
  recoverable: boolean;
  recovery_action: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  complete: "#00ff88",
  running: "#f59e0b",
  failed: "#ff4444",
  failed_permanent: "#ff4444",
  pending: "#909098",
  retry: "#f59e0b",
};

const VERDICT_COLORS: Record<string, string> = {
  approved: "#00ff88",
  retry: "#f59e0b",
  escalate: "#ff4444",
  needs_human: "#a855f7",
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  );
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
      return <Clock size={14} className="text-[#909098] shrink-0" />;
  }
}

export default function TaskBankView() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
  const [artifacts, setArtifacts] = useState<TaskArtifact[]>([]);
  const [failures, setFailures] = useState<TaskFailureRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("agent_tasks")
      .select("id, title, description, status, result, review_summary, review_status, failure_stage, task_type, runtime, created_at, completed_at, started_at, agents(name, slug, mode), agent_templates(name)")
      .in("status", ["complete", "failed", "failed_permanent"])
      .order("completed_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setTasks((data as unknown as TaskRecord[]) || []);
        setLoading(false);
      });
  }, []);

  async function toggleExpand(taskId: string) {
    if (expanded === taskId) {
      setExpanded(null);
      return;
    }

    setExpanded(taskId);
    setDetailLoading(true);

    // Load thread messages, artifacts, and failures in parallel
    const [threadRes, artifactRes, failureRes] = await Promise.all([
      supabase
        .from("task_threads")
        .select("id")
        .eq("task_id", taskId)
        .limit(1)
        .then(async ({ data: threads }) => {
          if (!threads || threads.length === 0) return [];
          const { data: msgs } = await supabase
            .from("task_messages")
            .select("id, sender_type, sender_name, message_type, content, created_at")
            .eq("thread_id", threads[0].id)
            .order("created_at", { ascending: true })
            .limit(50);
          return msgs || [];
        }),
      supabase
        .from("task_artifacts")
        .select("id, artifact_type, title, url_or_path, created_at")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true })
        .then(({ data }) => data || []),
      supabase
        .from("task_failures")
        .select("id, failure_stage, error_message, recoverable, recovery_action, created_at")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true })
        .then(({ data }) => data || []),
    ]);

    setThreadMessages(threadRes);
    setArtifacts(artifactRes);
    setFailures(failureRes);
    setDetailLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-[#505055]" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#f0f0f0]">Task Bank</h2>
          <p className="text-sm text-[#606068] mt-1">
            Task-centered history — one clean record per completed task
          </p>
        </div>
        <span className="text-sm text-[#606068]">{tasks.length} tasks</span>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <FileText size={32} className="mx-auto text-[#3a3a3e] mb-3" />
          <p className="text-[#707078] text-[15px]">No completed tasks yet</p>
          <p className="text-[#505055] text-sm mt-1">
            Tasks appear here after execution and review.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const isExpanded = expanded === task.id;
            const statusColor = STATUS_COLORS[task.status] || "#888";
            const verdictColor = task.review_status ? (VERDICT_COLORS[task.review_status] || "#888") : undefined;

            return (
              <div key={task.id} className="bg-[#101012] border border-[#1c1c1e] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                {/* Header — always visible */}
                <div
                  className="flex items-center gap-3 p-5 cursor-pointer hover:bg-[#161618] transition-colors"
                  onClick={() => toggleExpand(task.id)}
                >
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-[#606068] shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-[#606068] shrink-0" />
                  )}
                  <StatusIcon status={task.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#ccc] truncate">
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.agents?.name && (
                        <span className="text-xs text-[#606068]">
                          {task.agents.name}
                        </span>
                      )}
                      {task.agent_templates?.name && (
                        <span className="text-xs text-[#505055]">
                          via {task.agent_templates.name}
                        </span>
                      )}
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ color: statusColor, backgroundColor: `${statusColor}15` }}
                      >
                        {task.status}
                      </span>
                      {verdictColor && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ color: verdictColor, backgroundColor: `${verdictColor}15` }}
                        >
                          {task.review_status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-[#505055] shrink-0">
                    {task.completed_at ? formatTimestamp(task.completed_at) : formatTimestamp(task.created_at)}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[#1c1c1e] px-5 pb-5 pt-4 space-y-4">
                    {detailLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 size={16} className="animate-spin text-[#505055]" />
                      </div>
                    ) : (
                      <>
                        {/* Review Summary */}
                        {task.review_summary && (
                          <div>
                            <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">
                              Review Summary
                            </div>
                            <p className="text-sm text-[#a0a0a8]">{task.review_summary}</p>
                          </div>
                        )}

                        {/* Failures */}
                        {failures.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ff4444] uppercase tracking-wider mb-1">
                              <Bug size={10} />
                              Failures ({failures.length})
                            </div>
                            <div className="space-y-1">
                              {failures.map((f) => (
                                <div key={f.id} className="text-sm bg-[#ff4444]/5 border border-[#ff4444]/20 rounded-lg p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#ff4444] font-medium">{f.failure_stage}</span>
                                    {f.recoverable && (
                                      <span className="text-xs text-[#f59e0b]">recoverable</span>
                                    )}
                                  </div>
                                  {f.error_message && (
                                    <p className="text-[#ff4444]/70 mt-1 line-clamp-3">{f.error_message}</p>
                                  )}
                                  {f.recovery_action && (
                                    <p className="text-[#909098] mt-1">Recovery: {f.recovery_action}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Artifacts */}
                        {artifacts.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3b82f6] uppercase tracking-wider mb-1">
                              <FileOutput size={10} />
                              Artifacts ({artifacts.length})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {artifacts.map((a) => (
                                <div key={a.id} className="text-sm bg-[#3b82f6]/5 border border-[#3b82f6]/20 rounded-lg px-2.5 py-1.5">
                                  <span className="text-[#3b82f6]">{a.artifact_type}</span>
                                  <span className="text-[#909098] ml-1.5">{a.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Thread Messages */}
                        {threadMessages.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">
                              <Zap size={10} />
                              Thread ({threadMessages.length} messages)
                            </div>
                            <div className="bg-[#0a0a0c] border border-[#1c1c1e] rounded-lg max-h-[300px] overflow-y-auto">
                              {threadMessages.map((msg) => {
                                const isError = msg.message_type === "error";
                                const isResult = msg.message_type === "result";
                                return (
                                  <div
                                    key={msg.id}
                                    className="px-3 py-2.5 border-b border-[#1c1c1e] last:border-0"
                                  >
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-xs font-medium text-[#707078]">
                                        {msg.sender_name || msg.sender_type}
                                      </span>
                                      <span className="text-xs text-[#505055]">
                                        {msg.message_type}
                                      </span>
                                      <span className="text-xs text-[#3a3a3e]">
                                        {formatTimestamp(msg.created_at)}
                                      </span>
                                    </div>
                                    <p
                                      className={`text-sm whitespace-pre-wrap line-clamp-6 ${
                                        isError ? "text-[#ff4444]/80" : isResult ? "text-[#00ff88]/80" : "text-[#a0a0a8]"
                                      }`}
                                    >
                                      {msg.content}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Raw result fallback if no thread */}
                        {threadMessages.length === 0 && task.result && (
                          <div>
                            <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">
                              Result
                            </div>
                            <div className="text-sm text-[#a0a0a8] whitespace-pre-wrap break-words bg-[#0a0a0c] border border-[#1c1c1e] rounded-lg p-3 max-h-[200px] overflow-y-auto">
                              {task.result.slice(0, 5000)}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
