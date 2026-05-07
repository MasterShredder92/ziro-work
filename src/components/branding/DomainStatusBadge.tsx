import type { BrandingDomainStatus } from "@/lib/branding/types";

const STYLE: Record<BrandingDomainStatus, string> = {
  pending: "bg-[var(--z-muted)]/20 text-[var(--z-muted)] border-[var(--z-border)]",
  verifying: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  verified: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  active: "bg-[#c4f036]/15 text-[#c4f036] border-[#c4f036]/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function DomainStatusBadge({ status }: { status: BrandingDomainStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STYLE[status]}`}
    >
      {status}
    </span>
  );
}
