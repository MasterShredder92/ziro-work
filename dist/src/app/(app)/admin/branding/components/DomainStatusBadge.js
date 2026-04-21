import { jsx as _jsx } from "react/jsx-runtime";
const STATUS_LABEL = {
    pending: "Pending",
    verifying: "Verifying",
    verified: "Verified",
    active: "Active",
    failed: "Failed",
};
const STATUS_CLASSES = {
    pending: "border-[var(--z-border)] bg-[var(--z-surface)] text-[var(--z-muted)]",
    verifying: "border-[#ffcc33]/40 bg-[#ffcc33]/10 text-[#ffcc33]",
    verified: "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]",
    active: "border-[#00ff88]/50 bg-[#00ff88]/15 text-[#00ff88]",
    failed: "border-[#ff3b6b]/40 bg-[#ff3b6b]/10 text-[#ff3b6b]",
};
export function DomainStatusBadge({ status }) {
    return (_jsx("span", { className: `inline-flex items-center gap-1 rounded-[var(--z-radius-sm)] border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${STATUS_CLASSES[status]}`, children: STATUS_LABEL[status] }));
}
