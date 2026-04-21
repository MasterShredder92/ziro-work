"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
export function LocationSwitcher({ locations, activeLocationId, }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [pending, startTransition] = useTransition();
    function onChange(value) {
        var _a;
        const params = new URLSearchParams((_a = searchParams === null || searchParams === void 0 ? void 0 : searchParams.toString()) !== null && _a !== void 0 ? _a : "");
        params.set("locationId", value);
        startTransition(() => {
            router.push(`?${params.toString()}`, { scroll: false });
            router.refresh();
        });
    }
    return (_jsxs("label", { className: "flex items-center gap-2 text-sm text-[var(--z-muted)]", children: [_jsx("span", { className: "hidden sm:inline text-xs uppercase tracking-wider", children: "Location" }), _jsxs("select", { value: activeLocationId, onChange: (e) => onChange(e.target.value), disabled: pending, className: "bg-[var(--z-surface)] border border-[var(--z-border)] rounded-[var(--z-radius-md)] px-3 py-1.5 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-2 focus:ring-[#00ff88]/60 disabled:opacity-60", children: [locations.length === 0 ? (_jsx("option", { value: activeLocationId, children: "All Locations" })) : null, locations.map((l) => (_jsx("option", { value: l.id, children: l.name }, l.id)))] })] }));
}
