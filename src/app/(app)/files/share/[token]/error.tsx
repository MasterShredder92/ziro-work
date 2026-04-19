"use client";

export default function ShareLinkError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md rounded-md border border-red-500/35 bg-red-500/10 p-6 text-sm text-red-100">
      <h2 className="text-base font-semibold text-red-50">Could not open this link</h2>
      <p className="mt-2 text-xs leading-relaxed">
        {error.message || "Something went wrong while loading the shared document."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]"
      >
        Try again
      </button>
    </div>
  );
}
