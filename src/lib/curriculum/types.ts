import type { ProgramRow } from "@data/programs";
import type { LevelRow } from "@data/levels";
import type { UnitRow } from "@data/units";
import type { LessonRow } from "@data/lessons";
import type { MaterialRow, MaterialKind } from "@data/materials";
import type {
  LessonCompletionRow,
  LessonCompletionStatus,
} from "@data/studentProgress";

export type Program = ProgramRow;
export type Level = LevelRow;
export type Unit = UnitRow;
export type Lesson = LessonRow;
export type Material = MaterialRow;
export type LessonCompletion = LessonCompletionRow;
export type { MaterialKind, LessonCompletionStatus };

export type LessonNode = {
  lesson: Lesson;
  materials: Material[];
};

export type UnitNode = {
  unit: Unit;
  lessons: LessonNode[];
};

export type LevelNode = {
  level: Level;
  units: UnitNode[];
};

export type ProgramNode = {
  program: Program;
  levels: LevelNode[];
};

export type CurriculumTree = {
  tenantId: string;
  generatedAt: string;
  programs: ProgramNode[];
};

export type StudentProgressSummary = {
  studentId: string;
  programId: string | null;
  lessonsStarted: number;
  lessonsCompleted: number;
  lessonsNeedingReview: number;
  totalLessons: number;
  completionPct: number;
  lastActivityAt: string | null;
};

export type StudentProgress = {
  studentId: string;
  tenantId: string;
  entries: LessonCompletion[];
  summaries: StudentProgressSummary[];
  generatedAt: string;
};

export type ProgramSurface = {
  tenantId: string;
  program: Program;
  tree: ProgramNode;
  kpis: {
    totalLevels: number;
    totalUnits: number;
    totalLessons: number;
    totalMaterials: number;
  };
  generatedAt: string;
};

export type LessonSurface = {
  tenantId: string;
  lesson: Lesson;
  unit: Unit | null;
  level: Level | null;
  program: Program | null;
  materials: Material[];
  recentCompletions: LessonCompletion[];
  kpis: {
    totalMaterials: number;
    studentsStarted: number;
    studentsCompleted: number;
    needsReview: number;
  };
  generatedAt: string;
};

export type CurriculumDashboardData = {
  tenantId: string;
  generatedAt: string;
  tree: CurriculumTree;
  kpis: {
    totalPrograms: number;
    totalLevels: number;
    totalUnits: number;
    totalLessons: number;
    totalMaterials: number;
    activePrograms: number;
  };
};
