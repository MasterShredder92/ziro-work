import { listAssessments as listAssessmentsData, getAssessment as getAssessmentData, upsertAssessment as upsertAssessmentData, } from "@data/assessments";
import { listAssessmentQuestions as listAssessmentQuestionsData, } from "@data/assessmentQuestions";
import { listAssessmentRubric as listAssessmentRubricData, } from "@data/assessmentRubric";
import { listAssessmentAttempts as listAssessmentAttemptsData, getAssessmentAttempt as getAssessmentAttemptData, upsertAssessmentAttempt as upsertAssessmentAttemptData, } from "@data/assessmentAttempts";
export async function listAssessments(tenantId) {
    return listAssessmentsData(tenantId);
}
export async function getAssessment(assessmentId, tenantId) {
    return getAssessmentData(assessmentId, tenantId);
}
export async function listAssessmentQuestions(assessmentId, tenantId) {
    return listAssessmentQuestionsData(assessmentId, tenantId);
}
export async function listAssessmentRubric(assessmentId, tenantId) {
    return listAssessmentRubricData(assessmentId, tenantId);
}
export async function listAssessmentAttempts(filter, tenantId) {
    return listAssessmentAttemptsData(filter, tenantId);
}
export async function getAssessmentAttempt(attemptId, tenantId) {
    return getAssessmentAttemptData(attemptId, tenantId);
}
export async function createAssessment(tenantId, input) {
    return upsertAssessmentData(tenantId, input);
}
export async function updateAssessment(tenantId, input) {
    return upsertAssessmentData(tenantId, input);
}
export async function createAssessmentAttempt(tenantId, input) {
    return upsertAssessmentAttemptData(tenantId, input);
}
export async function updateAssessmentAttempt(tenantId, input) {
    return upsertAssessmentAttemptData(tenantId, input);
}
