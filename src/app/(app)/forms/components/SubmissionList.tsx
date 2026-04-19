import Link from "next/link";
import type { FormSubmission } from "@/lib/forms/types";

export type SubmissionListProps = {
  submissions: FormSubmission[];
};

function formatWhen(iso: string | null): string {
  if (!iso) return "–";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "–";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}m ${rem}s`;
}

export function SubmissionList({ submissions }: SubmissionListProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center text-sm text-[var(--z-muted)]">
        No submissions yet.
      </div>
    );
  }

  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)] text-left">
            <th className="px-4 py-2 font-medium text-[var(--z-muted)]">Submitted</th>
            <th className="px-4 py-2 font-medium text-[var(--z-muted)]">Status</th>
            <th className="px-4 py-2 font-medium text-[var(--z-muted)]">Profile</th>
            <th className="px-4 py-2 font-medium text-[var(--z-muted)] text-right">Duration</th>
            <th className="px-4 py-2 font-medium text-[var(--z-muted)] text-right"></th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr
              key={s.id}
              className="border-t border-[var(--z-border)] hover:bg-white/[0.02]"
            >
              <td className="px-4 py-2 text-[var(--z-fg)]">
                {formatWhen(s.completedAt ?? s.startedAt)}
              </td>
              <td className="px-4 py-2 capitalize text-[var(--z-muted)]">
                {s.status}
              </td>
              <td className="px-4 py-2 text-[var(--z-muted)] font-mono text-xs">
                {s.profileId ?? s.submittedBy ?? "anonymous"}
              </td>
              <td className="px-4 py-2 text-right text-[var(--z-muted)]">
                {formatDuration(s.durationMs)}
              </td>
              <td className="px-4 py-2 text-right">
                <Link
                  href={`/forms/submission/${s.id}`}
                  className="text-xs text-[#00ff88] hover:text-[#00e679]"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
