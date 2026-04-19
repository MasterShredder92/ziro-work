import Link from "next/link";
import { getFamilyById } from "@data/families";
import { getFamilyBillingSummary, listStudentsForFamily } from "@/lib/crm";
import { ensureFamilyAccess } from "../guard";
import { resolveCurrentFamilyId } from "@/lib/family/queries";
import type { Family as FamilyRow } from "@/lib/types/entities";

export const dynamic = "force-dynamic";

export default async function FamilyPortalProfilePage() {
  const session = await ensureFamilyAccess();
  const familyId = await resolveCurrentFamilyId(
    session.userId,
    session.tenantId,
  );

  if (!familyId) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-6">
        <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center">
          <h1 className="text-lg font-semibold text-[var(--z-fg)]">
            No family profile linked
          </h1>
          <p className="mt-2 text-sm text-[var(--z-muted)]">
            Your account isn&apos;t yet connected to a family record. Please
            contact your studio administrator.
          </p>
        </div>
      </div>
    );
  }

  const [familyRaw, students, billing] = await Promise.all([
    getFamilyById(familyId, session.tenantId),
    listStudentsForFamily(session.tenantId, familyId),
    getFamilyBillingSummary(session.tenantId, familyId).catch(() => null),
  ]);
  const family = (familyRaw ?? null) as FamilyRow | null;

  if (!family) {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        Family record not found.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--z-fg)]">
            {family.name}
          </h1>
          <p className="text-sm text-[var(--z-muted)]">
            Read-only family profile — contact your school to update any details.
          </p>
        </div>
        <Link
          href={`/messages?familyId=${encodeURIComponent(family.id)}`}
          className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm font-medium text-[var(--z-fg)] hover:bg-[var(--z-muted)]/10"
        >
          Message center
        </Link>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Primary contact">
          <Row
            label="Contact name"
            value={family.primary_contact_name ?? null}
          />
          <Row label="Email" value={family.primary_email ?? null} />
          <Row label="Phone" value={family.primary_phone ?? null} />
          <Row label="Billing status" value={family.billing_status ?? null} />
        </Card>

        <Card title="Billing summary">
          {billing ? (
            <dl className="space-y-2 text-sm">
              <Row label="Status" value={billing.billingStatus} />
              <Row
                label="Balance"
                value={`$${(billing.balanceCents / 100).toFixed(2)}`}
              />
              <Row
                label="Overdue"
                value={`$${(billing.overdueCents / 100).toFixed(2)}`}
              />
              <Row
                label="Autopay"
                value={billing.autopayEnabled ? "Enabled" : "Off"}
              />
            </dl>
          ) : (
            <div className="text-sm text-[var(--z-muted)]">
              Billing not available.
            </div>
          )}
        </Card>
      </section>

      <Card title="Students in this family">
        {students.length === 0 ? (
          <div className="text-sm text-[var(--z-muted)]">
            No students linked to this family.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--z-border)] text-sm">
            {students.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between py-2"
              >
                <span className="font-semibold text-[var(--z-fg)]">
                  {s.name}
                </span>
                <span className="text-[var(--z-muted)]">{s.status ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--z-fg)]">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--z-border)] py-1.5 last:border-0 text-sm">
      <dt className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </dt>
      <dd className="text-[var(--z-fg)]">{value ?? "—"}</dd>
    </div>
  );
}
