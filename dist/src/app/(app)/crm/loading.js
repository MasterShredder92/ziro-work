import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CRMLayout, CRMNav, KpiSkeletonGrid, TableSkeleton } from "./_components";
export default function CRMLoading() {
    return (_jsxs(CRMLayout, { title: "CRM Dashboard", subtitle: "Loading CRM data\u2026", children: [_jsx(CRMNav, { current: "home" }), _jsx(KpiSkeletonGrid, {}), _jsx("div", { className: "mt-8 mb-3 h-4 w-40 animate-pulse rounded bg-white/10" }), _jsx(TableSkeleton, { rows: 5, cols: 5 })] }));
}
