import type { ReactNode } from "react";
import { ScheduleShell } from "./components/ScheduleShell";

export const dynamic = "force-dynamic";

export default async function ScheduleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ScheduleShell>{children}</ScheduleShell>;
}
