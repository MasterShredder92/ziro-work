"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { OnboardingChecklist, } from "@/components/onboarding/OnboardingChecklist";
const STORAGE_PREFIX = "ziro.onboarding.done.";
function readDone(id) {
    if (typeof window === "undefined")
        return false;
    return window.localStorage.getItem(STORAGE_PREFIX + id) === "1";
}
function writeDone(id) {
    if (typeof window === "undefined")
        return;
    window.localStorage.setItem(STORAGE_PREFIX + id, "1");
}
export function OnboardingClient() {
    const router = useRouter();
    const { trackEvent } = useAnalytics();
    const [tick, setTick] = React.useState(0);
    const refresh = React.useCallback(() => setTick((t) => t + 1), []);
    const steps = React.useMemo(() => {
        void tick;
        return [
            {
                id: "studio",
                title: "Add studio info",
                description: "Name, billing defaults, and locations so ZiroWork reflects your real operation.",
                done: readDone("studio"),
                actionLabel: "Open settings",
                onAction: () => {
                    trackEvent("onboarding_checklist_action", { step: "studio", target: "/settings" });
                    writeDone("studio");
                    refresh();
                    router.push("/settings");
                },
            },
            {
                id: "teacher",
                title: "Add first teacher",
                description: "Create a teacher profile to anchor scheduling and the studio map.",
                done: readDone("teacher"),
                actionLabel: "Add teacher",
                onAction: () => {
                    trackEvent("onboarding_checklist_action", { step: "teacher", target: "/teachers" });
                    writeDone("teacher");
                    refresh();
                    router.push("/teachers");
                },
            },
            {
                id: "student",
                title: "Add first student",
                description: "Capture a learner so lifecycle, risk, and billing surfaces light up.",
                done: readDone("student"),
                actionLabel: "Add student",
                onAction: () => {
                    writeDone("student");
                    refresh();
                    router.push("/students");
                },
            },
            {
                id: "map",
                title: "Explore Studio Map",
                description: "Visualize roster load across teachers and rooms.",
                done: readDone("map"),
                actionLabel: "Open studio map",
                onAction: () => {
                    trackEvent("onboarding_checklist_action", { step: "map", target: "/studio-map" });
                    writeDone("map");
                    refresh();
                    router.push("/studio-map");
                },
            },
            {
                id: "dash",
                title: "Review Dashboard",
                description: "Return to the command surface for KPIs, quick actions, and the live feed.",
                done: readDone("dash"),
                actionLabel: "Go to dashboard",
                onAction: () => {
                    trackEvent("onboarding_checklist_action", { step: "dash", target: "/dashboard" });
                    writeDone("dash");
                    refresh();
                    router.push("/dashboard");
                },
            },
        ];
    }, [refresh, router, tick, trackEvent]);
    return (_jsx(PageShell, { children: _jsxs("div", { className: "mx-auto flex max-w-3xl flex-col gap-[var(--z-space-8)]", children: [_jsx(PageHeader, { title: "Welcome to ZiroWork", subtitle: "A founder-grade checklist to light up your studio in minutes." }), _jsx(OnboardingChecklist, { steps: steps })] }) }));
}
