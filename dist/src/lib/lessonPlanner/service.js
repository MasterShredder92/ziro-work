import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { createLessonPlan, createLessonPlanVersion, getLessonPlan, listActivities, listLessonPlanVersions, listLessonPlans, listMaterialLinks, listObjectives, updateLessonPlan, upsertActivity, upsertMaterialLink, upsertObjective, } from "./queries";
const DAY_MS = 24 * 60 * 60 * 1000;
function emptyKpis() {
    return {
        totalPlans: 0,
        plansCreated: 0,
        plansUpdatedLast7d: 0,
        aiDraftsLast30d: 0,
        aiDraftUsagePct: 0,
        curriculumAlignmentPct: 0,
        materialsLinkedPerPlan: 0,
        objectivesPerPlan: 0,
        activitiesPerPlan: 0,
        statusBreakdown: { draft: 0, ready: 0, published: 0, archived: 0 },
    };
}
function percent(n, d) {
    if (d <= 0)
        return 0;
    return Math.round((n / d) * 100);
}
function round1(n) {
    return Math.round(n * 10) / 10;
}
export async function getLessonPlannerDashboard(tenantId) {
    await assertTenantAccess(tenantId);
    const plans = await listLessonPlans(tenantId);
    const summaries = await Promise.all(plans.map(async (plan) => {
        const [objectives, activities, materials, versions] = await Promise.all([
            listObjectives(plan.id, tenantId),
            listActivities(plan.id, tenantId),
            listMaterialLinks(plan.id, tenantId),
            listLessonPlanVersions(plan.id, tenantId),
        ]);
        const hasAIDraft = plan.source === "ai_draft" ||
            plan.last_ai_draft_at != null ||
            versions.some((v) => v.source === "ai_draft");
        const lastVersionAt = versions.length > 0
            ? versions.reduce((acc, v) => (!acc || v.created_at > acc ? v.created_at : acc), null)
            : null;
        return {
            plan,
            objectiveCount: objectives.length,
            activityCount: activities.length,
            materialCount: materials.length,
            versionCount: versions.length,
            lastVersionAt,
            hasAIDraft,
        };
    }));
    const kpis = buildDashboardKpis(plans, summaries);
    return {
        tenantId,
        generatedAt: new Date().toISOString(),
        plans: summaries,
        kpis,
    };
}
function buildDashboardKpis(plans, summaries) {
    var _a, _b;
    const kpis = emptyKpis();
    kpis.totalPlans = plans.length;
    kpis.plansCreated = plans.length;
    const now = Date.now();
    const sevenDaysAgo = now - 7 * DAY_MS;
    const thirtyDaysAgo = now - 30 * DAY_MS;
    let alignmentWithValues = 0;
    let alignmentTotal = 0;
    let objectiveSum = 0;
    let activitySum = 0;
    let materialSum = 0;
    let aiPlanCount = 0;
    for (const plan of plans) {
        const updatedAt = Date.parse(plan.updated_at);
        if (Number.isFinite(updatedAt) && updatedAt >= sevenDaysAgo) {
            kpis.plansUpdatedLast7d += 1;
        }
        const aiDraftAt = plan.last_ai_draft_at
            ? Date.parse(plan.last_ai_draft_at)
            : NaN;
        if (Number.isFinite(aiDraftAt) && aiDraftAt >= thirtyDaysAgo) {
            kpis.aiDraftsLast30d += 1;
        }
        if (plan.source === "ai_draft" || plan.last_ai_draft_at) {
            aiPlanCount += 1;
        }
        const alignment = (_b = (_a = plan.curriculum_alignment) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
        alignmentTotal += 1;
        if (alignment > 0)
            alignmentWithValues += 1;
        const status = plan.status;
        if (status in kpis.statusBreakdown) {
            kpis.statusBreakdown[status] += 1;
        }
    }
    for (const s of summaries) {
        objectiveSum += s.objectiveCount;
        activitySum += s.activityCount;
        materialSum += s.materialCount;
    }
    kpis.aiDraftUsagePct = percent(aiPlanCount, Math.max(plans.length, 1));
    kpis.curriculumAlignmentPct = percent(alignmentWithValues, Math.max(alignmentTotal, 1));
    kpis.materialsLinkedPerPlan = round1(materialSum / Math.max(plans.length, 1));
    kpis.objectivesPerPlan = round1(objectiveSum / Math.max(plans.length, 1));
    kpis.activitiesPerPlan = round1(activitySum / Math.max(plans.length, 1));
    return kpis;
}
export async function getLessonPlanSurface(planId, tenantId) {
    var _a, _b;
    await assertTenantAccess(tenantId);
    const plan = await getLessonPlan(planId, tenantId);
    if (!plan)
        return null;
    const [objectives, activities, materials, versions] = await Promise.all([
        listObjectives(planId, tenantId),
        listActivities(planId, tenantId),
        listMaterialLinks(planId, tenantId),
        listLessonPlanVersions(planId, tenantId),
    ]);
    const latestVersion = versions.length > 0
        ? [...versions].sort((a, b) => b.version - a.version)[0]
        : null;
    const aiDraftCount = versions.filter((v) => v.source === "ai_draft").length +
        (plan.source === "ai_draft" ? 1 : 0);
    const totalDurationMinutes = activities.reduce((sum, a) => { var _a; return sum + ((_a = a.duration_minutes) !== null && _a !== void 0 ? _a : 0); }, 0);
    const alignment = (_b = (_a = plan.curriculum_alignment) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
    const curriculumAlignmentPct = alignment > 0 ? 100 : 0;
    return {
        tenantId,
        plan,
        objectives,
        activities,
        materials,
        versions,
        latestVersion,
        kpis: {
            objectiveCount: objectives.length,
            activityCount: activities.length,
            materialCount: materials.length,
            versionCount: versions.length,
            totalDurationMinutes,
            aiDraftCount,
            curriculumAlignmentPct,
        },
        generatedAt: new Date().toISOString(),
    };
}
function titleize(s, fallback = "Lesson plan") {
    if (!s)
        return fallback;
    const t = s.trim();
    return t.length > 0 ? t : fallback;
}
function defaultObjectives(subject) {
    const subj = subject !== null && subject !== void 0 ? subject : "the topic";
    return [
        {
            text: `Students will explain the core concepts of ${subj}.`,
            bloom_level: "understand",
        },
        {
            text: `Students will apply key techniques related to ${subj} in guided practice.`,
            bloom_level: "apply",
        },
        {
            text: `Students will reflect on their learning and identify one area for growth.`,
            bloom_level: "evaluate",
        },
    ];
}
function defaultActivities(durationMinutes) {
    const total = durationMinutes && durationMinutes > 0 ? durationMinutes : 45;
    const warmup = Math.max(5, Math.round(total * 0.12));
    const direct = Math.max(8, Math.round(total * 0.22));
    const guided = Math.max(10, Math.round(total * 0.26));
    const independent = Math.max(10, Math.round(total * 0.3));
    const closure = Math.max(3, total - warmup - direct - guided - independent);
    return [
        {
            title: "Warm-up discussion",
            description: "Activate prior knowledge with a quick discussion prompt.",
            kind: "warmup",
            duration_minutes: warmup,
            grouping: "whole_class",
        },
        {
            title: "Direct instruction",
            description: "Introduce the main concept with a short demo and anchor examples.",
            kind: "direct_instruction",
            duration_minutes: direct,
            grouping: "whole_class",
        },
        {
            title: "Guided practice",
            description: "Work through scaffolded examples with gradual release to students.",
            kind: "guided_practice",
            duration_minutes: guided,
            grouping: "small_group",
        },
        {
            title: "Independent practice",
            description: "Students apply the concept individually on a targeted task.",
            kind: "independent_practice",
            duration_minutes: independent,
            grouping: "individual",
        },
        {
            title: "Closure & reflection",
            description: "Summarize key takeaways and collect an exit ticket.",
            kind: "closure",
            duration_minutes: Math.max(3, closure),
            grouping: "whole_class",
        },
    ];
}
function defaultMaterials() {
    return [
        {
            title: "Lesson slides",
            kind: "slide",
            is_required: true,
        },
        {
            title: "Student practice handout",
            kind: "pdf",
            is_required: true,
        },
        {
            title: "Reference video",
            kind: "video",
            is_required: false,
        },
    ];
}
export async function draftLessonPlanAI(request) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    await assertTenantAccess(request.tenantId);
    const title = titleize((_a = request.title) !== null && _a !== void 0 ? _a : (request.subject ? `${request.subject} lesson` : null), "Lesson plan");
    const estimatedDurationMinutes = request.durationMinutes && request.durationMinutes > 0
        ? request.durationMinutes
        : 45;
    const summary = `${title} — a ${estimatedDurationMinutes}-minute lesson${request.gradeLevel ? ` for ${request.gradeLevel} learners` : ""}${request.subject ? ` focused on ${request.subject}` : ""}.`;
    const objectives = defaultObjectives((_b = request.subject) !== null && _b !== void 0 ? _b : null);
    const activities = defaultActivities(estimatedDurationMinutes);
    const materials = defaultMaterials();
    const focus = (_c = request.focusAreas) !== null && _c !== void 0 ? _c : [];
    if (focus.length > 0) {
        objectives.push({
            text: `Students will demonstrate mastery in focus areas: ${focus.join(", ")}.`,
            bloom_level: "apply",
        });
    }
    const curriculumAlignment = Array.from(new Set([
        (_d = request.subject) !== null && _d !== void 0 ? _d : null,
        (_e = request.gradeLevel) !== null && _e !== void 0 ? _e : null,
        ...((_f = request.standards) !== null && _f !== void 0 ? _f : []),
        ...focus,
    ].filter((v) => typeof v === "string" && v.length > 0)));
    return {
        title,
        summary,
        objectives,
        activities,
        materials,
        standards: (_g = request.standards) !== null && _g !== void 0 ? _g : [],
        curriculumAlignment,
        estimatedDurationMinutes,
        notes: (_h = request.notes) !== null && _h !== void 0 ? _h : null,
        model: "ziro.lessonPlanner.draft.v1",
        prompt: (_j = request.prompt) !== null && _j !== void 0 ? _j : `Draft a lesson plan titled "${title}".`,
        generatedAt: new Date().toISOString(),
    };
}
export async function saveAIDraft(planId, draft, context) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    await assertTenantAccess(context.tenantId);
    const now = new Date().toISOString();
    const existing = planId ? await getLessonPlan(planId, context.tenantId) : null;
    const nextVersion = existing ? ((_a = existing.current_version) !== null && _a !== void 0 ? _a : 0) + 1 : 1;
    const basePayload = {
        tenant_id: context.tenantId,
        title: draft.title,
        summary: draft.summary,
        duration_minutes: draft.estimatedDurationMinutes,
        status: (_b = existing === null || existing === void 0 ? void 0 : existing.status) !== null && _b !== void 0 ? _b : "draft",
        source: "ai_draft",
        teacher_id: (_d = (_c = context.teacherId) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.teacher_id) !== null && _d !== void 0 ? _d : null,
        author_id: (_f = (_e = context.authorId) !== null && _e !== void 0 ? _e : existing === null || existing === void 0 ? void 0 : existing.author_id) !== null && _f !== void 0 ? _f : null,
        program_id: (_h = (_g = context.programId) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.program_id) !== null && _h !== void 0 ? _h : null,
        unit_id: (_k = (_j = context.unitId) !== null && _j !== void 0 ? _j : existing === null || existing === void 0 ? void 0 : existing.unit_id) !== null && _k !== void 0 ? _k : null,
        lesson_id: (_m = (_l = context.lessonId) !== null && _l !== void 0 ? _l : existing === null || existing === void 0 ? void 0 : existing.lesson_id) !== null && _m !== void 0 ? _m : null,
        curriculum_alignment: draft.curriculumAlignment,
        standards: draft.standards,
        current_version: nextVersion,
        last_ai_draft_at: now,
    };
    const plan = existing
        ? await updateLessonPlan(existing.id, basePayload)
        : await upsertNewPlan(basePayload);
    await replacePlanContent(plan, draft, context.tenantId);
    await createLessonPlanVersion(plan.id, {
        tenant_id: context.tenantId,
        version: nextVersion,
        label: `AI draft v${nextVersion}`,
        summary: draft.summary,
        source: "ai_draft",
        author_id: (_o = context.authorId) !== null && _o !== void 0 ? _o : null,
        ai_prompt: draft.prompt,
        ai_model: draft.model,
        ai_metadata: {
            focusAreas: draft.standards,
            estimatedDurationMinutes: draft.estimatedDurationMinutes,
        },
        snapshot: {
            title: draft.title,
            summary: draft.summary,
            objectives: draft.objectives.map((o, idx) => {
                var _a;
                return ({
                    text: o.text,
                    bloom_level: (_a = o.bloom_level) !== null && _a !== void 0 ? _a : null,
                    order: idx,
                });
            }),
            activities: draft.activities.map((a, idx) => {
                var _a, _b, _c;
                return ({
                    title: a.title,
                    description: (_a = a.description) !== null && _a !== void 0 ? _a : null,
                    kind: (_b = a.kind) !== null && _b !== void 0 ? _b : null,
                    duration_minutes: (_c = a.duration_minutes) !== null && _c !== void 0 ? _c : null,
                    order: idx,
                });
            }),
            materials: draft.materials.map((m) => {
                var _a, _b;
                return ({
                    title: m.title,
                    url: (_a = m.url) !== null && _a !== void 0 ? _a : null,
                    kind: (_b = m.kind) !== null && _b !== void 0 ? _b : null,
                });
            }),
            notes: (_p = draft.notes) !== null && _p !== void 0 ? _p : null,
        },
    });
    const surface = await getLessonPlanSurface(plan.id, context.tenantId);
    if (!surface) {
        throw new Error("FAILED_TO_LOAD_SURFACE");
    }
    return surface;
}
async function replacePlanContent(plan, draft, tenantId) {
    const objectives = await Promise.all(draft.objectives.map((obj, idx) => {
        var _a, _b;
        return upsertObjective(tenantId, {
            plan_id: plan.id,
            text: obj.text,
            bloom_level: (_a = obj.bloom_level) !== null && _a !== void 0 ? _a : null,
            standard_code: (_b = obj.standard_code) !== null && _b !== void 0 ? _b : null,
            sort_order: idx,
        });
    }));
    const activities = await Promise.all(draft.activities.map((act, idx) => {
        var _a, _b, _c, _d, _e;
        return upsertActivity(tenantId, {
            plan_id: plan.id,
            title: act.title,
            description: (_a = act.description) !== null && _a !== void 0 ? _a : null,
            kind: (_b = act.kind) !== null && _b !== void 0 ? _b : "direct_instruction",
            duration_minutes: (_c = act.duration_minutes) !== null && _c !== void 0 ? _c : null,
            grouping: (_d = act.grouping) !== null && _d !== void 0 ? _d : null,
            resources: (_e = act.resources) !== null && _e !== void 0 ? _e : [],
            sort_order: idx,
        });
    }));
    const materials = await Promise.all(draft.materials.map((mat, idx) => {
        var _a, _b, _c;
        return upsertMaterialLink(tenantId, {
            plan_id: plan.id,
            title: mat.title,
            url: (_a = mat.url) !== null && _a !== void 0 ? _a : null,
            kind: (_b = mat.kind) !== null && _b !== void 0 ? _b : "link",
            notes: (_c = mat.notes) !== null && _c !== void 0 ? _c : null,
            is_required: Boolean(mat.is_required),
            sort_order: idx,
        });
    }));
    return { objectives, activities, materials };
}
async function upsertNewPlan(payload) {
    var _a;
    return createLessonPlan(Object.assign(Object.assign({}, payload), { title: (_a = payload.title) !== null && _a !== void 0 ? _a : "Untitled lesson plan" }));
}
