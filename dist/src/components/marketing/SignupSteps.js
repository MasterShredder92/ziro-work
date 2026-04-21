"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";
export function SignupSteps() {
    const router = useRouter();
    const { trackEvent } = useAnalytics();
    const [step, setStep] = React.useState(0);
    const [studio, setStudio] = React.useState("");
    const advance = () => {
        trackEvent("signup_flow_step", { step, studio });
        if (step >= 2) {
            trackEvent("signup_flow_complete", { studio });
            router.push("/onboarding");
            return;
        }
        setStep((s) => s + 1);
    };
    return (_jsxs("div", { className: "space-y-[var(--z-space-10)]", children: [_jsx(PageHeader, { title: "Start free trial", subtitle: "Three quick steps\u2014everything stays UI-only until backend wiring." }), _jsxs(Section, { title: `Step ${step + 1} of 3`, accent: true, spacing: "default", children: [step === 0 ? (_jsx(Input, { label: "Studio name", value: studio, onChange: (e) => setStudio(e.target.value) })) : null, step === 1 ? (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Invite teammates after provisioning\u2014placeholder step." })) : null, step === 2 ? (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Confirm plan tier (mock) and continue into onboarding." })) : null, _jsx(Button, { type: "button", variant: "primary", size: "md", className: "mt-4", onClick: advance, children: step >= 2 ? "Finish & go to onboarding" : "Continue" })] })] }));
}
