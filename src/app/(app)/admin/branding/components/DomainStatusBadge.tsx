import type { BrandingDomainStatus } from "@/lib/branding";

export interface DomainStatusBadgeProps {
  status: BrandingDomainStatus;
}

const STATUS_LABEL: Record<BrandingDomainStatus, string> = {
  pending: "Pending",
  verifying: "Verifying",
  verified: "Verified",
  active: "Active",
  failed: "Failed",
};

const STATUS_CLASSES: Record<BrandingDomainStatus, string> = {
  pending:
    "border-[var(--z-border)] bg-[var(--z-surface)] text-[var(--z-muted)]",
  verifying: "border-[#ffcc33]/40 bg-[#ffcc33]/10 text-[#ffcc33]",
  verified: "border-[#c4f036]/40 bg-[#c4f036]/10 text-[#c4f036]",
  active: "border-[#c4f036]/50 bg-[#c4f036]/15 text-[#c4f036]",
  failed: "border-[#ff3b6b]/40 bg-[#ff3b6b]/10 text-[#ff3b6b]",
};

export function DomainStatusBadge({ status }: DomainStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[var(--z-radius-sm)] border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
