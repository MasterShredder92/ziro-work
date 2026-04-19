import { CRMLayout, CRMNav, KpiSkeletonGrid, TableSkeleton } from "./_components";

export default function CRMLoading() {
  return (
    <CRMLayout title="CRM Dashboard" subtitle="Loading CRM data…">
      <CRMNav current="home" />
      <KpiSkeletonGrid />
      <div className="mt-8 mb-3 h-4 w-40 animate-pulse rounded bg-white/10" />
      <TableSkeleton rows={5} cols={5} />
    </CRMLayout>
  );
}
