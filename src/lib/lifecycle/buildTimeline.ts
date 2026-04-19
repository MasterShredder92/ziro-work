import { getServiceClient } from "@/lib/supabase";
import type { LifecycleStageId } from "./types";

export type TimelineItem = {
  occurredAt: string;
  type: string;
  title: string;
  payload?: Record<string, unknown>;
};

function asIso(d: Date) {
  return d.toISOString();
}

function isStageId(x: unknown): x is LifecycleStageId {
  return (
    x === "intake" ||
    x === "lead-work" ||
    x === "scheduling" ||
    x === "enrollment" ||
    x === "service-delivery" ||
    x === "relationship" ||
    x === "retention" ||
    x === "win-back"
  );
}

export async function buildTimeline(studentId: string): Promise<TimelineItem[]> {
  const supabase = getServiceClient();

  const { data: student, error: studentErr } = await supabase
    .from("students")
    .select("id,first_name,last_name,family_id,status,tenant_id,teacher_id,enrollment_date,created_at")
    .eq("id", studentId)
    .maybeSingle();
  if (studentErr) throw studentErr;
  if (!student) throw new Error(`Student not found: ${studentId}`);

  const tenantId = student.tenant_id as string;

  const [{ data: events }, { data: invoices }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("tenant_id", tenantId)
      .or(
        [
          `and(entity_type.eq.student,entity_id.eq.${studentId})`,
          `and(entity_type.eq.lifecycle,entity_id.eq.${studentId})`,
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("invoices")
      .select("id,status,amount_cents,currency,issued_at,due_at,paid_at,created_at,description")
      .eq("tenant_id", tenantId)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const items: TimelineItem[] = [];

  // Base student lifecycle anchors
  items.push({
    occurredAt: (student.created_at as string) ?? asIso(new Date()),
    type: "student_created",
    title: "Student created",
    payload: { student_id: studentId },
  });
  if (student.enrollment_date) {
    items.push({
      occurredAt: student.enrollment_date as string,
      type: "enrolled",
      title: "Enrolled",
      payload: { student_id: studentId },
    });
  }
  if (student.teacher_id) {
    items.push({
      occurredAt: asIso(new Date()),
      type: "teacher_assignment_current",
      title: "Teacher assigned (current)",
      payload: { teacher_id: student.teacher_id as string },
    });
  }

  // Events (stage transitions, agent events, system logs)
  for (const e of (events ?? []) as Record<string, unknown>[]) {
    const createdAt = (e.created_at as string | undefined) ?? asIso(new Date());
    const eventType = (e.event_type as string | undefined) ?? "event";
    const payload = (e.payload as Record<string, unknown> | null | undefined) ?? undefined;

    if (eventType === "student_stage_changed") {
      const p = payload ?? {};
      const from = "from" in p ? p.from : undefined;
      const to = "to" in p ? p.to : undefined;
      items.push({
        occurredAt: createdAt,
        type: "stage_transition",
        title: `Stage changed${isStageId(to) ? ` → ${to}` : ""}`,
        payload: { from, to },
      });
      continue;
    }

    items.push({
      occurredAt: createdAt,
      type: eventType,
      title: eventType,
      payload,
    });
  }

  // Invoices
  for (const inv of (invoices ?? []) as Record<string, unknown>[]) {
    items.push({
      occurredAt: (inv.created_at as string | undefined) ?? asIso(new Date()),
      type: "invoice",
      title: `Invoice: ${(inv.status as string | undefined) ?? "unknown"}`,
      payload: {
        id: inv.id,
        status: inv.status,
        amount_cents: inv.amount_cents,
        currency: inv.currency,
        issued_at: inv.issued_at,
        due_at: inv.due_at,
        paid_at: inv.paid_at,
        description: inv.description,
      },
    });
  }

  // Sort ascending for timeline presentation.
  items.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  return items;
}

