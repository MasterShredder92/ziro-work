import type { ReactNode } from "react";
import {
  getFamilyProfile,
  resolveCurrentFamilyId,
} from "@/lib/portal/queries";
import { toFamilyDisplayProfile } from "@/lib/family/types";
import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { FamilyShell } from "./components/FamilyShell";
import { FAMILY_NAV_ITEMS } from "./components/FamilySidebar";

export default async function FamilyLayout({
  children,
}: {
  children: ReactNode;
}) {
  const familyId = await resolveCurrentFamilyId();
  const family = familyId ? await getFamilyProfile(familyId) : null;
  const profile = toFamilyDisplayProfile(family);

  const session = await getSession();
  const allowedNavIds = session
    ? FAMILY_NAV_ITEMS.filter(
        (item) => !item.scope || can(session.role, item.scope),
      ).map((item) => item.id)
    : FAMILY_NAV_ITEMS.map((item) => item.id);

  return (
    <FamilyShell profile={profile} allowedNavIds={allowedNavIds}>
      {children}
    </FamilyShell>
  );
}
