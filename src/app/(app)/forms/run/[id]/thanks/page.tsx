import "server-only";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ s?: string }>;
}

export default async function ThanksPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="max-w-md rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center">
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
          Thanks for your response.
        </h1>
        <p className="mt-2 text-sm text-[var(--z-muted)]">
          Your submission has been recorded.
        </p>
        {sp?.s ? (
          <p className="mt-3 font-mono text-[11px] text-[var(--z-muted)]">
            #{sp.s.slice(0, 8)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
