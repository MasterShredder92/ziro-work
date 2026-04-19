"use client";

import Link from "next/link";
import { List } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function SandboxListPage() {
  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">List</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>

      <List
        items={[
          {
            id: "1",
            title: "Student follow-up",
            description: "Placeholder list item with icon + action slot.",
            icon: <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--z-accent)]" />,
            action: <Badge variant="success" active>Active</Badge>,
          },
          {
            id: "2",
            title: "Invoice review",
            description: "Composes cleanly inside cards and tables.",
            icon: <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--z-warning)]" />,
            action: <Button size="sm" variant="secondary">Open</Button>,
          },
          {
            id: "3",
            title: "Teacher onboarding",
            description: "No data logic—pure UI shell.",
            icon: <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--z-danger)]" />,
            action: <Badge variant="neutral">Queued</Badge>,
          },
        ]}
      />
    </div>
  );
}

