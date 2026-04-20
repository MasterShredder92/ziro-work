/* eslint-disable react-hooks/error-boundaries */
import { redirect } from "next/navigation";
import { listSchedules } from "@/lib/scheduling/schedulingOps";
import { SchedulingShellWrapper } from "./_wrapper";
import { resolveSchedulingContext } from "./guard";

export const dynamic = "force-dynamic";

export default async function SchedulingPage() {
  try {
    const ctx = await resolveSchedulingContext();
    const schedules = await listSchedules(ctx.tenantId);
    return <SchedulingShellWrapper initialSchedules={schedules} />;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHENTICATED") {
        redirect("/login?next=/scheduling");
      }
      if (error.message === "FORBIDDEN") {
        redirect("/dashboard");
      }
    }
    throw error;
  }
}
