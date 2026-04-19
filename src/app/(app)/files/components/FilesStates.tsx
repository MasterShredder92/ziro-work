export function FilesLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md border border-dashed border-[var(--z-border)] bg-[var(--z-surface)]/60 px-6 py-10 text-center text-sm text-[var(--z-muted)]"
    >
      {label}
    </div>
  );
}

export function FilesError({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-md border border-red-500/35 bg-red-500/10 px-4 py-5 text-sm">
      <div className="font-semibold text-red-300">{title}</div>
      <p className="mt-1 text-red-200/90">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md border border-red-400/40 px-3 py-1.5 text-xs text-red-100 hover:bg-red-500/15"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
