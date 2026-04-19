"use client";

import Link from "next/link";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { RoleCard, type RoleCardPermission } from "@/components/settings/RoleCard";

const matrix: { role: string; permissions: RoleCardPermission[] }[] = [
  {
    role: "Owner",
    permissions: [
      { id: "p1", kind: "page", label: "Settings" },
      { id: "a1", kind: "action", label: "Manage billing" },
    ],
  },
  {
    role: "Teacher",
    permissions: [
      { id: "p2", kind: "page", label: "Students (assigned)" },
      { id: "a2", kind: "action", label: "Attendance" },
    ],
  },
];

export default function SandboxPermissionsSettingsPage() {
  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Permissions (sandbox)</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox/settings">
          Back
        </Link>
      </div>

      <SettingsSection title="Roles" description="Trimmed fixture for layout QA.">
        <div className="space-y-[var(--z-space-4)]">
          {matrix.map((m) => (
            <RoleCard key={m.role} role={m.role} permissions={m.permissions} />
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
