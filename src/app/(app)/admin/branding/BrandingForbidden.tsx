type BrandingForbiddenProps = {
  /** Shorter inline notice for secondary surfaces */
  variant?: "compact" | "full";
};

export function BrandingForbidden({
  variant = "full",
}: BrandingForbiddenProps) {
  if (variant === "compact") {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center text-sm text-[var(--z-muted)]">
        Forbidden
      </div>
    );
  }
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
      <div className="text-base font-semibold text-[var(--z-fg)]">Forbidden</div>
      <div className="mt-2 text-sm text-[var(--z-muted)]">
        You do not have access to Branding OS.
      </div>
    </div>
  );
}
