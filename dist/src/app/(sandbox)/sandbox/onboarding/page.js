"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
export default function SandboxOnboardingPage() {
    return (_jsx(PageShell, { children: _jsxs("div", { className: "mx-auto max-w-3xl space-y-[var(--z-space-8)]", children: [_jsx(PageHeader, { title: "Sandbox \u00B7 Onboarding checklist", subtitle: "Visual QA only \u2014 no persistence." }), _jsx(OnboardingChecklist, { steps: [
                        {
                            id: "a",
                            title: "Sample step A",
                            description: "Demonstrates completed state styling.",
                            done: true,
                            actionLabel: "Action",
                            onAction: () => { },
                        },
                        {
                            id: "b",
                            title: "Sample step B",
                            description: "Demonstrates pending state + primary action.",
                            done: false,
                            actionLabel: "Continue",
                            onAction: () => { },
                        },
                    ] })] }) }));
}
