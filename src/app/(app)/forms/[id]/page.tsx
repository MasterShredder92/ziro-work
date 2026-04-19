import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getFormSurface } from "@/lib/forms/service";
import { FormEditor, SubmissionList } from "../components";

export const dynamic = "force-dynamic";

type PageParams = { params: Promise<{ id: string }> };

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export default async function FormDetailPage({ params }: PageParams) {
  const { id } = await params;
  const session = await getSession();
  const canWrite = session ? can(session.role, "forms.write") : false;

  if (id === "new") {
    return (
      <div className="space-y-6">
        <header>
          <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
            Forms &amp; surveys
          </div>
          <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
            New form
          </h1>
        </header>
        <FormEditor initial={{ mode: "create" }} canWrite={canWrite} />
      </div>
    );
  }

  const surface = await getFormSurface(id);
  if (!surface) notFound();

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
          Forms &amp; surveys
        </div>
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
          {surface.form.name}
        </h1>
      </header>

      <FormEditor
        initial={{
          mode: "edit",
          bundle: {
            form: surface.form,
            fields: surface.fields,
            sections: surface.sections,
          },
        }}
        canWrite={canWrite}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          KPIs
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            label="Submissions"
            value={surface.kpis.totalSubmissions}
          />
          <KpiCard
            label="Completed"
            value={surface.kpis.completedSubmissions}
          />
          <KpiCard
            label="Abandoned"
            value={surface.kpis.abandonedSubmissions}
          />
          <KpiCard
            label="Completion rate"
            value={pct(surface.kpis.completionRate)}
          />
          <KpiCard
            label="Avg duration"
            value={
              surface.kpis.averageDurationMs != null
                ? `${Math.round(surface.kpis.averageDurationMs / 1000)}s`
                : "—"
            }
          />
        </div>
      </section>

      {surface.kpis.fieldDropOff.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Field drop-off
          </h2>
          <div className="overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Field</th>
                  <th className="px-4 py-3 font-medium">Answered</th>
                  <th className="px-4 py-3 font-medium">Drop-off</th>
                  <th className="px-4 py-3 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--z-border)]">
                {surface.kpis.fieldDropOff.map((row) => (
                  <tr key={row.fieldId}>
                    <td className="px-4 py-3 text-[var(--z-fg)]">
                      {row.label}
                      <div className="text-xs text-[var(--z-muted)]">
                        {row.fieldKey}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--z-muted)]">
                      {row.answeredCount}
                    </td>
                    <td className="px-4 py-3 text-[var(--z-muted)]">
                      {row.dropOffCount}
                    </td>
                    <td className="px-4 py-3 text-[var(--z-muted)]">
                      {pct(row.dropOffRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Submissions
        </h2>
        <SubmissionList submissions={surface.submissions} />
      </section>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-[var(--z-fg)]">
        {value}
      </div>
    </div>
  );
}
