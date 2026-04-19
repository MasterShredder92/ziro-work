import { getFormsDashboard } from "@/lib/forms/service";
import { FormList, SubmissionList } from "./components";

export const dynamic = "force-dynamic";

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export default async function FormsPage() {
  const dashboard = await getFormsDashboard();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
            Forms &amp; surveys
          </div>
          <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
            Forms dashboard
          </h1>
          <p className="text-sm text-[var(--z-muted)]">
            Design dynamic forms, collect submissions, and trigger automations
            on every new response.
          </p>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total forms" value={dashboard.kpis.totalForms} />
        <KpiCard label="Published" value={dashboard.kpis.publishedForms} />
        <KpiCard label="Drafts" value={dashboard.kpis.draftForms} />
        <KpiCard
          label="Total submissions"
          value={dashboard.kpis.totalSubmissions}
        />
        <KpiCard
          label="Completion rate"
          value={pct(dashboard.kpis.completionRate)}
        />
      </section>

      <section id="library" className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Form library
        </h2>
        <FormList
          forms={dashboard.forms}
          submissionsByForm={dashboard.submissionsByForm}
          kpis={dashboard.kpis}
        />
      </section>

      <section id="submissions" className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Recent submissions
        </h2>
        <SubmissionList submissions={dashboard.recentSubmissions} />
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
