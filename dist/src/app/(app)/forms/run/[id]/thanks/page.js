import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "server-only";
export const dynamic = "force-dynamic";
export default async function ThanksPage({ searchParams }) {
    const sp = searchParams ? await searchParams : undefined;
    return (_jsx("div", { className: "flex min-h-[calc(100vh-4rem)] items-center justify-center px-4", children: _jsxs("div", { className: "max-w-md rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center", children: [_jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "Thanks for your response." }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Your submission has been recorded." }), (sp === null || sp === void 0 ? void 0 : sp.s) ? (_jsxs("p", { className: "mt-3 font-mono text-[11px] text-[var(--z-muted)]", children: ["#", sp.s.slice(0, 8)] })) : null] }) }));
}
