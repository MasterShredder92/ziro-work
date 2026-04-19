import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import {
  createLessonPlan,
  createLessonPlanVersion,
  getLessonPlan,
  listActivities,
  listLessonPlanVersions,
  listLessonPlans,
  listMaterialLinks,
  listObjectives,
  updateLessonPlan,
  upsertActivity,
  upsertMaterialLink,
  upsertObjective,
  type LessonPlanUpdateInput,
} from "./queries";
import type {
  AIDraftActivity,
  AIDraftMaterial,
  AIDraftObjective,
  AIDraftRequest,
  AIDraftResult,
  LessonActivity,
  LessonMaterialLink,
  LessonObjective,
  LessonPlan,
  LessonPlanKpis,
  LessonPlanSummary,
  LessonPlanSurface,
  LessonPlanVersion,
  LessonPlannerDashboardData,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

function emptyKpis(): LessonPlanKpis {
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

function percent(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export async function getLessonPlannerDashboard(
  tenantId: string,
): Promise<LessonPlannerDashboardData> {
  await assertTenantAccess(tenantId);

  const plans = await listLessonPlans(tenantId);

  const summaries = await Promise.all(
    plans.map(async (plan): Promise<LessonPlanSummary> => {
      const [objectives, activities, materials, versions] = await Promise.all([
        listObjectives(plan.id, tenantId),
        listActivities(plan.id, tenantId),
        listMaterialLinks(plan.id, tenantId),
        listLessonPlanVersions(plan.id, tenantId),
      ]);
      const hasAIDraft =
        plan.source === "ai_draft" ||
        plan.last_ai_draft_at != null ||
        versions.some((v) => v.source === "ai_draft");
      const lastVersionAt =
        versions.length > 0
          ? versions.reduce<string | null>(
              (acc, v) => (!acc || v.created_at > acc ? v.created_at : acc),
              null,
            )
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
    }),
  );

  const kpis = buildDashboardKpis(plans, summaries);

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    plans: summaries,
    kpis,
  };
}

function buildDashboardKpis(
  plans: LessonPlan[],
  summaries: LessonPlanSummary[],
): LessonPlanKpis {
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

    const alignment = plan.curriculum_alignment?.length ?? 0;
    alignmentTotal += 1;
    if (alignment > 0) alignmentWithValues += 1;

    const status = plan.status;
    if (status in kpis.statusBreakdown) {
      (kpis.statusBreakdown as Record<string, number>)[status] += 1;
    }
  }

  for (const s of summaries) {
    objectiveSum += s.objectiveCount;
    activitySum += s.activityCount;
    materialSum += s.materialCount;
  }

  kpis.aiDraftUsagePct = percent(aiPlanCount, Math.max(plans.length, 1));
  kpis.curriculumAlignmentPct = percent(
    alignmentWithValues,
    Math.max(alignmentTotal, 1),
  );
  kpis.materialsLinkedPerPlan = round1(
    materialSum / Math.max(plans.length, 1),
  );
  kpis.objectivesPerPlan = round1(objectiveSum / Math.max(plans.length, 1));
  kpis.activitiesPerPlan = round1(activitySum / Math.max(plans.length, 1));

  return kpis;
}

export async function getLessonPlanSurface(
  planId: string,
  tenantId: string,
): Promise<LessonPlanSurface | null> {
  await assertTenantAccess(tenantId);

  const plan = await getLessonPlan(planId, tenantId);
  if (!plan) return null;

  const [objectives, activities, materials, versions] = await Promise.all([
    listObjectives(planId, tenantId),
    listActivities(planId, tenantId),
    listMaterialLinks(planId, tenantId),
    listLessonPlanVersions(planId, tenantId),
  ]);

  const latestVersion =
    versions.length > 0
      ? [...versions].sort((a, b) => b.version - a.version)[0]
      : null;

  const aiDraftCount =
    versions.filter((v) => v.source === "ai_draft").length +
    (plan.source === "ai_draft" ? 1 : 0);

  const totalDurationMinutes = activities.reduce(
    (sum, a) => sum + (a.duration_minutes ?? 0),
    0,
  );

  const alignment = plan.curriculum_alignment?.length ?? 0;
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

function titleize(s: string | null | undefined, fallback = "Lesson plan"): string {
  if (!s) return fallback;
  const t = s.trim();
  return t.length > 0 ? t : fallback;
}

function defaultObjectives(subject: string | null): AIDraftObjective[] {
  const subj = subject ?? "the topic";
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

function defaultActivities(
  durationMinutes: number | null,
): AIDraftActivity[] {
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
      description:
        "Introduce the main concept with a short demo and anchor examples.",
      kind: "direct_instruction",
      duration_minutes: direct,
      grouping: "whole_class",
    },
    {
      title: "Guided practice",
      description:
        "Work through scaffolded examples with gradual release to students.",
      kind: "guided_practice",
      duration_minutes: guided,
      grouping: "small_group",
    },
    {
      title: "Independent practice",
      description:
        "Students apply the concept individually on a targeted task.",
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

function defaultMaterials(): AIDraftMaterial[] {
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

export async function draftLessonPlanAI(
  request: AIDraftRequest,
): Promise<AIDraftResult> {
  await assertTenantAccess(request.tenantId);

  const title = titleize(
    request.title ?? (request.subject ? `${request.subject} lesson` : null),
    "Lesson plan",
  );
  const estimatedDurationMinutes =
    request.durationMinutes && request.durationMinutes > 0
      ? request.durationMinutes
      : 45;

  const summary = `${title} — a ${estimatedDurationMinutes}-minute lesson${
    request.gradeLevel ? ` for ${request.gradeLevel} learners` : ""
  }${request.subject ? ` focused on ${request.subject}` : ""}.`;

  const objectives = defaultObjectives(request.subject ?? null);
  const activities = defaultActivities(estimatedDurationMinutes);
  const materials = defaultMaterials();

  const focus = request.focusAreas ?? [];
  if (focus.length > 0) {
    objectives.push({
      text: `Students will demonstrate mastery in focus areas: ${focus.join(", ")}.`,
      bloom_level: "apply",
    });
  }

  const curriculumAlignment = Array.from(
    new Set(
      [
        request.subject ?? null,
        request.gradeLevel ?? null,
        ...(request.standards ?? []),
        ...focus,
      ].filter((v): v is string => typeof v === "string" && v.length > 0),
    ),
  );

  return {
    title,
    summary,
    objectives,
    activities,
    materials,
    standards: request.standards ?? [],
    curriculumAlignment,
    estimatedDurationMinutes,
    notes: request.notes ?? null,
    model: "ziro.lessonPlanner.draft.v1",
    prompt: request.prompt ?? `Draft a lesson plan titled "${title}".`,
    generatedAt: new Date().toISOString(),
  };
}

export async function saveAIDraft(
  planId: string | null,
  draft: AIDraftResult,
  context: {
    tenantId: string;
    authorId?: string | null;
    teacherId?: string | null;
    programId?: string | null;
    unitId?: string | null;
    lessonId?: string | null;
  },
): Promise<LessonPlanSurface> {
  await assertTenantAccess(context.tenantId);

  const now = new Date().toISOString();

  const existing = planId ? await getLessonPlan(planId, context.tenantId) : null;

  const nextVersion = existing ? (existing.current_version ?? 0) + 1 : 1;

  const basePayload = {
    tenant_id: context.tenantId,
    title: draft.title,
    summary: draft.summary,
    duration_minutes: draft.estimatedDurationMinutes,
    status: existing?.status ?? "draft",
    source: "ai_draft" as const,
    teacher_id: context.teacherId ?? existing?.teacher_id ?? null,
    author_id: context.authorId ?? existing?.author_id ?? null,
    program_id: context.programId ?? existing?.program_id ?? null,
    unit_id: context.unitId ?? existing?.unit_id ?? null,
    lesson_id: context.lessonId ?? existing?.lesson_id ?? null,
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
    author_id: context.authorId ?? null,
    ai_prompt: draft.prompt,
    ai_model: draft.model,
    ai_metadata: {
      focusAreas: draft.standards,
      estimatedDurationMinutes: draft.estimatedDurationMinutes,
    },
    snapshot: {
      title: draft.title,
      summary: draft.summary,
      objectives: draft.objectives.map((o, idx) => ({
        text: o.text,
        bloom_level: o.bloom_level ?? null,
        order: idx,
      })),
      activities: draft.activities.map((a, idx) => ({
        title: a.title,
        description: a.description ?? null,
        kind: a.kind ?? null,
        duration_minutes: a.duration_minutes ?? null,
        order: idx,
      })),
      materials: draft.materials.map((m) => ({
        title: m.title,
        url: m.url ?? null,
        kind: m.kind ?? null,
      })),
      notes: draft.notes ?? null,
    },
  });

  const surface = await getLessonPlanSurface(plan.id, context.tenantId);
  if (!surface) {
    throw new Error("FAILED_TO_LOAD_SURFACE");
  }
  return surface;
}

async function replacePlanContent(
  plan: LessonPlan,
  draft: AIDraftResult,
  tenantId: string,
): Promise<{
  objectives: LessonObjective[];
  activities: LessonActivity[];
  materials: LessonMaterialLink[];
}> {
  const objectives = await Promise.all(
    draft.objectives.map((obj, idx) =>
      upsertObjective(tenantId, {
        plan_id: plan.id,
        text: obj.text,
        bloom_level: obj.bloom_level ?? null,
        standard_code: obj.standard_code ?? null,
        sort_order: idx,
      }),
    ),
  );

  const activities = await Promise.all(
    draft.activities.map((act, idx) =>
      upsertActivity(tenantId, {
        plan_id: plan.id,
        title: act.title,
        description: act.description ?? null,
        kind: act.kind ?? "direct_instruction",
        duration_minutes: act.duration_minutes ?? null,
        grouping: act.grouping ?? null,
        resources: act.resources ?? [],
        sort_order: idx,
      }),
    ),
  );

  const materials = await Promise.all(
    draft.materials.map((mat, idx) =>
      upsertMaterialLink(tenantId, {
        plan_id: plan.id,
        title: mat.title,
        url: mat.url ?? null,
        kind: mat.kind ?? "link",
        notes: mat.notes ?? null,
        is_required: Boolean(mat.is_required),
        sort_order: idx,
      }),
    ),
  );

  return { objectives, activities, materials };
}

async function upsertNewPlan(
  payload: LessonPlanUpdateInput & { title?: string },
): Promise<LessonPlan> {
  return createLessonPlan({
    ...payload,
    title: payload.title ?? "Untitled lesson plan",
  });
}

export type { LessonPlanVersion };
