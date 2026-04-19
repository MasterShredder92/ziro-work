import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import {
  createAssessmentAttempt,
  getAssessment,
  getAssessmentAttempt,
  listAssessmentAttempts,
  listAssessmentQuestions,
  listAssessmentRubric,
  listAssessments,
  updateAssessmentAttempt,
} from "./queries";
import type {
  Assessment,
  AssessmentAnswer,
  AssessmentAttempt,
  AssessmentAttemptSurface,
  AssessmentDashboardData,
  AssessmentKpis,
  AssessmentQuestion,
  AssessmentRubric,
  AssessmentScore,
  AssessmentSummary,
  AssessmentSurface,
  StudentAssessmentSummary,
} from "./types";

const MASTERY_THRESHOLD = 85;
const DEVELOPING_THRESHOLD = 65;

function emptyKpis(): AssessmentKpis {
  return {
    totalAssessments: 0,
    publishedCount: 0,
    draftCount: 0,
    totalAttempts: 0,
    completedAttempts: 0,
    averageScorePct: 0,
    completionRatePct: 0,
    passRatePct: 0,
    masteryDistribution: {
      mastered: 0,
      developing: 0,
      needsSupport: 0,
      notAttempted: 0,
    },
    rubricAlignmentPct: 0,
    difficultyIndex: { intro: 0, core: 0, advanced: 0 },
  };
}

function percent(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}

function computeScore(
  attempt: AssessmentAttempt,
  assessment: Assessment | null,
  questions: AssessmentQuestion[],
): AssessmentScore {
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  let total = 0;
  let max = 0;
  let autoCount = 0;
  let manualPending = 0;
  const rubricTotals: Record<string, number> = { ...attempt.rubric_totals };

  for (const ans of attempt.answers) {
    const q = questionMap.get(ans.question_id);
    const points = q?.points ?? 0;
    max += points;

    if (typeof ans.manual_score === "number") {
      total += ans.manual_score;
    } else if (typeof ans.auto_score === "number") {
      total += ans.auto_score;
      autoCount += 1;
    } else if (q && (q.kind === "short_answer" || q.kind === "long_answer" || q.kind === "rubric" || q.kind === "performance")) {
      manualPending += 1;
    } else if (q && ans.is_correct === true) {
      total += points;
      autoCount += 1;
    }

    if (ans.rubric_scores) {
      for (const [cid, val] of Object.entries(ans.rubric_scores)) {
        rubricTotals[cid] = (rubricTotals[cid] ?? 0) + val;
      }
    }
  }

  const assessmentMax = assessment?.total_points ?? max;
  const effectiveMax = attempt.max_score ?? assessmentMax ?? max;
  const effectiveTotal = attempt.score ?? total;
  const passing = assessment?.passing_score ?? null;
  const passed =
    attempt.passed ??
    (passing != null && effectiveMax > 0
      ? (effectiveTotal / effectiveMax) * 100 >= passing
      : effectiveTotal >= (effectiveMax * 0.7 || 0));

  return {
    attemptId: attempt.id,
    assessmentId: attempt.assessment_id,
    studentId: attempt.student_id,
    totalScore: effectiveTotal,
    maxScore: effectiveMax,
    percent: effectiveMax > 0 ? Math.round((effectiveTotal / effectiveMax) * 100) : 0,
    passed,
    rubricTotals,
    autoScoredCount: autoCount,
    manualPendingCount: manualPending,
    gradedAt: attempt.graded_at,
  };
}

function kpisFor(
  assessments: Assessment[],
  attemptsByAssessment: Map<string, AssessmentAttempt[]>,
  questionsByAssessment: Map<string, AssessmentQuestion[]>,
  rubricByAssessment: Map<string, AssessmentRubric[]>,
): AssessmentKpis {
  const kpis = emptyKpis();
  kpis.totalAssessments = assessments.length;

  let totalAttempts = 0;
  let completedAttempts = 0;
  let passCount = 0;
  let scoreSumPct = 0;
  let scoreSamples = 0;
  let rubricLinked = 0;
  let rubricEligible = 0;
  let totalQuestions = 0;
  let intro = 0;
  let core = 0;
  let advanced = 0;

  for (const a of assessments) {
    if (a.status === "published") kpis.publishedCount += 1;
    if (a.status === "draft") kpis.draftCount += 1;

    const questions = questionsByAssessment.get(a.id) ?? [];
    const rubric = rubricByAssessment.get(a.id) ?? [];
    totalQuestions += questions.length;
    for (const q of questions) {
      if (q.rubric_criterion_id) rubricLinked += 1;
      if (q.difficulty === "intro") intro += 1;
      else if (q.difficulty === "advanced") advanced += 1;
      else core += 1;
    }
    if (rubric.length > 0) rubricEligible += questions.length;

    const attempts = attemptsByAssessment.get(a.id) ?? [];
    totalAttempts += attempts.length;
    for (const att of attempts) {
      if (att.status === "submitted" || att.status === "graded" || att.status === "returned") {
        completedAttempts += 1;
      }
      const score = computeScore(att, a, questions);
      if (score.maxScore > 0 && (att.status === "graded" || att.status === "returned" || att.status === "submitted")) {
        scoreSumPct += score.percent;
        scoreSamples += 1;
        if (score.passed) passCount += 1;
        if (score.percent >= MASTERY_THRESHOLD) kpis.masteryDistribution.mastered += 1;
        else if (score.percent >= DEVELOPING_THRESHOLD) kpis.masteryDistribution.developing += 1;
        else kpis.masteryDistribution.needsSupport += 1;
      }
    }
    if (attempts.length === 0) kpis.masteryDistribution.notAttempted += 1;
  }

  kpis.totalAttempts = totalAttempts;
  kpis.completedAttempts = completedAttempts;
  kpis.averageScorePct = scoreSamples > 0 ? Math.round(scoreSumPct / scoreSamples) : 0;
  kpis.completionRatePct = percent(completedAttempts, totalAttempts);
  kpis.passRatePct = percent(passCount, Math.max(scoreSamples, 1));
  kpis.rubricAlignmentPct = percent(rubricLinked, Math.max(rubricEligible || totalQuestions, 1));
  kpis.difficultyIndex = {
    intro: percent(intro, Math.max(totalQuestions, 1)),
    core: percent(core, Math.max(totalQuestions, 1)),
    advanced: percent(advanced, Math.max(totalQuestions, 1)),
  };

  return kpis;
}

export async function getAssessmentDashboard(
  tenantId: string,
): Promise<AssessmentDashboardData> {
  await assertTenantAccess(tenantId);

  const assessments = await listAssessments(tenantId);

  const questionsByAssessment = new Map<string, AssessmentQuestion[]>();
  const rubricByAssessment = new Map<string, AssessmentRubric[]>();
  const attemptsByAssessment = new Map<string, AssessmentAttempt[]>();

  await Promise.all(
    assessments.map(async (a) => {
      const [q, r, att] = await Promise.all([
        listAssessmentQuestions(a.id, tenantId),
        listAssessmentRubric(a.id, tenantId),
        listAssessmentAttempts({ assessment_id: a.id }, tenantId),
      ]);
      questionsByAssessment.set(a.id, q);
      rubricByAssessment.set(a.id, r);
      attemptsByAssessment.set(a.id, att);
    }),
  );

  const summaries: AssessmentSummary[] = assessments.map((a) => {
    const attempts = attemptsByAssessment.get(a.id) ?? [];
    const questions = questionsByAssessment.get(a.id) ?? [];
    const rubric = rubricByAssessment.get(a.id) ?? [];
    let sum = 0;
    let samples = 0;
    let lastAttemptAt: string | null = null;
    for (const att of attempts) {
      const score = computeScore(att, a, questions);
      if (score.maxScore > 0 && (att.status === "graded" || att.status === "returned" || att.status === "submitted")) {
        sum += score.percent;
        samples += 1;
      }
      if (!lastAttemptAt || att.updated_at > lastAttemptAt) lastAttemptAt = att.updated_at;
    }
    return {
      assessment: a,
      questionCount: questions.length,
      rubricCount: rubric.length,
      attemptCount: attempts.length,
      averageScorePct: samples > 0 ? Math.round(sum / samples) : null,
      lastAttemptAt,
    };
  });

  const kpis = kpisFor(assessments, attemptsByAssessment, questionsByAssessment, rubricByAssessment);

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    assessments: summaries,
    kpis,
  };
}

export async function getAssessmentSurface(
  assessmentId: string,
  tenantId: string,
): Promise<AssessmentSurface | null> {
  await assertTenantAccess(tenantId);

  const assessment = await getAssessment(assessmentId, tenantId);
  if (!assessment) return null;

  const [questions, rubric, attempts] = await Promise.all([
    listAssessmentQuestions(assessmentId, tenantId),
    listAssessmentRubric(assessmentId, tenantId),
    listAssessmentAttempts({ assessment_id: assessmentId }, tenantId),
  ]);

  const kpis = kpisFor(
    [assessment],
    new Map([[assessment.id, attempts]]),
    new Map([[assessment.id, questions]]),
    new Map([[assessment.id, rubric]]),
  );

  return {
    tenantId,
    assessment,
    questions,
    rubric,
    attempts,
    kpis,
    generatedAt: new Date().toISOString(),
  };
}

export async function getStudentAssessmentSummary(
  studentId: string,
  tenantId: string,
): Promise<StudentAssessmentSummary> {
  await assertTenantAccess(tenantId);

  const attempts = await listAssessmentAttempts({ student_id: studentId }, tenantId);

  const byAssessmentMap = new Map<string, AssessmentAttempt[]>();
  for (const a of attempts) {
    const arr = byAssessmentMap.get(a.assessment_id) ?? [];
    arr.push(a);
    byAssessmentMap.set(a.assessment_id, arr);
  }

  const assessmentCache = new Map<string, Assessment | null>();
  const questionsCache = new Map<string, AssessmentQuestion[]>();

  const byAssessment: StudentAssessmentSummary["byAssessment"] = [];
  let sumPct = 0;
  let samples = 0;
  let passCount = 0;
  let graded = 0;
  let completed = 0;

  for (const [assessmentId, list] of byAssessmentMap.entries()) {
    if (!assessmentCache.has(assessmentId)) {
      assessmentCache.set(assessmentId, await getAssessment(assessmentId, tenantId));
    }
    if (!questionsCache.has(assessmentId)) {
      questionsCache.set(
        assessmentId,
        await listAssessmentQuestions(assessmentId, tenantId),
      );
    }
    const assessment = assessmentCache.get(assessmentId) ?? null;
    const questions = questionsCache.get(assessmentId) ?? [];

    const sorted = [...list].sort((a, b) =>
      b.updated_at.localeCompare(a.updated_at),
    );
    let bestPct: number | null = null;
    for (const att of sorted) {
      if (att.status !== "in_progress") completed += 1;
      if (att.status === "graded" || att.status === "returned") graded += 1;
      const score = computeScore(att, assessment, questions);
      if (score.maxScore > 0 && (att.status === "graded" || att.status === "returned" || att.status === "submitted")) {
        sumPct += score.percent;
        samples += 1;
        if (score.passed) passCount += 1;
        bestPct = bestPct == null ? score.percent : Math.max(bestPct, score.percent);
      }
    }
    byAssessment.push({
      assessmentId,
      latestAttempt: sorted[0]!,
      attemptsCount: sorted.length,
      bestScorePct: bestPct,
    });
  }

  return {
    studentId,
    tenantId,
    generatedAt: new Date().toISOString(),
    attempts,
    totals: {
      totalAttempts: attempts.length,
      completed,
      graded,
      averageScorePct: samples > 0 ? Math.round(sumPct / samples) : 0,
      passRatePct: percent(passCount, Math.max(samples, 1)),
    },
    byAssessment,
  };
}

export async function submitAssessmentAttempt(
  assessmentId: string,
  answers: AssessmentAnswer[],
  context: {
    tenantId: string;
    studentId: string;
    teacherId?: string | null;
    attemptId?: string | null;
    durationSeconds?: number | null;
  },
): Promise<{ attempt: AssessmentAttempt; score: AssessmentScore }> {
  await assertTenantAccess(context.tenantId);

  const assessment = await getAssessment(assessmentId, context.tenantId);
  const questions = await listAssessmentQuestions(assessmentId, context.tenantId);
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const autoScored: AssessmentAnswer[] = answers.map((a) => {
    const q = questionMap.get(a.question_id);
    if (!q) return { ...a };
    if (q.kind === "multiple_choice" || q.kind === "true_false") {
      const correct = q.correct_answer ?? null;
      if (correct != null && typeof a.response === "string") {
        const isCorrect = a.response === correct;
        return {
          ...a,
          is_correct: isCorrect,
          auto_score: isCorrect ? q.points : 0,
        };
      }
    }
    return { ...a };
  });

  const existing = context.attemptId
    ? await getAssessmentAttempt(context.attemptId, context.tenantId)
    : null;

  const now = new Date().toISOString();
  const attempt = await createAssessmentAttempt(context.tenantId, {
    id: existing?.id ?? context.attemptId ?? undefined,
    assessment_id: assessmentId,
    student_id: context.studentId,
    teacher_id: context.teacherId ?? existing?.teacher_id ?? null,
    status: "submitted",
    answers: autoScored,
    rubric_totals: existing?.rubric_totals ?? {},
    started_at: existing?.started_at ?? now,
    submitted_at: now,
    duration_seconds: context.durationSeconds ?? existing?.duration_seconds ?? null,
  });

  const preScore = computeScore(attempt, assessment, questions);
  let finalAttempt = attempt;
  if (preScore.manualPendingCount === 0 && preScore.maxScore > 0) {
    finalAttempt = await updateAssessmentAttempt(context.tenantId, {
      id: attempt.id,
      assessment_id: attempt.assessment_id,
      student_id: attempt.student_id,
      status: "graded",
      score: preScore.totalScore,
      max_score: preScore.maxScore,
      passed: preScore.passed,
      graded_at: now,
      answers: autoScored,
    });
  }

  const score = computeScore(finalAttempt, assessment, questions);
  return { attempt: finalAttempt, score };
}

export async function gradeAttempt(
  attemptId: string,
  tenantId: string,
  input?: {
    manualScores?: Record<string, number>;
    rubricScores?: Record<string, Record<string, number>>;
    feedback?: string;
    gradedBy?: string;
  },
): Promise<{ attempt: AssessmentAttempt; score: AssessmentScore }> {
  await assertTenantAccess(tenantId);

  const attempt = await getAssessmentAttempt(attemptId, tenantId);
  if (!attempt) throw new Error("NOT_FOUND");

  const assessment = await getAssessment(attempt.assessment_id, tenantId);
  const questions = await listAssessmentQuestions(attempt.assessment_id, tenantId);

  const merged: AssessmentAnswer[] = attempt.answers.map((a) => {
    const next: AssessmentAnswer = { ...a };
    const manual = input?.manualScores?.[a.question_id];
    if (typeof manual === "number") next.manual_score = manual;
    const rubric = input?.rubricScores?.[a.question_id];
    if (rubric) next.rubric_scores = { ...(a.rubric_scores ?? {}), ...rubric };
    return next;
  });

  const rubricTotals: Record<string, number> = { ...attempt.rubric_totals };
  if (input?.rubricScores) {
    for (const scores of Object.values(input.rubricScores)) {
      for (const [cid, val] of Object.entries(scores)) {
        rubricTotals[cid] = (rubricTotals[cid] ?? 0) + val;
      }
    }
  }

  const now = new Date().toISOString();
  const preScore = computeScore(
    { ...attempt, answers: merged, rubric_totals: rubricTotals },
    assessment,
    questions,
  );

  const updated = await updateAssessmentAttempt(tenantId, {
    id: attempt.id,
    assessment_id: attempt.assessment_id,
    student_id: attempt.student_id,
    status: "graded",
    answers: merged,
    rubric_totals: rubricTotals,
    score: preScore.totalScore,
    max_score: preScore.maxScore,
    passed: preScore.passed,
    feedback: input?.feedback ?? attempt.feedback ?? null,
    graded_at: now,
    graded_by: input?.gradedBy ?? attempt.graded_by ?? null,
  });

  const score = computeScore(updated, assessment, questions);
  return { attempt: updated, score };
}

export async function getAssessmentAttemptSurface(
  attemptId: string,
  tenantId: string,
): Promise<AssessmentAttemptSurface | null> {
  await assertTenantAccess(tenantId);

  const attempt = await getAssessmentAttempt(attemptId, tenantId);
  if (!attempt) return null;

  const assessment = await getAssessment(attempt.assessment_id, tenantId);
  const [questions, rubric] = await Promise.all([
    listAssessmentQuestions(attempt.assessment_id, tenantId),
    listAssessmentRubric(attempt.assessment_id, tenantId),
  ]);

  const score = computeScore(attempt, assessment, questions);

  return {
    tenantId,
    attempt,
    assessment,
    questions,
    rubric,
    score,
    generatedAt: new Date().toISOString(),
  };
}
