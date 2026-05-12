import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, notFound, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export type FamilyWorkspaceTeacherCard = {
  id: string;
  full_name: string;
  teacher_role: string | null;
  instruments: string[] | null;
  teaches_students: string[];
};

export type FamilyWorkspaceSummary = {
  students_active_count: number;
  student_previews: { first_name: string; last_name: string; instrument: string | null }[];
  household: {
    primary_contact_name: string | null;
    primary_phone: string | null;
    primary_email: string | null;
    city: string | null;
    state: string | null;
    address_line1: string | null;
  };
  billing: {
    balance: number;
    billing_status: string;
    autopay_enabled: boolean | null;
  };
  teachers: FamilyWorkspaceTeacherCard[];
  documents_count: number;
  timeline_event_count: number;
  notes_preview: string | null;
};

type FamilySummaryRow = {
  notes: string | null;
  billing_notes: string | null;
  balance: number;
  billing_status: string;
  autopay_enabled: boolean | null;
  primary_contact_name: string | null;
  primary_phone: string | null;
  primary_email: string | null;
  city: string | null;
  state: string | null;
  address_line1: string | null;
};

/* ── GET /api/crm/families/[id]/workspace-summary ───────────
   Aggregated counts + short strings for family hub module cards.
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "family",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id: familyId } = await ctx.params;
    const { tenantId } = resolved.context;
    const supabase = getServiceClient();

    const { data: famData, error: famErr } = await supabase
      .from("families")
      .select(
        "id, balance, billing_status, autopay_enabled, primary_contact_name, primary_phone, primary_email, " +
          "city, state, address_line1, notes, billing_notes"
      )
      .eq("id", familyId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (famErr) return serverError(famErr);
    if (!famData) return notFound();
    const famRow = famData as unknown as FamilySummaryRow;

    const { data: activeStudents, error: stErr } = await supabase
      .from("students")
      .select("id, first_name, last_name, instrument, teacher_id")
      .eq("family_id", familyId)
      .eq("tenant_id", tenantId)
      .eq("status", "active");
    if (stErr) return serverError(stErr);
    const students = activeStudents ?? [];
    const studentIds = students.map((s: { id: string }) => s.id);

    const student_previews = students.slice(0, 5).map((s: { first_name: string; last_name: string; instrument: string | null }) => ({
      first_name: s.first_name,
      last_name: s.last_name,
      instrument: s.instrument,
    }));

    const teacherIds = [...new Set(students.map((s: { teacher_id: string | null }) => s.teacher_id).filter(Boolean))] as string[];

    let teachers: FamilyWorkspaceTeacherCard[] = [];
    if (teacherIds.length > 0) {
      const { data: teacherRows, error: tErr } = await supabase
        .from("teachers")
        .select(
          "id, first_name, last_name, display_name, teacher_role, instruments"
        )
        .in("id", teacherIds)
        .eq("tenant_id", tenantId);
      if (tErr) return serverError(tErr);

      const teacherStudentMap: Record<string, string[]> = {};
      for (const student of students) {
        const tid = student.teacher_id as string | null;
        if (!tid) continue;
        if (!teacherStudentMap[tid]) teacherStudentMap[tid] = [];
        const name = [student.first_name, student.last_name].filter(Boolean).join(" ");
        if (name) teacherStudentMap[tid].push(name);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      teachers = ((teacherRows ?? []) as any[]).map((t: any) => ({
        id: t.id,
        full_name: t.display_name ?? [t.first_name, t.last_name].filter(Boolean).join(" ") ?? "Unknown Teacher",
        teacher_role: t.teacher_role ?? "Music Teacher",
        instruments: t.instruments ?? [],
        teaches_students: teacherStudentMap[t.id] ?? [],
      }));
    }

    const { count: docCount, error: docErr } = await supabase
      .from("family_files")
      .select("id", { count: "exact", head: true })
      .eq("family_id", familyId)
      .eq("tenant_id", tenantId);
    if (docErr) return serverError(docErr);

    let timeline_event_count = 0;
    const { count: famAct, error: faErr } = await supabase
      .from("activity_log")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("entity_type", "family")
      .eq("entity_id", familyId);
    if (faErr) return serverError(faErr);
    timeline_event_count += famAct ?? 0;

    if (studentIds.length > 0) {
      const { count: stAct, error: saErr } = await supabase
        .from("activity_log")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("entity_type", "student")
        .in("entity_id", studentIds);
      if (saErr) return serverError(saErr);
      timeline_event_count += stAct ?? 0;
    }

    const notesParts = [famRow.notes, famRow.billing_notes].filter((x): x is string => typeof x === "string" && x.trim().length > 0);
    const notesJoined = notesParts.join("\n\n").trim();
    const notes_preview =
      notesJoined.length > 0 ? (notesJoined.length > 160 ? `${notesJoined.slice(0, 157)}…` : notesJoined) : null;

    const payload: FamilyWorkspaceSummary = {
      students_active_count: students.length,
      student_previews,
      household: {
        primary_contact_name: famRow.primary_contact_name ?? null,
        primary_phone: famRow.primary_phone ?? null,
        primary_email: famRow.primary_email ?? null,
        city: famRow.city ?? null,
        state: famRow.state ?? null,
        address_line1: famRow.address_line1 ?? null,
      },
      billing: {
        balance: typeof famRow.balance === "number" ? famRow.balance : 0,
        billing_status: famRow.billing_status ?? "unknown",
        autopay_enabled: famRow.autopay_enabled ?? null,
      },
      teachers,
      documents_count: docCount ?? 0,
      timeline_event_count,
      notes_preview,
    };

    return ok({ data: payload });
  } catch (err) {
    return serverError(err);
  }
}
