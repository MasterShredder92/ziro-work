"use client";

import Link from "next/link";
import * as React from "react";
import { EmailTemplateCard } from "@/components/email/EmailTemplateCard";
import { EmailEditor } from "@/components/email/EmailEditor";
import { TransactionalPreview } from "@/components/email/TransactionalPreview";
import type { EmailTemplateModel } from "@/components/email/emailTypes";

const DEMO: EmailTemplateModel = {
  id: "sandbox",
  title: "Sandbox transactional",
  description: "Visual QA for editor + preview.",
  category: "Marketing",
  body: "Hi {{studentName}},\n\nThis is a sandbox email for {{studioName}}.",
};

export default function SandboxEmailPage() {
  const [tpl, setTpl] = React.useState(DEMO);
  const payload: Record<string, unknown> = {
    studentName: "Taylor Kim",
    studioName: "Neon Row Music",
  };

  return (
    <div className="space-y-[var(--z-space-8)]">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold">Email sandbox</h1>
        <Link className="text-xs font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-[var(--z-space-4)] lg:grid-cols-2">
        <EmailTemplateCard title={tpl.title} description={tpl.description} category={tpl.category} selected />
        <EmailEditor template={tpl} onChange={setTpl} />
      </section>

      <section className="space-y-[var(--z-space-3)]">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]">Transactional preview</h2>
        <TransactionalPreview eventType="student_enrolled" payload={payload} />
      </section>
    </div>
  );
}
