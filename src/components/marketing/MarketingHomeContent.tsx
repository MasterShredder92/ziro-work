"use client";

import * as React from "react";
import Link from "next/link";
import { GitBranch, Map, LayoutDashboard, Sparkles, Quote } from "lucide-react";
import { HeroOrb } from "@/components/marketing/HeroOrb";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { Card } from "@/components/ui/Card";
import { cn, focusRingClassName } from "@/components/ui/utils";

const primaryCta = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-[var(--z-radius-md)] px-6 text-sm font-extrabold transition-colors",
  "bg-[var(--z-accent)] text-black hover:bg-[color-mix(in_oklab,var(--z-accent),white_10%)]",
  focusRingClassName()
);

const secondaryCta = cn(
  "inline-flex h-12 items-center justify-center gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-6 text-sm font-extrabold transition-colors",
  "bg-[var(--z-surface)] text-[var(--z-fg)] hover:border-[var(--z-border-2)] hover:bg-[color-mix(in_oklab,var(--z-surface),white_4%)]",
  focusRingClassName()
);

const testimonials = [
  {
    quote: "We finally have one spine from intake to win-back. The neon console is addictive.",
    name: "Jordan A.",
    role: "Studio director, Midwest",
  },
  {
    quote: "Studio map + risk surfaced in the same session our team actually uses.",
    name: "Sam R.",
    role: "Ops lead, coastal group",
  },
  {
    quote: "Agents feel accountable because every action has a receipt in the feed.",
    name: "Riley M.",
    role: "Founder, hybrid campuses",
  },
];

export function MarketingHomeContent() {
  return (
    <div className="space-y-[var(--z-space-20)] pb-[var(--z-space-8)]">
      <section className="grid items-center gap-[var(--z-space-12)] lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="animate-[slideUp_0.45s_ease-out_both] text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--z-accent)]">
            Public launch
          </p>
          <h1 className="animate-[slideUp_0.55s_ease-out_both] text-4xl font-extrabold tracking-tight text-[var(--z-fg)] sm:text-5xl lg:text-6xl">
            The launch-ready console for elite music studios.
          </h1>
          <p
            className="mt-[var(--z-space-4)] max-w-xl animate-[slideUp_0.65s_ease-out_both] text-lg text-[color-mix(in_oklab,var(--z-fg),transparent_35%)]"
            style={{ animationDelay: "90ms" }}
          >
            Charcoal calm, neon signal — lifecycle, billing, map, and automations in one motion system.
          </p>
          <div
            className="mt-[var(--z-space-6)] flex animate-[slideUp_0.7s_ease-out_both] flex-wrap gap-3"
            style={{ animationDelay: "140ms" }}
          >
            <Link href="/signup" className={primaryCta}>
              Start Free Trial
            </Link>
            <Link href="/demo" className={secondaryCta}>
              Try Demo
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center px-4 text-sm font-semibold text-[var(--z-accent)] underline decoration-transparent underline-offset-4 hover:decoration-[var(--z-accent)]"
            >
              See pricing
            </Link>
          </div>
        </div>
        <div className="relative flex justify-center lg:justify-end">
          <div className="absolute inset-0 -z-10 blur-3xl [background:radial-gradient(circle_at_50%_50%,color-mix(in_oklab,var(--z-accent),transparent_82%),transparent_65%)]" />
          <HeroOrb />
        </div>
      </section>

      <section className="space-y-[var(--z-space-6)]">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--z-muted)]">Platform</h2>
        <div className="grid gap-[var(--z-space-4)] md:grid-cols-2">
          <FeatureCard
            icon={<GitBranch className="h-5 w-5" aria-hidden />}
            title="Lifecycle engine"
            description="One spine from intake to win-back — every stage emits receipts your team can trust."
          />
          <FeatureCard
            icon={<Map className="h-5 w-5" aria-hidden />}
            title="Studio map"
            description="Teachers, load, and roster heat in a single surface built for stand-ups."
          />
          <FeatureCard
            icon={<LayoutDashboard className="h-5 w-5" aria-hidden />}
            title="Dashboard"
            description="KPIs, quick actions, and the live feed keep revenue and risk in the same glance."
          />
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" aria-hidden />}
            title="Automations"
            description="Agents with guardrails — human-readable steps, never black-box ops."
          />
        </div>
      </section>

      <section className="space-y-[var(--z-space-6)]">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--z-muted)]">Operators say</h2>
        <div className="grid gap-[var(--z-space-4)] md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} variant="outline" padding="md" radius="lg" className="flex flex-col">
              <Quote className="h-4 w-4 text-[var(--z-accent)]" aria-hidden />
              <p className="mt-3 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_22%)]">{t.quote}</p>
              <div className="mt-4 text-xs font-semibold text-[var(--z-fg)]">{t.name}</div>
              <div className="text-[11px] text-[var(--z-muted)]">{t.role}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-8)] text-center">
        <h2 className="text-2xl font-extrabold text-[var(--z-fg)]">Ready when your roster is.</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--z-muted)]">
          Start a free trial, or launch the interactive demo with seeded teachers, students, and invoices.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className={primaryCta}>
            Start Free Trial
          </Link>
          <Link href="/demo" className={secondaryCta}>
            Try Demo
          </Link>
        </div>
      </section>
    </div>
  );
}
