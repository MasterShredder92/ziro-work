// POST /api/leads/[id]/promote
// Creates a trial student from a lead record (or returns existing student if already promoted).
// Does NOT enroll — status = trial. Director converts to active when they sign up.

import { NextRequest } from "next/server";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";
import { ok, badRequest, serverError, notFound } from "@/lib/http";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { captureError } from "@/lib/errorCapture";
import { logAudit } from "@/lib/audit/log";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: leadId } = await params;
  if (!leadId) return badRequest("Missing lead id");

  const tenantId = DEFAULT_TENANT_ID;
  const supabase = await createTenantBoundSupabaseClient({ tenantId });

  // 1. Load the lead
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (leadErr) return serverError(leadErr.message);
  if (!lead) return notFound("Lead not found");

  // 2. If already promoted, return the existing student id
  if (lead.converted_student_id) {
    return ok({ studentId: lead.converted_student_id, created: false });
  }

  // 3. Resolve or create family record
  let familyId: string | null = lead.family_id ?? null;

  if (!familyId) {
    // Build a minimal family from lead contact data
    const parentName = (lead.parent_name as string | null) ?? (lead.name as string | null) ?? "";
    const [parentFirst, ...parentRest] = parentName.split(" ");
    const parentLast = parentRest.join(" ") || "";
    const studentName = (lead.student_name as string | null) ?? "";

    const { data: newFamily, error: famErr } = await supabase
      .from("families")
      .insert({
        tenant_id: tenantId,
        name: studentName || parentName || "New Family",
        parent_first_name: parentFirst || "",
        parent_last_name: parentLast || "",
        primary_email: (lead.email as string | null) ?? null,
        primary_phone: (lead.phone as string | null) ?? null,
        primary_location_id: (lead.location_id as string | null) ?? null,
        billing_status: "pending",
      })
      .select("id")
      .single();

    if (famErr || !newFamily) {
      captureError(famErr ?? new Error("Family creation failed"), { route: "/api/leads/promote", inputPayload: { leadId } });
      return serverError("Could not create family for lead");
    }
    familyId = newFamily.id;

    // Back-link the family onto the lead
    await supabase
      .from("leads")
      .update({ family_id: familyId })
      .eq("id", leadId)
      .eq("tenant_id", tenantId);
  }

  // 4. Create the trial student
  const rawFirst = (lead.first_name as string | null) ?? (lead.student_name as string | null)?.split(" ")[0] ?? "Student";
  const rawLast =
    (lead.last_name as string | null) ??
    (lead.student_name as string | null)?.split(" ").slice(1).join(" ") ?? "";

  const { data: newStudent, error: stuErr } = await supabase
    .from("students")
    .insert({
      tenant_id: tenantId,
      family_id: familyId,
      lead_id: leadId,
      first_name: rawFirst,
      last_name: rawLast,
      instrument: (lead.instrument as string | null) ?? null,
      status: "trial",
      blocks_per_week: 1,
      teacher_id: (lead.assigned_teacher_id as string | null) ?? (lead.matched_teacher_id as string | null) ?? null,
      location_id: (lead.location_id as string | null) ?? null,
      experience_level: (lead.experience as string | null) ?? null,
    })
    .select("id")
    .single();

  if (stuErr || !newStudent) {
    captureError(stuErr ?? new Error("Student creation failed"), { route: "/api/leads/promote", inputPayload: { leadId, familyId } });
    return serverError("Could not create student from lead");
  }

  // 5. Back-link converted_student_id on the lead
  const { error: updateErr } = await supabase
    .from("leads")
    .update({
      converted_student_id: newStudent.id,
      converted_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("tenant_id", tenantId);

  if (updateErr) {
    captureError(updateErr, { route: "/api/leads/promote", inputPayload: { leadId, studentId: newStudent.id } });
  }

  await logAudit("lead.promoted_to_trial_student", {
    leadId,
    studentId: newStudent.id,
    familyId,
    tenantId,
  });

  return ok({ studentId: newStudent.id, familyId, created: true });
}
