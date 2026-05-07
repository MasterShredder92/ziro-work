import Link from "next/link";
import type { Form, FormDashboardData } from "@/lib/forms/types";

function formatPct(n: number): string {
  if (!Number.isFinite(n)) return "–";
  return `${(n * 100).toFixed(0)}%`;
}

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "–";
    const diff = Date.now() - d.getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "–";
  }
}

export type FormListProps = {
  forms: Form[];
  submissionsByForm: Record<string, number>;
  kpis: FormDashboardData["kpis"];
};

export function FormList({ forms, submissionsByForm, kpis }: FormListProps) {
  if (forms.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          No forms yet
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          Create your first form to start collecting responses.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Forms" value={String(kpis.totalForms)} />
        <KpiCard label="Published" value={String(kpis.publishedForms)} />
        <KpiCard label="Submissions" value={String(kpis.totalSubmissions)} />
        <KpiCard
          label="Completion"
          value={formatPct(kpis.completionRate)}
          tone="positive"
        />
      </div>

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)] text-left">
              <th className="px-4 py-2 font-medium text-[var(--z-muted)]">Form</th>
              <th className="px-4 py-2 font-medium text-[var(--z-muted)]">Status</th>
              <th className="px-4 py-2 font-medium text-[var(--z-muted)]">Public</th>
              <th className="px-4 py-2 font-medium text-[var(--z-muted)] text-right">Submissions</th>
              <th className="px-4 py-2 font-medium text-[var(--z-muted)] text-right">Updated</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr
                key={form.id}
                className="border-t border-[var(--z-border)] hover:bg-white/[0.02]"
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/forms/${form.id}`}
                    className="text-[var(--z-fg)] font-medium hover:text-[#c4f036]"
                  >
                    {form.name}
                  </Link>
                  {form.slug ? (
                    <div className="text-[11px] text-[var(--z-muted)] font-mono">
                      /{form.slug}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-2 text-[var(--z-muted)] capitalize">
                  {form.status}
                </td>
                <td className="px-4 py-2 text-[var(--z-muted)]">
                  {form.isPublic ? "Yes" : "No"}
                </td>
                <td className="px-4 py-2 text-right font-mono text-[var(--z-fg)]">
                  {submissionsByForm[form.id] ?? 0}
                </td>
                <td className="px-4 py-2 text-right text-[var(--z-muted)]">
                  {formatRelative(form.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "text-[#c4f036]"
      : tone === "warning"
        ? "text-amber-400"
        : "text-[var(--z-fg)]";
  return (
    <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
