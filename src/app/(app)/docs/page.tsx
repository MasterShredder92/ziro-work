import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-10 px-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--z-fg)]">ZiroWork Documentation</h1>
        <p className="mt-2 text-sm text-[var(--z-muted)]">
          Guides, references, and release notes for ZiroWork.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/docs/changelog"
          className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 hover:border-[var(--z-accent)] transition-colors"
        >
          <div className="text-sm font-semibold text-[var(--z-fg)]">Changelog</div>
          <div className="mt-1 text-xs text-[var(--z-muted)]">What&apos;s new in each release.</div>
        </Link>

        <a
          href="https://help.manus.im"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 hover:border-[var(--z-accent)] transition-colors"
        >
          <div className="text-sm font-semibold text-[var(--z-fg)]">Support</div>
          <div className="mt-1 text-xs text-[var(--z-muted)]">Get help from the ZiroWork team.</div>
        </a>
      </div>

      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center">
        <div className="text-sm font-semibold text-[var(--z-fg)]">Full documentation coming soon</div>
        <p className="mt-2 text-xs text-[var(--z-muted)]">
          In-app guides, video walkthroughs, and API references are in progress.
        </p>
      </div>
    </div>
  );
}
