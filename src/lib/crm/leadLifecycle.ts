import {
  convertLeadToStudent,
  createLead,
  getLeadById,
  updateLead,
} from "@data/leads";
import { createIntakeSubmission } from "@data/intakeSubmissions";
import { createStudent } from "@data/students";
import {
  createStudentFollowup,
  markStudentFollowupSent,
} from "@data/studentFollowups";
import type {
  IntakeSubmissionInsert,
  Lead,
  LeadInsert,
  StudentFollowup,
  StudentInsert,
  Json,
} from "@/lib/types/entities";

export type IntakeIngestInput = {
  tenantId: string;
  raw: Json;
  source?: string;
  formVersion?: string;
  locationId?: string | null;
  leads: Array<
    Omit<LeadInsert, "tenant_id" | "intake_submission_id"> & {
      first_name: string;
    }
  >;
};

export type IntakeIngestResult = {
  submissionId: string;
  leads: Lead[];
};

export async function ingestIntake(
  input: IntakeIngestInput,
): Promise<IntakeIngestResult> {
  const submissionInput: Omit<IntakeSubmissionInsert, "tenant_id"> = {
    raw_payload: input.raw,
    source: input.source ?? "web",
    form_version: input.formVersion ?? "v1",
    location_id: input.locationId ?? null,
    lead_ids: [],
  };

  const submission = await createIntakeSubmission(input.tenantId, submissionInput);

  const leads: Lead[] = [];
  for (const l of input.leads) {
    const lead = await createLead(input.tenantId, {
      ...l,
      intake_submission_id: submission.id,
    });
    leads.push(lead);
  }

  if (leads.length > 0) {
    await updateLeadSubmissionLink(
      input.tenantId,
      submission.id,
      leads.map((x) => x.id),
    );
  }

  return { submissionId: submission.id, leads };
}

async function updateLeadSubmissionLink(
  tenantId: string,
  submissionId: string,
  leadIds: string[],
): Promise<void> {
  const { clientFor } = await import("@data/_client");
  const supabase = await clientFor(tenantId);
  await supabase
    .from("intake_submissions")
    .update({ lead_ids: leadIds })
    .eq("tenant_id", tenantId)
    .eq("id", submissionId);
}

export type ConvertLeadToStudentInput = {
  tenantId: string;
  leadId: string;
  student: Omit<StudentInsert, "tenant_id">;
};

export async function convertLead(input: ConvertLeadToStudentInput): Promise<{
  lead: Lead;
  studentId: string;
}> {
  const lead = await getLeadById(input.leadId, input.tenantId);
  if (!lead) throw new Error(`Lead ${input.leadId} not found`);

  const student = await createStudent(input.tenantId, {
    ...input.student,
    intake_submission_id:
      input.student.intake_submission_id ?? lead.intake_submission_id ?? null,
    family_id: input.student.family_id ?? lead.family_id ?? null,
    source: input.student.source ?? lead.source ?? null,
  });

  const updated = await convertLeadToStudent(
    input.leadId,
    student.id,
    input.tenantId,
  );

  return { lead: updated, studentId: student.id };
}

export async function markLeadLost(
  tenantId: string,
  leadId: string,
  reason: string,
  category?: string,
): Promise<Lead> {
  return updateLead(leadId, tenantId, {
    stage: "lost",
    lost_reason: reason,
    lost_category: category ?? null,
  });
}

export async function logFollowup(args: {
  tenantId: string;
  studentId: string;
  familyId: string;
  followupDate: string;
  reason?: string;
  notes?: string;
  aiDraft?: string;
  createdBy?: string;
}) {
  return createStudentFollowup(args.tenantId, {
    student_id: args.studentId,
    family_id: args.familyId,
    followup_date: args.followupDate,
    reason: args.reason ?? null,
    notes: args.notes ?? null,
    ai_draft: args.aiDraft ?? null,
    created_by: args.createdBy ?? null,
    status: "queued",
  });
}

export async function sendFollowup(
  tenantId: string,
  followupId: string,
  sentBy: string,
) {
  return markStudentFollowupSent(followupId, tenantId, sentBy);
}

export async function promoteLeadToStudent(
  leadId: string,
  tenantId: string,
): Promise<{ leadId: string; studentId: string }> {
  const lead = await getLeadById(leadId, tenantId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);
  if (lead.converted_student_id) {
    return { leadId: lead.id, studentId: lead.converted_student_id };
  }

  const studentInput: Record<string, unknown> = {
    first_name: lead.first_name || "Unknown",
    last_name: lead.last_name ?? "",
    email: lead.email ?? null,
    phone: lead.phone ?? null,
    family_id: lead.family_id ?? null,
    location_id: lead.location_id ?? null,
    instrument: lead.instrument ?? null,
    source: lead.source ?? null,
    intake_submission_id: lead.intake_submission_id ?? null,
    status: "active",
  };

  const student = await createStudent(tenantId, studentInput);
  await convertLeadToStudent(lead.id, student.id, tenantId);

  return { leadId: lead.id, studentId: student.id };
}

export async function scheduleFollowup(
  leadId: string,
  when: string,
  tenantId: string,
): Promise<StudentFollowup> {
  const lead = await getLeadById(leadId, tenantId);
  if (!lead) throw new Error(`Lead ${leadId} not found`);
  if (!lead.converted_student_id) {
    throw new Error(
      `Lead ${leadId} has no converted_student_id; promote lead before scheduling followup.`,
    );
  }
  if (!lead.family_id) {
    throw new Error(
      `Lead ${leadId} has no family_id; cannot schedule followup.`,
    );
  }

  return createStudentFollowup(tenantId, {
    student_id: lead.converted_student_id,
    family_id: lead.family_id,
    followup_date: when,
    status: "queued",
  });
}
