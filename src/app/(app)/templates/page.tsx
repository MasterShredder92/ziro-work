import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import {
  listMergeFields,
  listTemplatesForTenant,
} from "@/lib/templates/service";
import { MergeFieldReference } from "./components/MergeFieldReference";
import { TemplateList } from "./components/TemplateList";

export default async function TemplatesOverviewPage() {
  try {
    await requirePermission("templates.read")();
  } catch {
    redirect("/");
  }

  const [templates, mergeFields] = await Promise.all([
    listTemplatesForTenant(),
    listMergeFields(),
  ]);

  const byCategory = templates.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1;
    return acc;
  }, {});
  const byChannel = templates.reduce<Record<string, number>>((acc, t) => {
    acc[t.channel] = (acc[t.channel] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--z-fg)]">
            Communication Templates
          </h1>
          <p className="text-sm text-[var(--z-muted)]">
            Manage reusable, versioned templates with merge fields for every
            family-, student-, and teacher-facing message.
          </p>
        </div>
        <Link
          href="/templates/new"
          className="rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] px-3 py-2 text-sm font-semibold text-[var(--z-accent)]"
        >
          New template
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Total templates" value={String(templates.length)} />
        <SummaryCard
          label="Categories"
          value={String(Object.keys(byCategory).length)}
        />
        <SummaryCard
          label="Channels"
          value={String(Object.keys(byChannel).length)}
        />
        <SummaryCard
          label="Archived"
          value={String(templates.filter((t) => t.isArchived).length)}
        />
      </section>

      <section id="library" className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Library
        </h2>
        <TemplateList templates={templates} />
      </section>

      <section id="merge-fields" className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Merge field reference
        </h2>
        <MergeFieldReference mergeFields={mergeFields} />
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-[var(--z-fg)]">
        {value}
      </div>
    </div>
  );
}
