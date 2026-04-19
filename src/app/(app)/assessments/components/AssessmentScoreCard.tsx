import type { AssessmentScore } from "@/lib/assessments/types";

export function AssessmentScoreCard({ score }: { score: AssessmentScore }) {
  const tone = score.passed
    ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]"
    : score.manualPendingCount > 0
      ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
      : "border-red-400/40 bg-red-400/10 text-red-300";
  return (
    <div className={`rounded-lg border px-4 py-3 min-w-[180px] ${tone}`}>
      <div className="text-[10px] uppercase tracking-wider font-semibold">
        Score
      </div>
      <div className="mt-1 text-2xl font-bold">
        {score.percent}%
      </div>
      <div className="text-[11px] opacity-80">
        {score.totalScore} / {score.maxScore || 0} pts
      </div>
      {score.manualPendingCount > 0 ? (
        <div className="mt-1 text-[11px]">
          {score.manualPendingCount} pending review
        </div>
      ) : null}
      {score.gradedAt ? (
        <div className="mt-1 text-[10px] opacity-70">
          Graded {new Date(score.gradedAt).toLocaleDateString()}
        </div>
      ) : null}
    </div>
  );
}
