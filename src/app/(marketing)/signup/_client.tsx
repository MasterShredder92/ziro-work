"use client";

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
] as const;

type PlanId = (typeof PLANS)[number]["id"];

export function SignupClient() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [email, setEmail] = React.useState("");
  const [studio, setStudio] = React.useState("");
  const [plan, setPlan] = React.useState<PlanId>("scale");

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    router.push("/onboarding");
  };

  return (
    <div className="mx-auto max-w-lg space-y-[var(--z-space-8)]">
      <PageHeader title="Create your ZiroWork workspace" subtitle="UI-only flow — wire auth when ready." />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full",
              i <= step ? "bg-[var(--z-accent)]" : "bg-[var(--z-border)]"
            )}
          />
        ))}
      </div>

      {step === 0 ? (
        <Card variant="elevated" padding="lg" radius="lg" className="border-[color-mix(in_oklab,var(--z-accent),transparent_70%)]">
          <div className="text-sm font-extrabold text-[var(--z-fg)]">Work email</div>
          <p className="mt-1 text-xs text-[var(--z-muted)]">We&apos;ll use this for receipts and alerts.</p>
          <Input
            className="mt-4"
            type="email"
            autoComplete="email"
            placeholder="you@studio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="button" className="mt-6 w-full" variant="primary" onClick={next} disabled={!email.includes("@")}>
            Continue
          </Button>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card variant="elevated" padding="lg" radius="lg" className="border-[color-mix(in_oklab,var(--z-accent),transparent_70%)]">
          <div className="text-sm font-extrabold text-[var(--z-fg)]">Studio name</div>
          <p className="mt-1 text-xs text-[var(--z-muted)]">Shown across dashboards and exports.</p>
          <Input
            className="mt-4"
            placeholder="Neon Keys Academy"
            value={studio}
            onChange={(e) => setStudio(e.target.value)}
          />
          <div className="mt-6 flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={back}>
              Back
            </Button>
            <Button type="button" variant="primary" className="flex-1" onClick={next} disabled={studio.trim().length < 2}>
              Continue
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card variant="elevated" padding="lg" radius="lg" className="border-[color-mix(in_oklab,var(--z-accent),transparent_70%)]">
          <div className="text-sm font-extrabold text-[var(--z-fg)]">Choose plan</div>
          <div className="mt-4 grid gap-2">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-[var(--z-radius-md)] border px-3 py-3 text-left text-sm transition-colors",
                  plan === p.id
                    ? "border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] text-black"
                    : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-fg)] hover:border-[var(--z-border-2)]"
                )}
              >
                <span className="font-semibold">{p.label}</span>
                <Badge variant={plan === p.id ? "success" : "neutral"} active={plan === p.id}>
                  {p.hint}
                </Badge>
              </button>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={back}>
              Back
            </Button>
            <Button type="button" variant="primary" className="flex-1" onClick={next}>
              Continue
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card variant="elevated" padding="lg" radius="lg" className="border-[color-mix(in_oklab,var(--z-accent),transparent_70%)]">
          <div className="text-sm font-extrabold text-[var(--z-fg)]">Confirm</div>
          <dl className="mt-4 space-y-2 text-sm text-[var(--z-muted)]">
            <div className="flex justify-between gap-4">
              <dt>Email</dt>
              <dd className="text-right font-medium text-[var(--z-fg)]">{email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Studio</dt>
              <dd className="text-right font-medium text-[var(--z-fg)]">{studio}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Plan</dt>
              <dd className="text-right font-medium text-[var(--z-fg)]">{plan}</dd>
            </div>
          </dl>
          <div className="mt-6 flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={back}>
              Back
            </Button>
            <Button type="button" variant="primary" className="flex-1" onClick={finish}>
              Go to onboarding
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
