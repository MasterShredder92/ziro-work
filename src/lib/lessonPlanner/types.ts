import type {
  LessonPlanRow,
  LessonPlanStatus,
  LessonPlanSource,
  LessonPlanFilter,
} from "@data/lessonPlans";
import type {
  LessonPlanVersionRow,
  LessonPlanVersionSource,
  LessonPlanVersionSnapshot,
} from "@data/lessonPlanVersions";
import type {
  LessonObjectiveRow,
  BloomLevel,
} from "@data/lessonObjectives";
import type {
  LessonActivityRow,
  LessonActivityKind,
} from "@data/lessonActivities";
import type {
  LessonMaterialLinkRow,
  LessonMaterialLinkKind,
} from "@data/lessonMaterialLinks";

export type LessonPlan = LessonPlanRow;
export type LessonPlanVersion = LessonPlanVersionRow;
export type LessonObjective = LessonObjectiveRow;
export type LessonActivity = LessonActivityRow;
export type LessonMaterialLink = LessonMaterialLinkRow;

export type {
  LessonPlanStatus,
  LessonPlanSource,
  LessonPlanFilter,
  LessonPlanVersionSource,
  LessonPlanVersionSnapshot,
  BloomLevel,
  LessonActivityKind,
  LessonMaterialLinkKind,
};

export type LessonPlanKpis = {
  totalPlans: number;
  plansCreated: number;
  plansUpdatedLast7d: number;
  aiDraftsLast30d: number;
  aiDraftUsagePct: number;
  curriculumAlignmentPct: number;
  materialsLinkedPerPlan: number;
  objectivesPerPlan: number;
  activitiesPerPlan: number;
  statusBreakdown: {
    draft: number;
    ready: number;
    published: number;
    archived: number;
  };
};

export type LessonPlanSummary = {
  plan: LessonPlan;
  objectiveCount: number;
  activityCount: number;
  materialCount: number;
  versionCount: number;
  lastVersionAt: string | null;
  hasAIDraft: boolean;
};

export type LessonPlannerDashboardData = {
  tenantId: string;
  generatedAt: string;
  plans: LessonPlanSummary[];
  kpis: LessonPlanKpis;
};

export type LessonPlanSurface = {
  tenantId: string;
  plan: LessonPlan;
  objectives: LessonObjective[];
  activities: LessonActivity[];
  materials: LessonMaterialLink[];
  versions: LessonPlanVersion[];
  latestVersion: LessonPlanVersion | null;
  kpis: {
    objectiveCount: number;
    activityCount: number;
    materialCount: number;
    versionCount: number;
    totalDurationMinutes: number;
    aiDraftCount: number;
    curriculumAlignmentPct: number;
  };
  generatedAt: string;
};

export type AIDraftObjective = {
  text: string;
  bloom_level?: BloomLevel | null;
  standard_code?: string | null;
};

export type AIDraftActivity = {
  title: string;
  description?: string | null;
  kind?: LessonActivityKind;
  duration_minutes?: number | null;
  grouping?: string | null;
  resources?: string[];
};

export type AIDraftMaterial = {
  title: string;
  url?: string | null;
  kind?: LessonMaterialLinkKind;
  notes?: string | null;
  is_required?: boolean;
};

export type AIDraftRequest = {
  tenantId: string;
  planId?: string | null;
  title?: string;
  subject?: string | null;
  gradeLevel?: string | null;
  durationMinutes?: number | null;
  programId?: string | null;
  unitId?: string | null;
  lessonId?: string | null;
  teacherId?: string | null;
  standards?: string[];
  prompt?: string;
  focusAreas?: string[];
  notes?: string | null;
};

export type AIDraftResult = {
  title: string;
  summary: string;
  objectives: AIDraftObjective[];
  activities: AIDraftActivity[];
  materials: AIDraftMaterial[];
  standards: string[];
  curriculumAlignment: string[];
  estimatedDurationMinutes: number;
  notes?: string | null;
  model: string;
  prompt: string;
  generatedAt: string;
};
