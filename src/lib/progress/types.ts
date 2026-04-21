import type {
  ProgressCheckpointRow,
  ProgressCheckpointStatus,
} from "@data/progressCheckpoints";
import type {
  ProgressEvidenceKind,
  ProgressEvidenceRow,
} from "@data/progressEvidence";
import type {
  ProgressGoalRow,
  ProgressGoalStatus,
} from "@data/progressGoals";
import type {
  ProgressSkillRow,
  ProgressSkillStatus,
} from "@data/progressSkills";
import type { Student } from "@/lib/types/entities";

export type ProgressGoal = ProgressGoalRow;
export type ProgressSkill = ProgressSkillRow;
export type ProgressCheckpoint = ProgressCheckpointRow;
export type ProgressEvidence = ProgressEvidenceRow;

export type { ProgressGoalStatus, ProgressSkillStatus, ProgressCheckpointStatus, ProgressEvidenceKind };

export type ProgressReport = {
  id: string;
  tenant_id: string;
  student_id: string;
  report_type: string;
  file_url: string;
  content: any;
  created_at: string;
  updated_at: string;
};

export type ProgressKpis = {
  totalGoals: number;
  goalsCompleted: number;
  totalSkills: number;
  skillsMastered: number;
  totalCheckpoints: number;
  checkpointsPassed: number;
  evidenceCount: number;
  teacherFeedbackDensity: number;
};

export type StudentProgressSummary = {
  studentId: string;
  tenantId: string;
  generatedAt: string;
  kpis: ProgressKpis;
  goals: ProgressGoal[];
  skills: ProgressSkill[];
  checkpoints: ProgressCheckpoint[];
  evidence: ProgressEvidence[];
};

export type ProgressSurfaceSkill = ProgressSkill & {
  checkpoints: ProgressSurfaceCheckpoint[];
};

export type ProgressSurfaceCheckpoint = ProgressCheckpoint & {
  evidence: ProgressEvidence[];
};

export type ProgressSurface = {
  studentId: string;
  tenantId: string;
  student: Student | null;
  generatedAt: string;
  kpis: ProgressKpis;
  goals: Array<
    ProgressGoal & {
      skills: ProgressSurfaceSkill[];
    }
  >;
};

export type ProgressDashboardData = {
  tenantId: string;
  generatedAt: string;
  students: Student[];
  summaries: StudentProgressSummary[];
  totals: ProgressKpis;
};
