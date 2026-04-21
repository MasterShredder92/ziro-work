import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { createAssessmentAttempt, getAssessment, getAssessmentAttempt, listAssessmentAttempts, listAssessmentQuestions, listAssessmentRubric, listAssessments, updateAssessmentAttempt, } from "./queries";
const MASTERY_THRESHOLD = 85;
const DEVELOPING_THRESHOLD = 65;
function emptyKpis() {
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
function percent(n, d) {
    if (d <= 0)
        return 0;
    return Math.round((n / d) * 100);
}
function computeScore(attempt, assessment, questions) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    let total = 0;
    let max = 0;
    let autoCount = 0;
    let manualPending = 0;
    const rubricTotals = Object.assign({}, attempt.rubric_totals);
    for (const ans of attempt.answers) {
        const q = questionMap.get(ans.question_id);
        const points = (_a = q === null || q === void 0 ? void 0 : q.points) !== null && _a !== void 0 ? _a : 0;
        max += points;
        if (typeof ans.manual_score === "number") {
            total += ans.manual_score;
        }
        else if (typeof ans.auto_score === "number") {
            total += ans.auto_score;
            autoCount += 1;
        }
        else if (q && (q.kind === "short_answer" || q.kind === "long_answer" || q.kind === "rubric" || q.kind === "performance")) {
            manualPending += 1;
        }
        else if (q && ans.is_correct === true) {
            total += points;
            autoCount += 1;
        }
        if (ans.rubric_scores) {
            for (const [cid, val] of Object.entries(ans.rubric_scores)) {
                rubricTotals[cid] = ((_b = rubricTotals[cid]) !== null && _b !== void 0 ? _b : 0) + val;
            }
        }
    }
    const assessmentMax = (_c = assessment === null || assessment === void 0 ? void 0 : assessment.total_points) !== null && _c !== void 0 ? _c : max;
    const effectiveMax = (_e = (_d = attempt.max_score) !== null && _d !== void 0 ? _d : assessmentMax) !== null && _e !== void 0 ? _e : max;
    const effectiveTotal = (_f = attempt.score) !== null && _f !== void 0 ? _f : total;
    const passing = (_g = assessment === null || assessment === void 0 ? void 0 : assessment.passing_score) !== null && _g !== void 0 ? _g : null;
    const passed = (_h = attempt.passed) !== null && _h !== void 0 ? _h : (passing != null && effectiveMax > 0
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
function kpisFor(assessments, attemptsByAssessment, questionsByAssessment, rubricByAssessment) {
    var _a, _b, _c;
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
        if (a.status === "published")
            kpis.publishedCount += 1;
        if (a.status === "draft")
            kpis.draftCount += 1;
        const questions = (_a = questionsByAssessment.get(a.id)) !== null && _a !== void 0 ? _a : [];
        const rubric = (_b = rubricByAssessment.get(a.id)) !== null && _b !== void 0 ? _b : [];
        totalQuestions += questions.length;
        for (const q of questions) {
            if (q.rubric_criterion_id)
                rubricLinked += 1;
            if (q.difficulty === "intro")
                intro += 1;
            else if (q.difficulty === "advanced")
                advanced += 1;
            else
                core += 1;
        }
        if (rubric.length > 0)
            rubricEligible += questions.length;
        const attempts = (_c = attemptsByAssessment.get(a.id)) !== null && _c !== void 0 ? _c : [];
        totalAttempts += attempts.length;
        for (const att of attempts) {
            if (att.status === "submitted" || att.status === "graded" || att.status === "returned") {
                completedAttempts += 1;
            }
            const score = computeScore(att, a, questions);
            if (score.maxScore > 0 && (att.status === "graded" || att.status === "returned" || att.status === "submitted")) {
                scoreSumPct += score.percent;
                scoreSamples += 1;
                if (score.passed)
                    passCount += 1;
                if (score.percent >= MASTERY_THRESHOLD)
                    kpis.masteryDistribution.mastered += 1;
                else if (score.percent >= DEVELOPING_THRESHOLD)
                    kpis.masteryDistribution.developing += 1;
                else
                    kpis.masteryDistribution.needsSupport += 1;
            }
        }
        if (attempts.length === 0)
            kpis.masteryDistribution.notAttempted += 1;
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
export async function getAssessmentDashboard(tenantId) {
    await assertTenantAccess(tenantId);
    const assessments = await listAssessments(tenantId);
    const questionsByAssessment = new Map();
    const rubricByAssessment = new Map();
    const attemptsByAssessment = new Map();
    await Promise.all(assessments.map(async (a) => {
        const [q, r, att] = await Promise.all([
            listAssessmentQuestions(a.id, tenantId),
            listAssessmentRubric(a.id, tenantId),
            listAssessmentAttempts({ assessment_id: a.id }, tenantId),
        ]);
        questionsByAssessment.set(a.id, q);
        rubricByAssessment.set(a.id, r);
        attemptsByAssessment.set(a.id, att);
    }));
    const summaries = assessments.map((a) => {
        var _a, _b, _c;
        const attempts = (_a = attemptsByAssessment.get(a.id)) !== null && _a !== void 0 ? _a : [];
        const questions = (_b = questionsByAssessment.get(a.id)) !== null && _b !== void 0 ? _b : [];
        const rubric = (_c = rubricByAssessment.get(a.id)) !== null && _c !== void 0 ? _c : [];
        let sum = 0;
        let samples = 0;
        let lastAttemptAt = null;
        for (const att of attempts) {
            const score = computeScore(att, a, questions);
            if (score.maxScore > 0 && (att.status === "graded" || att.status === "returned" || att.status === "submitted")) {
                sum += score.percent;
                samples += 1;
            }
            if (!lastAttemptAt || att.updated_at > lastAttemptAt)
                lastAttemptAt = att.updated_at;
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
export async function getAssessmentSurface(assessmentId, tenantId) {
    await assertTenantAccess(tenantId);
    const assessment = await getAssessment(assessmentId, tenantId);
    if (!assessment)
        return null;
    const [questions, rubric, attempts] = await Promise.all([
        listAssessmentQuestions(assessmentId, tenantId),
        listAssessmentRubric(assessmentId, tenantId),
        listAssessmentAttempts({ assessment_id: assessmentId }, tenantId),
    ]);
    const kpis = kpisFor([assessment], new Map([[assessment.id, attempts]]), new Map([[assessment.id, questions]]), new Map([[assessment.id, rubric]]));
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
export async function getStudentAssessmentSummary(studentId, tenantId) {
    var _a, _b, _c;
    await assertTenantAccess(tenantId);
    const attempts = await listAssessmentAttempts({ student_id: studentId }, tenantId);
    const byAssessmentMap = new Map();
    for (const a of attempts) {
        const arr = (_a = byAssessmentMap.get(a.assessment_id)) !== null && _a !== void 0 ? _a : [];
        arr.push(a);
        byAssessmentMap.set(a.assessment_id, arr);
    }
    const assessmentCache = new Map();
    const questionsCache = new Map();
    const byAssessment = [];
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
            questionsCache.set(assessmentId, await listAssessmentQuestions(assessmentId, tenantId));
        }
        const assessment = (_b = assessmentCache.get(assessmentId)) !== null && _b !== void 0 ? _b : null;
        const questions = (_c = questionsCache.get(assessmentId)) !== null && _c !== void 0 ? _c : [];
        const sorted = [...list].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
        let bestPct = null;
        for (const att of sorted) {
            if (att.status !== "in_progress")
                completed += 1;
            if (att.status === "graded" || att.status === "returned")
                graded += 1;
            const score = computeScore(att, assessment, questions);
            if (score.maxScore > 0 && (att.status === "graded" || att.status === "returned" || att.status === "submitted")) {
                sumPct += score.percent;
                samples += 1;
                if (score.passed)
                    passCount += 1;
                bestPct = bestPct == null ? score.percent : Math.max(bestPct, score.percent);
            }
        }
        byAssessment.push({
            assessmentId,
            latestAttempt: sorted[0],
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
export async function submitAssessmentAttempt(assessmentId, answers, context) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    await assertTenantAccess(context.tenantId);
    const assessment = await getAssessment(assessmentId, context.tenantId);
    const questions = await listAssessmentQuestions(assessmentId, context.tenantId);
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const autoScored = answers.map((a) => {
        var _a;
        const q = questionMap.get(a.question_id);
        if (!q)
            return Object.assign({}, a);
        if (q.kind === "multiple_choice" || q.kind === "true_false") {
            const correct = (_a = q.correct_answer) !== null && _a !== void 0 ? _a : null;
            if (correct != null && typeof a.response === "string") {
                const isCorrect = a.response === correct;
                return Object.assign(Object.assign({}, a), { is_correct: isCorrect, auto_score: isCorrect ? q.points : 0 });
            }
        }
        return Object.assign({}, a);
    });
    const existing = context.attemptId
        ? await getAssessmentAttempt(context.attemptId, context.tenantId)
        : null;
    const now = new Date().toISOString();
    const attempt = await createAssessmentAttempt(context.tenantId, {
        id: (_b = (_a = existing === null || existing === void 0 ? void 0 : existing.id) !== null && _a !== void 0 ? _a : context.attemptId) !== null && _b !== void 0 ? _b : undefined,
        assessment_id: assessmentId,
        student_id: context.studentId,
        teacher_id: (_d = (_c = context.teacherId) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.teacher_id) !== null && _d !== void 0 ? _d : null,
        status: "submitted",
        answers: autoScored,
        rubric_totals: (_e = existing === null || existing === void 0 ? void 0 : existing.rubric_totals) !== null && _e !== void 0 ? _e : {},
        started_at: (_f = existing === null || existing === void 0 ? void 0 : existing.started_at) !== null && _f !== void 0 ? _f : now,
        submitted_at: now,
        duration_seconds: (_h = (_g = context.durationSeconds) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.duration_seconds) !== null && _h !== void 0 ? _h : null,
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
export async function gradeAttempt(attemptId, tenantId, input) {
    var _a, _b, _c, _d, _e;
    await assertTenantAccess(tenantId);
    const attempt = await getAssessmentAttempt(attemptId, tenantId);
    if (!attempt)
        throw new Error("NOT_FOUND");
    const assessment = await getAssessment(attempt.assessment_id, tenantId);
    const questions = await listAssessmentQuestions(attempt.assessment_id, tenantId);
    const merged = attempt.answers.map((a) => {
        var _a, _b, _c;
        const next = Object.assign({}, a);
        const manual = (_a = input === null || input === void 0 ? void 0 : input.manualScores) === null || _a === void 0 ? void 0 : _a[a.question_id];
        if (typeof manual === "number")
            next.manual_score = manual;
        const rubric = (_b = input === null || input === void 0 ? void 0 : input.rubricScores) === null || _b === void 0 ? void 0 : _b[a.question_id];
        if (rubric)
            next.rubric_scores = Object.assign(Object.assign({}, ((_c = a.rubric_scores) !== null && _c !== void 0 ? _c : {})), rubric);
        return next;
    });
    const rubricTotals = Object.assign({}, attempt.rubric_totals);
    if (input === null || input === void 0 ? void 0 : input.rubricScores) {
        for (const scores of Object.values(input.rubricScores)) {
            for (const [cid, val] of Object.entries(scores)) {
                rubricTotals[cid] = ((_a = rubricTotals[cid]) !== null && _a !== void 0 ? _a : 0) + val;
            }
        }
    }
    const now = new Date().toISOString();
    const preScore = computeScore(Object.assign(Object.assign({}, attempt), { answers: merged, rubric_totals: rubricTotals }), assessment, questions);
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
        feedback: (_c = (_b = input === null || input === void 0 ? void 0 : input.feedback) !== null && _b !== void 0 ? _b : attempt.feedback) !== null && _c !== void 0 ? _c : null,
        graded_at: now,
        graded_by: (_e = (_d = input === null || input === void 0 ? void 0 : input.gradedBy) !== null && _d !== void 0 ? _d : attempt.graded_by) !== null && _e !== void 0 ? _e : null,
    });
    const score = computeScore(updated, assessment, questions);
    return { attempt: updated, score };
}
export async function getAssessmentAttemptSurface(attemptId, tenantId) {
    await assertTenantAccess(tenantId);
    const attempt = await getAssessmentAttempt(attemptId, tenantId);
    if (!attempt)
        return null;
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
