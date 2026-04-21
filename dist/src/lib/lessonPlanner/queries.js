import { listLessonPlans as listLessonPlansData, getLessonPlan as getLessonPlanData, upsertLessonPlan, } from "@data/lessonPlans";
import { listLessonPlanVersions as listLessonPlanVersionsData, upsertLessonPlanVersion, } from "@data/lessonPlanVersions";
import { listLessonObjectives as listLessonObjectivesData, upsertLessonObjective, } from "@data/lessonObjectives";
import { listLessonActivities as listLessonActivitiesData, upsertLessonActivity, } from "@data/lessonActivities";
import { listLessonMaterialLinks as listLessonMaterialLinksData, upsertLessonMaterialLink, } from "@data/lessonMaterialLinks";
export async function listLessonPlans(tenantId, filter) {
    return listLessonPlansData(tenantId, filter);
}
export async function getLessonPlan(planId, tenantId) {
    return getLessonPlanData(planId, tenantId);
}
export async function listLessonPlanVersions(planId, tenantId) {
    return listLessonPlanVersionsData({ plan_id: planId }, tenantId);
}
export async function createLessonPlan(data) {
    return upsertLessonPlan(data.tenant_id, data);
}
export async function updateLessonPlan(planId, data) {
    return upsertLessonPlan(data.tenant_id, Object.assign(Object.assign({}, data), { id: planId }));
}
export async function createLessonPlanVersion(planId, data) {
    return upsertLessonPlanVersion(data.tenant_id, Object.assign(Object.assign({}, data), { plan_id: planId }));
}
export async function listObjectives(planId, tenantId) {
    return listLessonObjectivesData(planId, tenantId);
}
export async function listActivities(planId, tenantId) {
    return listLessonActivitiesData(planId, tenantId);
}
export async function listMaterialLinks(planId, tenantId) {
    return listLessonMaterialLinksData(planId, tenantId);
}
export async function upsertObjective(tenantId, input) {
    return upsertLessonObjective(tenantId, input);
}
export async function upsertActivity(tenantId, input) {
    return upsertLessonActivity(tenantId, input);
}
export async function upsertMaterialLink(tenantId, input) {
    return upsertLessonMaterialLink(tenantId, input);
}
