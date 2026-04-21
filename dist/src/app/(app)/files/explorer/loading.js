import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FilesLoading } from "../components/FilesStates";
export default function ExplorerLoading() {
    return (_jsxs("div", { className: "space-y-5", children: [_jsx("div", { className: "h-8 w-48 animate-pulse rounded bg-white/[0.06]" }), _jsxs("div", { className: "grid gap-4 md:grid-cols-[260px,1fr]", children: [_jsx("div", { className: "h-64 animate-pulse rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]/50" }), _jsx("div", { className: "h-96 animate-pulse rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]/50" })] }), _jsx(FilesLoading, { label: "Loading explorer\u2026" })] }));
}
