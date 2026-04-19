import type { ReactNode } from "react";
import { resolveTeacherContext } from "./guard";
import { toTeacherDisplayProfile } from "@/lib/teacher/types";
import { can } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { TEACHER_NAV_ITEMS, TeacherShell } from "./components/TeacherShell";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  let profile = null;
  try {
    const ctx = await resolveTeacherContext();
    profile = toTeacherDisplayProfile(ctx.teacher);
  } catch {
    profile = null;
  }

  const session = await getSession();
  const allowedNavIds: string[] = session
    ? TEACHER_NAV_ITEMS.filter(
        (item) => !item.scope || can(session.role, item.scope),
      ).map((item) => item.id)
    : TEACHER_NAV_ITEMS.map((item) => item.id);

  return (
    <TeacherShell profile={profile} allowedNavIds={allowedNavIds}>
      {children}
    </TeacherShell>
  );
}
