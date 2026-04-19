import { FilesLoading } from "../components/FilesStates";

export default function ExplorerLoading() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-48 animate-pulse rounded bg-white/[0.06]" />
      <div className="grid gap-4 md:grid-cols-[260px,1fr]">
        <div className="h-64 animate-pulse rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]/50" />
        <div className="h-96 animate-pulse rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]/50" />
      </div>
      <FilesLoading label="Loading explorer…" />
    </div>
  );
}
