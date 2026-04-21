"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Building2 } from "lucide-react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useTenantUi } from "@/components/tenant/TenantUiContext";
export function TenantSwitcher() {
    var _a, _b;
    const { locations, locationId, currentLocation, setLocationId } = useTenantUi();
    const [open, setOpen] = React.useState(false);
    const rootRef = React.useRef(null);
    const pathname = (_a = usePathname()) !== null && _a !== void 0 ? _a : "/";
    const router = useRouter();
    const hasLocations = locations.length > 0;
    const navigateToLocation = React.useCallback((nextLocationId) => {
        const currentSearch = typeof window !== "undefined" ? window.location.search : "";
        const params = new URLSearchParams(currentSearch);
        params.set("locationId", nextLocationId);
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        router.refresh();
    }, [pathname, router]);
    React.useEffect(() => {
        if (!open)
            return;
        function onDoc(e) {
            var _a;
            if (!((_a = rootRef.current) === null || _a === void 0 ? void 0 : _a.contains(e.target)))
                setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);
    return (_jsxs("div", { ref: rootRef, className: "relative shrink-0", children: [_jsxs("button", { type: "button", "aria-expanded": open, "aria-haspopup": "listbox", onClick: () => setOpen((v) => !v), disabled: !hasLocations, className: cn("flex max-w-[min(52vw,220px)] items-center gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] py-2 text-left text-xs font-semibold text-[var(--z-fg)] transition-colors", "hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)]", !hasLocations && "opacity-60 cursor-not-allowed", focusRingClassName()), children: [_jsx(Building2, { className: "h-4 w-4 shrink-0 text-[var(--z-accent)]", "aria-hidden": true }), _jsx("span", { className: "min-w-0 flex-1 truncate", children: (_b = currentLocation === null || currentLocation === void 0 ? void 0 : currentLocation.name) !== null && _b !== void 0 ? _b : "No locations configured" }), _jsx(ChevronDown, { className: cn("h-4 w-4 shrink-0 text-[var(--z-muted)] transition-transform", open && "rotate-180"), "aria-hidden": true })] }), open && hasLocations ? (_jsx("ul", { role: "listbox", className: "absolute left-0 top-[calc(100%+6px)] z-40 min-w-[220px] overflow-hidden rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] py-1 shadow-[0_18px_50px_rgba(0,0,0,0.55)]", children: locations.map((location) => (_jsx("li", { role: "option", "aria-selected": location.id === locationId, children: _jsxs("button", { type: "button", className: cn("flex w-full items-center gap-2 px-[var(--z-space-3)] py-2 text-left text-xs font-semibold transition-colors", location.id === locationId
                            ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)] text-[var(--z-fg)]"
                            : "text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)]"), onClick: () => {
                            setLocationId(location.id);
                            navigateToLocation(location.id);
                            setOpen(false);
                        }, children: [_jsx("span", { className: cn("h-1.5 w-1.5 shrink-0 rounded-full", location.id === locationId
                                    ? "bg-[var(--z-accent)] shadow-[0_0_8px_var(--z-accent)]"
                                    : "bg-[var(--z-border)]") }), _jsx("span", { className: "truncate", children: location.name })] }) }, location.id))) })) : null] }));
}
