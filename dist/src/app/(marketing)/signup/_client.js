"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils";
const PLANS = [
    { id: "launch", label: "Launch", hint: "Solo director" },
    { id: "scale", label: "Scale", hint: "Growing faculty" },
    { id: "command", label: "Command", hint: "Multi-site" },
];
export function SignupClient() {
    const router = useRouter();
    const [step, setStep] = React.useState(0);
    const [email, setEmail] = React.useState("");
    const [studio, setStudio] = React.useState("");
    const [plan, setPlan] = React.useState("scale");
    const next = () => setStep((s) => Math.min(3, s + 1));
    const back = () => setStep((s) => Math.max(0, s - 1));
    const finish = () => {
        router.push("/onboarding");
    };
    return (_jsxs("div", { className: "mx-auto max-w-lg space-y-[var(--z-space-8)]", children: [_jsx(PageHeader, { title: "Create your ZiroWork workspace", subtitle: "UI-only flow \u2014 wire auth when ready." }), _jsx("div", { className: "flex gap-2", children: [0, 1, 2, 3].map((i) => (_jsx("div", { className: cn("h-1 flex-1 rounded-full", i <= step ? "bg-[var(--z-accent)]" : "bg-[var(--z-border)]") }, i))) }), step === 0 ? (_jsxs(Card, { variant: "elevated", padding: "lg", radius: "lg", className: "border-[color-mix(in_oklab,var(--z-accent),transparent_70%)]", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: "Work email" }), _jsx("p", { className: "mt-1 text-xs text-[var(--z-muted)]", children: "We'll use this for receipts and alerts." }), _jsx(Input, { className: "mt-4", type: "email", autoComplete: "email", placeholder: "you@studio.com", value: email, onChange: (e) => setEmail(e.target.value) }), _jsx(Button, { type: "button", className: "mt-6 w-full", variant: "primary", onClick: next, disabled: !email.includes("@"), children: "Continue" })] })) : null, step === 1 ? (_jsxs(Card, { variant: "elevated", padding: "lg", radius: "lg", className: "border-[color-mix(in_oklab,var(--z-accent),transparent_70%)]", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: "Studio name" }), _jsx("p", { className: "mt-1 text-xs text-[var(--z-muted)]", children: "Shown across dashboards and exports." }), _jsx(Input, { className: "mt-4", placeholder: "Neon Keys Academy", value: studio, onChange: (e) => setStudio(e.target.value) }), _jsxs("div", { className: "mt-6 flex gap-2", children: [_jsx(Button, { type: "button", variant: "ghost", className: "flex-1", onClick: back, children: "Back" }), _jsx(Button, { type: "button", variant: "primary", className: "flex-1", onClick: next, disabled: studio.trim().length < 2, children: "Continue" })] })] })) : null, step === 2 ? (_jsxs(Card, { variant: "elevated", padding: "lg", radius: "lg", className: "border-[color-mix(in_oklab,var(--z-accent),transparent_70%)]", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: "Choose plan" }), _jsx("div", { className: "mt-4 grid gap-2", children: PLANS.map((p) => (_jsxs("button", { type: "button", onClick: () => setPlan(p.id), className: cn("flex w-full items-center justify-between rounded-[var(--z-radius-md)] border px-3 py-3 text-left text-sm transition-colors", plan === p.id
                                ? "border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] text-black"
                                : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-fg)] hover:border-[var(--z-border-2)]"), children: [_jsx("span", { className: "font-semibold", children: p.label }), _jsx(Badge, { variant: plan === p.id ? "success" : "neutral", active: plan === p.id, children: p.hint })] }, p.id))) }), _jsxs("div", { className: "mt-6 flex gap-2", children: [_jsx(Button, { type: "button", variant: "ghost", className: "flex-1", onClick: back, children: "Back" }), _jsx(Button, { type: "button", variant: "primary", className: "flex-1", onClick: next, children: "Continue" })] })] })) : null, step === 3 ? (_jsxs(Card, { variant: "elevated", padding: "lg", radius: "lg", className: "border-[color-mix(in_oklab,var(--z-accent),transparent_70%)]", children: [_jsx("div", { className: "text-sm font-extrabold text-[var(--z-fg)]", children: "Confirm" }), _jsxs("dl", { className: "mt-4 space-y-2 text-sm text-[var(--z-muted)]", children: [_jsxs("div", { className: "flex justify-between gap-4", children: [_jsx("dt", { children: "Email" }), _jsx("dd", { className: "text-right font-medium text-[var(--z-fg)]", children: email })] }), _jsxs("div", { className: "flex justify-between gap-4", children: [_jsx("dt", { children: "Studio" }), _jsx("dd", { className: "text-right font-medium text-[var(--z-fg)]", children: studio })] }), _jsxs("div", { className: "flex justify-between gap-4", children: [_jsx("dt", { children: "Plan" }), _jsx("dd", { className: "text-right font-medium text-[var(--z-fg)]", children: plan })] })] }), _jsxs("div", { className: "mt-6 flex gap-2", children: [_jsx(Button, { type: "button", variant: "ghost", className: "flex-1", onClick: back, children: "Back" }), _jsx(Button, { type: "button", variant: "primary", className: "flex-1", onClick: finish, children: "Go to onboarding" })] })] })) : null] }));
}
