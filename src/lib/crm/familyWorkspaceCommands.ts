import type { CommandDef } from "@/components/command/commandPaletteTypes";

/** UUID after /crm/families/ */
export function parseFamilyIdFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const m = pathname.match(/^\/crm\/families\/([0-9a-f-]{36})/i);
  return m?.[1] ?? null;
}

const FAMILY_TAB_IDS = [
  ["overview", "Students"],
  ["household", "Household"],
  ["teachers", "Teachers"],
  ["billing", "Billing"],
  ["documents", "Documents"],
  ["notes", "Notes"],
  ["timeline", "Timeline"],
] as const;

/** Commands prepended when the user is on a family workspace URL. */
export function buildFamilyWorkspaceCommands(familyId: string): CommandDef[] {
  const tabs: CommandDef[] = FAMILY_TAB_IDS.map(([id, label]) => ({
    id: `fam-tab-${id}`,
    label: `This family · ${label}`,
    kind: "nav" as const,
    href: `/crm/families/${familyId}?tab=${id}`,
    haystack: `family tab ${label} workspace section ${id}`,
  }));

  return [
    {
      id: "fam-mission",
      label: "Families · Mission control",
      kind: "nav",
      href: "/crm/families",
      haystack: "all families list roster table crm dashboard",
    },
    ...tabs,
    {
      id: "fam-add-student",
      label: "Add student to this family",
      kind: "action",
      actionId: "familyAddStudent",
      haystack: "new student enroll child learner register add",
    },
  ];
}
