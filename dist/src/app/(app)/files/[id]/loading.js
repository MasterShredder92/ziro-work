import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FilesLoading } from "../components/FilesStates";
export default function FileDetailLoading() {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "h-4 w-2/3 max-w-md animate-pulse rounded bg-white/[0.06]" }), _jsx("div", { className: "h-10 w-full max-w-lg animate-pulse rounded bg-white/[0.06]" }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsx("div", { className: "h-[50vh] animate-pulse rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]/40 lg:col-span-2" }), _jsx("div", { className: "h-64 animate-pulse rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]/40" })] }), _jsx(FilesLoading, { label: "Loading file\u2026" })] }));
}
