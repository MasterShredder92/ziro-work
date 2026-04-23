import { Suspense } from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { StudentOverviewHeader } from "./_header";
import { StudentOverviewContent } from "./_content";

export default function StudentOverviewPage() {
  return (
    <Suspense fallback={<PageShell title="Student" />}>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header + breadcrumbs */}
        <StudentOverviewHeader />

        {/* Spacer between header and tabs */}
        <div className="mt-6">
          <StudentOverviewContent />
        </div>
      </div>
    </Suspense>
  );
}
