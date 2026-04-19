import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getSessionWithRoster } from "@/lib/attendance/service";
import { resolveAttendancePageContext } from "../../guard";
import { SessionRosterGrid } from "../../components";

export const dynamic = "force-dynamic";

type RouteParams = { sessionId: string };

export default async function SessionAttendancePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { sessionId } = await params;
  let ctx;
  try {
    ctx = await resolveAttendancePageContext();
  } catch {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        You don&apos;t have access to this session.
      </div>
    );
  }

  const data = await getSessionWithRoster(sessionId, ctx.tenantId);
  if (!data) notFound();

  await logAudit("attendance.session.view", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    role: ctx.session.role,
    sessionId,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">
          Session · {data.session_date}
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          {data.start_time?.slice(0, 5) ?? "—"} –{" "}
          {data.end_time?.slice(0, 5) ?? "—"} · status {data.status}
          {data.class_label ? ` · ${data.class_label}` : ""}
        </p>
      </header>
      <SessionRosterGrid
        session={data}
        markedBy={ctx.session.userId ?? null}
      />
    </div>
  );
}
