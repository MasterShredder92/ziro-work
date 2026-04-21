"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { TourSpotlight } from "@/components/tour/TourSpotlight";
import { TourStep } from "@/components/tour/TourStep";
import { DEMO_PRIMARY_STUDENT_ID } from "@/lib/demo/demoData";
function sameGeom(a, b) {
    if (a === b)
        return true;
    if (!a || !b)
        return false;
    return a.cx === b.cx && a.cy === b.cy && a.r === b.r;
}
function sameRect(a, b) {
    if (a === b)
        return true;
    if (!a || !b)
        return false;
    return (a.top === b.top &&
        a.left === b.left &&
        a.width === b.width &&
        a.height === b.height);
}
const STEPS = [
    {
        id: "metrics",
        path: "/dashboard",
        selector: '[data-tour="dashboard-metrics"]',
        title: "Dashboard metrics",
        description: "Revenue, pipeline, and risk roll up here so you can read studio health in seconds.",
        nextLabel: "Next",
    },
    {
        id: "quick",
        path: "/dashboard",
        selector: '[data-tour="quick-actions"]',
        title: "Quick actions",
        description: "Jump to overdue invoices, at-risk students, and new leads without hunting through menus.",
        nextLabel: "Next",
    },
    {
        id: "feed",
        path: "/dashboard",
        selector: '[data-tour="activity-feed"]',
        title: "Activity feed",
        description: "Lifecycle moves, agent work, and billing signals stream in newest-first.",
        nextLabel: "Next",
    },
    {
        id: "map",
        path: "/studio-map",
        selector: '[data-tour="studio-map"]',
        title: "Studio map",
        description: "See teachers, load, and roster density across your whole studio at a glance.",
        nextLabel: "Next",
    },
    {
        id: "lifecycle",
        path: "/lifecycle/intake",
        selector: '[data-tour="lifecycle-stages"]',
        title: "Customer lifecycle",
        description: "Eight stages from first inquiry through win-back, so you can see where someone sits in the studio journey.",
        nextLabel: "Next",
    },
    {
        id: "student",
        path: `/students/${DEMO_PRIMARY_STUDENT_ID}`,
        selector: '[data-tour="student-detail"]',
        title: "Student detail",
        description: "Deep context, timeline, and agents stay attached to each learner as they progress.",
        nextLabel: "Done",
    },
];
function measure(selector) {
    const el = document.querySelector(selector);
    if (!el)
        return null;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 && rect.height < 2)
        return null;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const r = Math.max(48, Math.hypot(rect.width, rect.height) / 2 + 14);
    return { cx, cy, r };
}
function tooltipStyle(rect, placement) {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const w = Math.min(360, vw - 16);
    if (!rect) {
        return { left: 16, top: 96, width: w };
    }
    const left = Math.min(Math.max(12, rect.left), vw - w - 12);
    if (placement === "bottom") {
        return { left, top: Math.min(rect.bottom + 12, window.innerHeight - 220), width: w };
    }
    return { left, top: Math.max(12, rect.top - 200), width: w };
}
export function ProductTour({ open, onClose }) {
    var _a;
    const router = useRouter();
    const pathname = usePathname();
    const pendingPathRef = React.useRef(null);
    const [mounted, setMounted] = React.useState(false);
    const [stepIndex, setStepIndex] = React.useState(0);
    const [geom, setGeom] = React.useState(null);
    const [tooltipRect, setTooltipRect] = React.useState(null);
    const [placement, setPlacement] = React.useState("bottom");
    React.useEffect(() => setMounted(true), []);
    React.useEffect(() => {
        if (!open) {
            pendingPathRef.current = null;
            setStepIndex(0);
            setGeom(null);
        }
    }, [open]);
    const step = (_a = STEPS[stepIndex]) !== null && _a !== void 0 ? _a : STEPS[0];
    const refresh = React.useCallback(() => {
        var _a;
        if (!open)
            return;
        const g = measure(step.selector);
        setGeom((prev) => (sameGeom(prev, g) ? prev : g));
        const el = document.querySelector(step.selector);
        const rect = (_a = el === null || el === void 0 ? void 0 : el.getBoundingClientRect()) !== null && _a !== void 0 ? _a : null;
        setTooltipRect((prev) => (sameRect(prev, rect) ? prev : rect));
        if (rect) {
            const spaceBelow = window.innerHeight - rect.bottom;
            const nextPlacement = spaceBelow < 220 ? "top" : "bottom";
            setPlacement((prev) => (prev === nextPlacement ? prev : nextPlacement));
        }
    }, [open, step.selector]);
    React.useEffect(() => {
        if (!open)
            return;
        if (pathname !== step.path) {
            if (pendingPathRef.current !== step.path) {
                pendingPathRef.current = step.path;
                router.push(step.path);
            }
            const t = window.setTimeout(refresh, 380);
            return () => window.clearTimeout(t);
        }
        pendingPathRef.current = null;
        refresh();
        const t = window.setTimeout(refresh, 120);
        window.addEventListener("resize", refresh);
        window.addEventListener("scroll", refresh, true);
        return () => {
            window.clearTimeout(t);
            window.removeEventListener("resize", refresh);
            window.removeEventListener("scroll", refresh, true);
        };
    }, [open, pathname, router, step.path, step.selector, refresh]);
    const onNext = React.useCallback(() => {
        if (stepIndex >= STEPS.length - 1) {
            onClose();
            return;
        }
        setStepIndex((i) => i + 1);
    }, [onClose, stepIndex]);
    if (!open || !mounted)
        return null;
    const ttStyle = tooltipStyle(tooltipRect, placement);
    return createPortal(_jsxs(_Fragment, { children: [geom ? (_jsx(TourSpotlight, { cx: geom.cx, cy: geom.cy, r: geom.r, onBackdropClick: onClose })) : (_jsx("button", { type: "button", "aria-label": "Close tour", className: "fixed inset-0 z-[70] cursor-default border-0 bg-black/80 p-0", onClick: onClose })), _jsx(TourStep, { title: step.title, description: step.description, nextLabel: step.nextLabel, onNext: onNext, onSkip: onClose, placement: placement, style: ttStyle })] }), document.body);
}
