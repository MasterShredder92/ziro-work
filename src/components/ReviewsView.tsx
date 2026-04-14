"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Star,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  X,
} from "lucide-react";

interface StarReview {
  id: string;
  summary: string;
  what_worked: string[];
  what_failed: string[];
  next_action: string | null;
  verdict: string;
  created_at: string;
  task_runs: {
    runtime: string;
    duration_ms: number | null;
    status: string;
    attempt_number: number;
    agent_tasks: { title: string; task_type: string | null } | null;
  } | null;
}

const VERDICT_CONFIG: Record<string, { color: string; label: string }> = {
  approved: { color: "#00ff88", label: "Approved" },
  retry: { color: "#f59e0b", label: "Retry" },
  escalate: { color: "#ff4444", label: "Escalate" },
  needs_human: { color: "#a855f7", label: "Needs Human" },
};

function VerdictIcon({ verdict }: { verdict: string }) {
  switch (verdict) {
    case "approved":
      return <CheckCircle size={14} className="text-[#00ff88]" />;
    case "retry":
      return <RefreshCw size={14} className="text-[#f59e0b]" />;
    case "escalate":
      return <AlertTriangle size={14} className="text-[#ff4444]" />;
    default:
      return <HelpCircle size={14} className="text-[#a855f7]" />;
  }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  );
}

export default function ReviewsView() {
  const [reviews, setReviews] = useState<StarReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StarReview | null>(null);
  const [filterVerdict, setFilterVerdict] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("star_reviews")
      .select("*, task_runs(runtime, duration_ms, status, attempt_number, agent_tasks(title, task_type))")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setReviews((data as StarReview[]) || []);
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

  const filtered = filterVerdict === "all"
    ? reviews
    : reviews.filter((r) => r.verdict === filterVerdict);

  return (
    <>
      <div className="h-full overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-[#f0f0f0]">STAR Reviews</h2>
            <p className="text-sm text-[#606068] mt-1">
              Post-execution reviews with verdict, analysis, and next actions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button
                onClick={() => setFilterVerdict("all")}
                className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                  filterVerdict === "all"
                    ? "bg-white/10 text-[#f0f0f0]"
                    : "text-[#606068] hover:text-[#a0a0a8]"
                }`}
              >
                All
              </button>
              {Object.entries(VERDICT_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setFilterVerdict(key)}
                  className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                    filterVerdict === key ? "" : "hover:text-[#a0a0a8]"
                  }`}
                  style={{
                    color: filterVerdict === key ? cfg.color : "#606068",
                    backgroundColor: filterVerdict === key ? `${cfg.color}15` : undefined,
                  }}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
            <span className="text-sm text-[#606068]">{filtered.length} reviews</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-[#101012] border border-[#1c1c1e] rounded-xl p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
            <Star size={32} className="mx-auto text-[#3a3a3e] mb-3" />
            <p className="text-[#707078] text-[15px]">No reviews yet</p>
            <p className="text-[#505055] text-sm mt-1">
              Reviews are generated after task runs complete.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((review) => {
              const vc = VERDICT_CONFIG[review.verdict] || VERDICT_CONFIG.needs_human;
              return (
                <div
                  key={review.id}
                  onClick={() => setSelected(review)}
                  className="flex items-center gap-3 p-4 bg-[#101012] border border-[#1c1c1e] rounded-xl cursor-pointer hover:bg-[#161618] hover:border-[#2a2a2e] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                >
                  <VerdictIcon verdict={review.verdict} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#ccc] truncate">
                      {review.task_runs?.agent_tasks?.title || "Untitled"}
                    </div>
                    <div className="text-xs text-[#707078] mt-0.5 truncate">
                      {review.summary}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        color: vc.color,
                        backgroundColor: `${vc.color}15`,
                      }}
                    >
                      {vc.label}
                    </span>
                    <div className="text-xs text-[#505055] mt-1">
                      {formatTimestamp(review.created_at)}
                    </div>
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
            className="relative w-[90%] max-w-[620px] max-h-[80vh] bg-[#0c0c0e] border border-[#1c1c1e] rounded-xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <h3 className="text-[15px] font-bold text-[#f0f0f0]">
                  {selected.task_runs?.agent_tasks?.title || "Untitled"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      color:
                        VERDICT_CONFIG[selected.verdict]?.color || "#909098",
                      backgroundColor: `${VERDICT_CONFIG[selected.verdict]?.color || "#909098"}15`,
                    }}
                  >
                    {VERDICT_CONFIG[selected.verdict]?.label || selected.verdict}
                  </span>
                  {selected.task_runs?.runtime && (
                    <span className="text-xs text-[#606068]">
                      {selected.task_runs.runtime}
                    </span>
                  )}
                  {selected.task_runs?.attempt_number && selected.task_runs.attempt_number > 1 && (
                    <span className="text-xs text-[#f59e0b]">
                      attempt {selected.task_runs.attempt_number}
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

            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
              {/* Summary */}
              <div>
                <div className="text-xs font-semibold text-[#606068] uppercase tracking-wider mb-1">
                  Summary
                </div>
                <p className="text-sm text-[#a0a0a8]">{selected.summary}</p>
              </div>

              {/* What Worked */}
              {selected.what_worked.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#00ff88] uppercase tracking-wider mb-1">
                    What Worked
                  </div>
                  <ul className="space-y-1">
                    {selected.what_worked.map((item, i) => (
                      <li key={i} className="text-sm text-[#a0a0a8] flex items-start gap-1.5">
                        <CheckCircle size={10} className="text-[#00ff88] mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What Failed */}
              {selected.what_failed.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-[#ff4444] uppercase tracking-wider mb-1">
                    What Failed
                  </div>
                  <ul className="space-y-1">
                    {selected.what_failed.map((item, i) => (
                      <li key={i} className="text-sm text-[#a0a0a8] flex items-start gap-1.5">
                        <AlertTriangle size={10} className="text-[#ff4444] mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Action */}
              {selected.next_action && (
                <div>
                  <div className="text-xs font-semibold text-[#3b82f6] uppercase tracking-wider mb-1">
                    Next Action
                  </div>
                  <p className="text-sm text-[#a0a0a8]">{selected.next_action}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
