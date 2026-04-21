import { listPrograms as listProgramsData, getProgram as getProgramData } from "@data/programs";
import { listLevels as listLevelsData } from "@data/levels";
import { listUnits as listUnitsData } from "@data/units";
import { listLessons as listLessonsData } from "@data/lessons";
import { listMaterials as listMaterialsData } from "@data/materials";
import { listStudentProgress as listStudentProgressData } from "@data/studentProgress";
export async function listPrograms(tenantId) {
    return listProgramsData(tenantId);
}
export async function getProgram(programId, tenantId) {
    return getProgramData(programId, tenantId);
}
export async function listLevels(programId, tenantId) {
    return listLevelsData(programId, tenantId);
}
export async function listUnits(levelId, tenantId) {
    return listUnitsData(levelId, tenantId);
}
export async function listLessons(unitId, tenantId) {
    return listLessonsData(unitId, tenantId);
}
export async function listMaterials(lessonId, tenantId) {
    return listMaterialsData(lessonId, tenantId);
}
export async function getStudentProgress(studentId, tenantId) {
    var _a, _b, _c;
    const entries = await listStudentProgressData({ student_id: studentId }, tenantId);
    const byProgram = new Map();
    for (const entry of entries) {
        const key = (_a = entry.program_id) !== null && _a !== void 0 ? _a : null;
        const arr = (_b = byProgram.get(key)) !== null && _b !== void 0 ? _b : [];
        arr.push(entry);
        byProgram.set(key, arr);
    }
    const summaries = [];
    for (const [programId, group] of byProgram.entries()) {
        const total = group.length;
        const started = group.filter((g) => g.status === "in_progress").length;
        const completed = group.filter((g) => g.status === "completed").length;
        const needsReview = group.filter((g) => g.status === "needs_review").length;
        const lastActivityAt = (_c = group
            .map((g) => g.updated_at)
            .sort()
            .pop()) !== null && _c !== void 0 ? _c : null;
        summaries.push({
            studentId,
            programId,
            lessonsStarted: started,
            lessonsCompleted: completed,
            lessonsNeedingReview: needsReview,
            totalLessons: total,
            completionPct: total === 0 ? 0 : Math.round((completed / total) * 100),
            lastActivityAt,
        });
    }
    return {
        studentId,
        tenantId: tenantId !== null && tenantId !== void 0 ? tenantId : "",
        entries,
        summaries,
        generatedAt: new Date().toISOString(),
    };
}
