import type {
  AssessmentRow,
  AssessmentKind,
  AssessmentStatus,
  AssessmentSectionDef,
} from "@data/assessments";
import type {
  AssessmentQuestionRow,
  QuestionKind,
  QuestionOption,
} from "@data/assessmentQuestions";
import type {
  AssessmentRubricRow,
  RubricLevelDef,
} from "@data/assessmentRubric";
import type {
  AssessmentAttemptRow,
  AttemptAnswer,
  AttemptStatus,
} from "@data/assessmentAttempts";

export type Assessment = AssessmentRow;
export type AssessmentSection = AssessmentSectionDef;
export type AssessmentQuestion = AssessmentQuestionRow;
export type AssessmentRubric = AssessmentRubricRow;
export type AssessmentAttempt = AssessmentAttemptRow;
export type AssessmentAnswer = AttemptAnswer;

export type {
  AssessmentKind,
  AssessmentStatus,
  QuestionKind,
  QuestionOption,
  RubricLevelDef,
  AttemptStatus,
};

export type AssessmentScore = {
  attemptId: string;
  assessmentId: string;
  studentId: string;
  totalScore: number;
  maxScore: number;
  percent: number;
  passed: boolean;
  rubricTotals: Record<string, number>;
  autoScoredCount: number;
  manualPendingCount: number;
  gradedAt: string | null;
};

export type AssessmentKpis = {
  totalAssessments: number;
  publishedCount: number;
  draftCount: number;
  totalAttempts: number;
  completedAttempts: number;
  averageScorePct: number;
  completionRatePct: number;
  passRatePct: number;
  masteryDistribution: {
    mastered: number;
    developing: number;
    needsSupport: number;
    notAttempted: number;
  };
  rubricAlignmentPct: number;
  difficultyIndex: {
    intro: number;
    core: number;
    advanced: number;
  };
};

export type AssessmentSummary = {
  assessment: Assessment;
  questionCount: number;
  rubricCount: number;
  attemptCount: number;
  averageScorePct: number | null;
  lastAttemptAt: string | null;
};

export type AssessmentDashboardData = {
  tenantId: string;
  generatedAt: string;
  assessments: AssessmentSummary[];
  kpis: AssessmentKpis;
};

export type AssessmentSurface = {
  tenantId: string;
  assessment: Assessment;
  questions: AssessmentQuestion[];
  rubric: AssessmentRubric[];
  attempts: AssessmentAttempt[];
  kpis: AssessmentKpis;
  generatedAt: string;
};

export type StudentAssessmentSummary = {
  studentId: string;
  tenantId: string;
  generatedAt: string;
  attempts: AssessmentAttempt[];
  totals: {
    totalAttempts: number;
    completed: number;
    graded: number;
    averageScorePct: number;
    passRatePct: number;
  };
  byAssessment: Array<{
    assessmentId: string;
    latestAttempt: AssessmentAttempt;
    attemptsCount: number;
    bestScorePct: number | null;
  }>;
};

export type AssessmentAttemptSurface = {
  tenantId: string;
  attempt: AssessmentAttempt;
  assessment: Assessment | null;
  questions: AssessmentQuestion[];
  rubric: AssessmentRubric[];
  score: AssessmentScore;
  generatedAt: string;
};
