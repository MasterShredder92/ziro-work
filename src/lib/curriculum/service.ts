import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { listStudentProgress as listStudentProgressData } from "@data/studentProgress";
import {
  getProgram,
  listLessons,
  listLevels,
  listMaterials,
  listPrograms,
  listUnits,
} from "./queries";
import type {
  CurriculumDashboardData,
  CurriculumTree,
  Lesson,
  LessonNode,
  LessonSurface,
  Level,
  LevelNode,
  Material,
  ProgramNode,
  ProgramSurface,
  Unit,
  UnitNode,
} from "./types";

async function buildLessonNodes(
  unitId: string,
  tenantId: string,
): Promise<LessonNode[]> {
  const lessons = await listLessons(unitId, tenantId);
  return Promise.all(
    lessons.map(async (lesson): Promise<LessonNode> => {
      const materials = await listMaterials(lesson.id, tenantId);
      return { lesson, materials };
    }),
  );
}

async function buildUnitNodes(
  levelId: string,
  tenantId: string,
): Promise<UnitNode[]> {
  const units = await listUnits(levelId, tenantId);
  return Promise.all(
    units.map(async (unit): Promise<UnitNode> => {
      const lessons = await buildLessonNodes(unit.id, tenantId);
      return { unit, lessons };
    }),
  );
}

async function buildLevelNodes(
  programId: string,
  tenantId: string,
): Promise<LevelNode[]> {
  const levels = await listLevels(programId, tenantId);
  return Promise.all(
    levels.map(async (level): Promise<LevelNode> => {
      const units = await buildUnitNodes(level.id, tenantId);
      return { level, units };
    }),
  );
}

async function buildProgramNode(
  programId: string,
  tenantId: string,
): Promise<ProgramNode | null> {
  const program = await getProgram(programId, tenantId);
  if (!program) return null;
  const levels = await buildLevelNodes(program.id, tenantId);
  return { program, levels };
}

function countsForProgram(node: ProgramNode): {
  totalLevels: number;
  totalUnits: number;
  totalLessons: number;
  totalMaterials: number;
} {
  let totalUnits = 0;
  let totalLessons = 0;
  let totalMaterials = 0;
  for (const level of node.levels) {
    totalUnits += level.units.length;
    for (const unit of level.units) {
      totalLessons += unit.lessons.length;
      for (const lesson of unit.lessons) {
        totalMaterials += lesson.materials.length;
      }
    }
  }
  return {
    totalLevels: node.levels.length,
    totalUnits,
    totalLessons,
    totalMaterials,
  };
}

async function buildCurriculumTree(tenantId: string): Promise<CurriculumTree> {
  const programs = await listPrograms(tenantId);
  const programNodes = await Promise.all(
    programs.map(async (program): Promise<ProgramNode> => {
      const levels = await buildLevelNodes(program.id, tenantId);
      return { program, levels };
    }),
  );
  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    programs: programNodes,
  };
}

export async function getCurriculumDashboard(
  tenantId: string,
): Promise<CurriculumDashboardData> {
  await assertTenantAccess(tenantId);

  const tree = await buildCurriculumTree(tenantId);

  let totalLevels = 0;
  let totalUnits = 0;
  let totalLessons = 0;
  let totalMaterials = 0;
  let activePrograms = 0;
  for (const node of tree.programs) {
    if (node.program.is_active) activePrograms += 1;
    const counts = countsForProgram(node);
    totalLevels += counts.totalLevels;
    totalUnits += counts.totalUnits;
    totalLessons += counts.totalLessons;
    totalMaterials += counts.totalMaterials;
  }

  return {
    tenantId,
    generatedAt: tree.generatedAt,
    tree,
    kpis: {
      totalPrograms: tree.programs.length,
      totalLevels,
      totalUnits,
      totalLessons,
      totalMaterials,
      activePrograms,
    },
  };
}

export async function getProgramSurface(
  programId: string,
  tenantId: string,
): Promise<ProgramSurface | null> {
  await assertTenantAccess(tenantId);

  const node = await buildProgramNode(programId, tenantId);
  if (!node) return null;

  return {
    tenantId,
    program: node.program,
    tree: node,
    kpis: countsForProgram(node),
    generatedAt: new Date().toISOString(),
  };
}

export async function getLessonSurface(
  lessonId: string,
  tenantId: string,
): Promise<LessonSurface | null> {
  await assertTenantAccess(tenantId);

  const lessons = await findLessonById(lessonId, tenantId);
  if (!lessons) return null;

  const { lesson, unit, level, program } = lessons;
  const materials = await listMaterials(lesson.id, tenantId);
  const completions = await listStudentProgressData(
    { lesson_id: lesson.id },
    tenantId,
    { limit: 100 },
  );

  const studentsStarted = new Set(
    completions.filter((c) => c.status !== "not_started").map((c) => c.student_id),
  ).size;
  const studentsCompleted = new Set(
    completions.filter((c) => c.status === "completed").map((c) => c.student_id),
  ).size;
  const needsReview = completions.filter((c) => c.status === "needs_review").length;

  return {
    tenantId,
    lesson,
    unit,
    level,
    program,
    materials,
    recentCompletions: completions.slice(0, 25),
    kpis: {
      totalMaterials: materials.length,
      studentsStarted,
      studentsCompleted,
      needsReview,
    },
    generatedAt: new Date().toISOString(),
  };
}

async function findLessonById(
  lessonId: string,
  tenantId: string,
): Promise<{
  lesson: Lesson;
  unit: Unit | null;
  level: Level | null;
  program: import("./types").Program | null;
} | null> {
  const programs = await listPrograms(tenantId);
  for (const program of programs) {
    const levels = await listLevels(program.id, tenantId);
    for (const level of levels) {
      const units = await listUnits(level.id, tenantId);
      for (const unit of units) {
        const lessons = await listLessons(unit.id, tenantId);
        const found = lessons.find((l) => l.id === lessonId);
        if (found) {
          return { lesson: found, unit, level, program };
        }
      }
    }
  }
  return null;
}

export type { Material };
