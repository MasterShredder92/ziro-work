"use client";

import Link from "next/link";
import { BookOpen, Mail, Megaphone, Workflow } from "lucide-react";
import { HubCard } from "@/components/publishing/HubCard";

export default function SandboxPublishingHubPage() {
  return (
    <div className="space-y-[var(--z-space-8)]">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold">Publishing Hub (sandbox)</h1>
        <Link className="text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>

      <p className="max-w-2xl text-sm text-[var(--z-muted)]">
        Visual QA for <code className="text-[var(--z-accent)]">HubCard</code> hover, motion-safe scale, and focus
        rings. Links point at real app routes for click-through testing.
      </p>

      <div className="grid grid-cols-1 gap-[var(--z-space-4)] md:grid-cols-2">
        <HubCard
          icon={<Mail className="h-5 w-5" />}
          title="Default variant"
          description="Standard copy length for comparison against dense text blocks in the hub."
          href="/email-templates"
        />
        <HubCard
          icon={<Workflow className="h-5 w-5" />}
          title="Dense description"
          description="This card uses a longer description to validate wrapping, min-width behavior, and icon alignment when the title and body span multiple lines in smaller viewports."
          href="/automations"
        />
        <HubCard
          icon={<Megaphone className="h-5 w-5" />}
          title="Short title"
          description="Minimal body."
          href="/announcements"
        />
        <HubCard
          icon={<BookOpen className="h-5 w-5" />}
          title="Release notes"
          description="Neon hover ring + motion-safe scale — disable animations in OS settings to verify reduced-motion."
          href="/release-notes"
        />
      </div>
    </div>
  );
}
