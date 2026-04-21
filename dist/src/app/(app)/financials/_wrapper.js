"use client";
import { jsx as _jsx } from "react/jsx-runtime";
// ssr:false must live in a Client Component — Turbopack does not allow it in Server Components.
// This wrapper is imported by page.tsx (server component) and handles the dynamic import.
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const FinancialsClientDynamic = dynamic(() => import("./_client").then((m) => m.FinancialsClient), {
    ssr: false,
    loading: () => _jsx(PageShell, { title: "Financials" }),
});
export function FinancialsWrapper() {
    return _jsx(FinancialsClientDynamic, {});
}
