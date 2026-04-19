import {
  listAssessments as listAssessmentsData,
  getAssessment as getAssessmentData,
  upsertAssessment as upsertAssessmentData,
  type AssessmentRow,
} from "@data/assessments";
import {
  listAssessmentQuestions as listAssessmentQuestionsData,
  type AssessmentQuestionRow,
} from "@data/assessmentQuestions";
import {
  listAssessmentRubric as listAssessmentRubricData,
  type AssessmentRubricRow,
} from "@data/assessmentRubric";
import {
  listAssessmentAttempts as listAssessmentAttemptsData,
  getAssessmentAttempt as getAssessmentAttemptData,
  upsertAssessmentAttempt as upsertAssessmentAttemptData,
  type AssessmentAttemptRow,
  type AssessmentAttemptFilter,
} from "@data/assessmentAttempts";

export async function listAssessments(
  tenantId: string,
): Promise<AssessmentRow[]> {
  return listAssessmentsData(tenantId);
}

export async function getAssessment(
  assessmentId: string,
  tenantId?: string,
): Promise<AssessmentRow | null> {
  return getAssessmentData(assessmentId, tenantId);
}

export async function listAssessmentQuestions(
  assessmentId: string,
  tenantId?: string,
): Promise<AssessmentQuestionRow[]> {
  return listAssessmentQuestionsData(assessmentId, tenantId);
}

export async function listAssessmentRubric(
  assessmentId: string,
  tenantId?: string,
): Promise<AssessmentRubricRow[]> {
  return listAssessmentRubricData(assessmentId, tenantId);
}

export async function listAssessmentAttempts(
  filter: AssessmentAttemptFilter,
  tenantId?: string,
): Promise<AssessmentAttemptRow[]> {
  return listAssessmentAttemptsData(filter, tenantId);
}

export async function getAssessmentAttempt(
  attemptId: string,
  tenantId?: string,
): Promise<AssessmentAttemptRow | null> {
  return getAssessmentAttemptData(attemptId, tenantId);
}

export async function createAssessment(
  tenantId: string,
  input: Partial<AssessmentRow> & { title: string },
): Promise<AssessmentRow> {
  return upsertAssessmentData(tenantId, input);
}

export async function updateAssessment(
  tenantId: string,
  input: Partial<AssessmentRow> & { id: string },
): Promise<AssessmentRow> {
  return upsertAssessmentData(tenantId, input);
}

export async function createAssessmentAttempt(
  tenantId: string,
  input: Partial<AssessmentAttemptRow> & {
    assessment_id: string;
    student_id: string;
  },
): Promise<AssessmentAttemptRow> {
  return upsertAssessmentAttemptData(tenantId, input);
}

export async function updateAssessmentAttempt(
  tenantId: string,
  input: Partial<AssessmentAttemptRow> & {
    id: string;
    assessment_id: string;
    student_id: string;
  },
): Promise<AssessmentAttemptRow> {
  return upsertAssessmentAttemptData(tenantId, input);
}
