import {
  listLessonPlans as listLessonPlansData,
  getLessonPlan as getLessonPlanData,
  upsertLessonPlan,
  type LessonPlanRow,
  type LessonPlanFilter,
} from "@data/lessonPlans";
import {
  listLessonPlanVersions as listLessonPlanVersionsData,
  upsertLessonPlanVersion,
  type LessonPlanVersionRow,
} from "@data/lessonPlanVersions";
import {
  listLessonObjectives as listLessonObjectivesData,
  upsertLessonObjective,
  type LessonObjectiveRow,
} from "@data/lessonObjectives";
import {
  listLessonActivities as listLessonActivitiesData,
  upsertLessonActivity,
  type LessonActivityRow,
} from "@data/lessonActivities";
import {
  listLessonMaterialLinks as listLessonMaterialLinksData,
  upsertLessonMaterialLink,
  type LessonMaterialLinkRow,
} from "@data/lessonMaterialLinks";

export type LessonPlanInput = Partial<LessonPlanRow> & {
  tenant_id: string;
  title: string;
};

export type LessonPlanUpdateInput = Partial<LessonPlanRow> & {
  tenant_id: string;
};

export type LessonPlanVersionInput = Partial<LessonPlanVersionRow> & {
  tenant_id: string;
  version: number;
};

export async function listLessonPlans(
  tenantId: string,
  filter?: LessonPlanFilter,
): Promise<LessonPlanRow[]> {
  return listLessonPlansData(tenantId, filter);
}

export async function getLessonPlan(
  planId: string,
  tenantId?: string,
): Promise<LessonPlanRow | null> {
  return getLessonPlanData(planId, tenantId);
}

export async function listLessonPlanVersions(
  planId: string,
  tenantId?: string,
): Promise<LessonPlanVersionRow[]> {
  return listLessonPlanVersionsData({ plan_id: planId }, tenantId);
}

export async function createLessonPlan(
  data: LessonPlanInput,
): Promise<LessonPlanRow> {
  return upsertLessonPlan(data.tenant_id, data);
}

export async function updateLessonPlan(
  planId: string,
  data: LessonPlanUpdateInput,
): Promise<LessonPlanRow> {
  return upsertLessonPlan(data.tenant_id, { ...data, id: planId });
}

export async function createLessonPlanVersion(
  planId: string,
  data: LessonPlanVersionInput,
): Promise<LessonPlanVersionRow> {
  return upsertLessonPlanVersion(data.tenant_id, {
    ...data,
    plan_id: planId,
  });
}

export async function listObjectives(
  planId: string,
  tenantId?: string,
): Promise<LessonObjectiveRow[]> {
  return listLessonObjectivesData(planId, tenantId);
}

export async function listActivities(
  planId: string,
  tenantId?: string,
): Promise<LessonActivityRow[]> {
  return listLessonActivitiesData(planId, tenantId);
}

export async function listMaterialLinks(
  planId: string,
  tenantId?: string,
): Promise<LessonMaterialLinkRow[]> {
  return listLessonMaterialLinksData(planId, tenantId);
}

export async function upsertObjective(
  tenantId: string,
  input: Partial<LessonObjectiveRow> & { plan_id: string; text: string },
): Promise<LessonObjectiveRow> {
  return upsertLessonObjective(tenantId, input);
}

export async function upsertActivity(
  tenantId: string,
  input: Partial<LessonActivityRow> & { plan_id: string; title: string },
): Promise<LessonActivityRow> {
  return upsertLessonActivity(tenantId, input);
}

export async function upsertMaterialLink(
  tenantId: string,
  input: Partial<LessonMaterialLinkRow> & { plan_id: string; title: string },
): Promise<LessonMaterialLinkRow> {
  return upsertLessonMaterialLink(tenantId, input);
}
