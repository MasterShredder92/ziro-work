import { convertLeadToStudent, createLead, getLeadById, updateLead, } from "@data/leads";
import { createIntakeSubmission } from "@data/intakeSubmissions";
import { createStudent } from "@data/students";
import { createStudentFollowup, markStudentFollowupSent, } from "@data/studentFollowups";
export async function ingestIntake(input) {
    var _a, _b, _c;
    const submissionInput = {
        raw_payload: input.raw,
        source: (_a = input.source) !== null && _a !== void 0 ? _a : "web",
        form_version: (_b = input.formVersion) !== null && _b !== void 0 ? _b : "v1",
        location_id: (_c = input.locationId) !== null && _c !== void 0 ? _c : null,
        lead_ids: [],
    };
    const submission = await createIntakeSubmission(input.tenantId, submissionInput);
    const leads = [];
    for (const l of input.leads) {
        const lead = await createLead(input.tenantId, Object.assign(Object.assign({}, l), { intake_submission_id: submission.id }));
        leads.push(lead);
    }
    if (leads.length > 0) {
        await updateLeadSubmissionLink(input.tenantId, submission.id, leads.map((x) => x.id));
    }
    return { submissionId: submission.id, leads };
}
async function updateLeadSubmissionLink(tenantId, submissionId, leadIds) {
    const { clientFor } = await import("@data/_client");
    const supabase = clientFor(tenantId);
    await supabase
        .from("intake_submissions")
        .update({ lead_ids: leadIds })
        .eq("tenant_id", tenantId)
        .eq("id", submissionId);
}
export async function convertLead(input) {
    var _a, _b, _c, _d, _e, _f;
    const lead = await getLeadById(input.leadId, input.tenantId);
    if (!lead)
        throw new Error(`Lead ${input.leadId} not found`);
    const student = await createStudent(input.tenantId, Object.assign(Object.assign({}, input.student), { intake_submission_id: (_b = (_a = input.student.intake_submission_id) !== null && _a !== void 0 ? _a : lead.intake_submission_id) !== null && _b !== void 0 ? _b : null, family_id: (_d = (_c = input.student.family_id) !== null && _c !== void 0 ? _c : lead.family_id) !== null && _d !== void 0 ? _d : null, source: (_f = (_e = input.student.source) !== null && _e !== void 0 ? _e : lead.source) !== null && _f !== void 0 ? _f : null }));
    const updated = await convertLeadToStudent(input.leadId, student.id, input.tenantId);
    return { lead: updated, studentId: student.id };
}
export async function markLeadLost(tenantId, leadId, reason, category) {
    return updateLead(leadId, tenantId, {
        stage: "lost",
        lost_reason: reason,
        lost_category: category !== null && category !== void 0 ? category : null,
    });
}
export async function logFollowup(args) {
    var _a, _b, _c, _d;
    return createStudentFollowup(args.tenantId, {
        student_id: args.studentId,
        family_id: args.familyId,
        followup_date: args.followupDate,
        reason: (_a = args.reason) !== null && _a !== void 0 ? _a : null,
        notes: (_b = args.notes) !== null && _b !== void 0 ? _b : null,
        ai_draft: (_c = args.aiDraft) !== null && _c !== void 0 ? _c : null,
        created_by: (_d = args.createdBy) !== null && _d !== void 0 ? _d : null,
        status: "queued",
    });
}
export async function sendFollowup(tenantId, followupId, sentBy) {
    return markStudentFollowupSent(followupId, tenantId, sentBy);
}
export async function promoteLeadToStudent(leadId, tenantId) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const lead = await getLeadById(leadId, tenantId);
    if (!lead)
        throw new Error(`Lead ${leadId} not found`);
    if (lead.converted_student_id) {
        return { leadId: lead.id, studentId: lead.converted_student_id };
    }
    const studentInput = {
        first_name: lead.first_name || "Unknown",
        last_name: (_a = lead.last_name) !== null && _a !== void 0 ? _a : "",
        email: (_b = lead.email) !== null && _b !== void 0 ? _b : null,
        phone: (_c = lead.phone) !== null && _c !== void 0 ? _c : null,
        family_id: (_d = lead.family_id) !== null && _d !== void 0 ? _d : null,
        location_id: (_e = lead.location_id) !== null && _e !== void 0 ? _e : null,
        instrument: (_f = lead.instrument) !== null && _f !== void 0 ? _f : null,
        source: (_g = lead.source) !== null && _g !== void 0 ? _g : null,
        intake_submission_id: (_h = lead.intake_submission_id) !== null && _h !== void 0 ? _h : null,
        status: "enrolled",
    };
    const student = await createStudent(tenantId, studentInput);
    await convertLeadToStudent(lead.id, student.id, tenantId);
    return { leadId: lead.id, studentId: student.id };
}
export async function scheduleFollowup(leadId, when, tenantId) {
    const lead = await getLeadById(leadId, tenantId);
    if (!lead)
        throw new Error(`Lead ${leadId} not found`);
    if (!lead.converted_student_id) {
        throw new Error(`Lead ${leadId} has no converted_student_id; promote lead before scheduling followup.`);
    }
    if (!lead.family_id) {
        throw new Error(`Lead ${leadId} has no family_id; cannot schedule followup.`);
    }
    return createStudentFollowup(tenantId, {
        student_id: lead.converted_student_id,
        family_id: lead.family_id,
        followup_date: when,
        status: "queued",
    });
}
