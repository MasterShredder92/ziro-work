import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeacherById, getTeacherAvailability } from "@data/teachers";
import { getTeacherSchedule, listEnrollmentsFor } from "@/lib/crm";
import { getCRMTenantId } from "../../_tenant";
import { CRMLayout, CRMNav, KpiTile, TableShell } from "../../_components";

export const dynamic = "force-dynamic";

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = await getCRMTenantId();
  const { data: teacher } = await getTeacherById(id);
  if (!teacher) notFound();

  const [schedule, enrollments, availability] = await Promise.all([
    getTeacherSchedule(tenantId, id),
    listEnrollmentsFor(tenantId, { teacher_id: id }),
    getTeacherAvailability(id),
  ]);

  const activeEnrollments = enrollments.filter((e) => e.status === "active");
  const display =
    (teacher.display_name as string | null) ??
    `${(teacher.first_name as string | null) ?? ""} ${(teacher.last_name as string | null) ?? ""}`.trim();

  return (
    <CRMLayout
      title={display || "Teacher"}
      subtitle={`Teacher · ${(teacher.status as string | null) ?? "—"}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/messages?teacherId=${encodeURIComponent(id)}`}
            className="rounded-md bg-[var(--z-accent,#c4f036)]/10 px-3 py-1.5 text-sm font-semibold text-[var(--z-accent,#c4f036)] hover:bg-[var(--z-accent,#c4f036)]/20"
          >
            Message teacher
          </Link>
        </div>
      }
    >
      <CRMNav current="teachers" />

      <div className="grid gap-3 md:grid-cols-4">
        <KpiTile label="Active students" value={activeEnrollments.length} />
        <KpiTile label="Total enrollments" value={enrollments.length} />
        <KpiTile label="Scheduled blocks" value={schedule.length} />
        <KpiTile
          label="Availability slots"
          value={availability.data?.length ?? 0}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">Profile</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={(teacher.email as string | null) ?? null} />
            <Row label="Phone" value={(teacher.phone as string | null) ?? null} />
            <Row
              label="Instruments"
              value={
                Array.isArray(teacher.instruments)
                  ? (teacher.instruments as string[]).join(", ")
                  : null
              }
            />
            <Row
              label="Role"
              value={(teacher.teacher_role as string | null) ?? null}
            />
            <Row
              label="Hire date"
              value={(teacher.hire_date as string | null) ?? null}
            />
          </dl>
        </div>

        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">Load</h3>
          {enrollments.length === 0 ? (
            <div className="text-xs text-[#707078]">No enrollments yet.</div>
          ) : (
            <TableShell headers={["Student", "Status", "Start", "End"]}>
              {enrollments.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-[#1c1c1e] last:border-0"
                >
                  <td className="px-4 py-2 text-[#909098]">
                    <Link
                      href={`/crm/students/${e.student_id}`}
                      className="hover:text-[#c4f036]"
                    >
                      {e.student_id}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-[#909098]">{e.status}</td>
                  <td className="px-4 py-2 text-[#909098]">
                    {e.start_date ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-[#909098]">
                    {e.end_date ?? "—"}
                  </td>
                </tr>
              ))}
            </TableShell>
          )}
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[#909098]">
        Schedule (read-only)
      </h2>
      <p className="mb-3 text-xs text-[#707078]">
        {schedule.length} block{schedule.length === 1 ? "" : "s"} on file — open
        Scheduling for changes.
      </p>
      {schedule.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#1c1c1e] bg-[#0a0a0c] p-4 text-sm text-[#707078]">
          No scheduled blocks.
        </div>
      ) : (
        <TableShell headers={["Day", "Start", "End", "Status"]}>
          {schedule.map((s) => (
            <tr key={s.blockId} className="border-b border-[#1c1c1e] last:border-0">
              <td className="px-4 py-2 text-[#909098]">{s.dayOfWeek ?? "—"}</td>
              <td className="px-4 py-2 text-[#909098]">{s.startsAt ?? "—"}</td>
              <td className="px-4 py-2 text-[#909098]">{s.endsAt ?? "—"}</td>
              <td className="px-4 py-2 text-[#909098]">{s.status ?? "—"}</td>
            </tr>
          ))}
        </TableShell>
      )}
    </CRMLayout>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between border-b border-[#14141a] pb-1 last:border-0">
      <dt className="text-xs uppercase tracking-wider text-[#606068]">{label}</dt>
      <dd className="text-[#d4d4d4]">{value ?? "—"}</dd>
    </div>
  );
}
