"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";
export function Tabs({ tabs, activeTab, onChange, className }) {
    const navRef = React.useRef(null);
    const tabRefs = React.useRef({});
    const [indicator, setIndicator] = React.useState({ left: 0, width: 0 });
    const tabIds = React.useMemo(() => tabs.map((t) => t.id).join("|"), [tabs]);
    const placeIndicator = React.useCallback(() => {
        const wrap = navRef.current;
        const el = tabRefs.current[activeTab];
        if (!wrap || !el)
            return;
        const w = wrap.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        setIndicator({ left: r.left - w.left + wrap.scrollLeft, width: r.width });
    }, [activeTab]);
    React.useLayoutEffect(() => {
        placeIndicator();
    }, [placeIndicator, tabIds, activeTab]);
    React.useEffect(() => {
        const wrap = navRef.current;
        if (!wrap)
            return;
        const ro = new ResizeObserver(() => placeIndicator());
        ro.observe(wrap);
        window.addEventListener("resize", placeIndicator);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", placeIndicator);
        };
    }, [placeIndicator, tabIds]);
    return (_jsxs("div", { ref: navRef, className: cn("relative flex items-stretch border-b border-[var(--z-border)]", className), children: [tabs.map((t) => {
                const isActive = t.id === activeTab;
                return (_jsx("button", { ref: (node) => {
                        tabRefs.current[t.id] = node;
                    }, type: "button", onClick: () => onChange(t.id), disabled: t.disabled, className: cn("relative z-[1] min-w-0 flex-1 px-[var(--z-space-3)] py-[var(--z-space-3)] text-center text-sm font-semibold transition-colors", "text-[var(--z-muted)] hover:text-[var(--z-fg)] disabled:opacity-50 disabled:pointer-events-none", isActive && "text-[var(--z-fg)]", focusRingClassName()), children: t.label }, t.id));
            }), _jsx("span", { className: cn("z-tabs-indicator pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-[var(--z-accent-color)]", indicator.width > 0 ? "opacity-100" : "opacity-0"), style: { left: indicator.left, width: indicator.width }, "aria-hidden": true })] }));
}
