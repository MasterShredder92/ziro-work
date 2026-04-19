import Link from "next/link";
import { Suspense } from "react";
import { CRMNav, CRMLayout, KpiSkeletonGrid, TableSkeleton } from "./_components";
import { CRMDashboardBody } from "./_dashboard";

export const dynamic = "force-dynamic";

function DashboardFallback() {
  return (
    <>
      <CRMNav current="home" />
      <KpiSkeletonGrid />
      <div className="mt-8 mb-3 h-4 w-40 animate-pulse rounded bg-white/10" />
      <TableSkeleton rows={5} cols={5} />
    </>
  );
}

export default function CRMHomeDashboard() {
  return (
    <CRMLayout
      title="CRM Dashboard"
      subtitle="Unified view of contacts, families, students, teachers, and enrollments."
      actions={
        <Link
          href="/crm/contacts?new=1"
          className="rounded-md bg-[var(--z-accent,#00ff88)]/10 px-3 py-1.5 text-sm font-semibold text-[var(--z-accent,#00ff88)] hover:bg-[var(--z-accent,#00ff88)]/20"
        >
          + Add contact
        </Link>
      }
    >
      <Suspense fallback={<DashboardFallback />}>
        <CRMDashboardBody />
      </Suspense>
    </CRMLayout>
  );
}
