import type {
  Room,
  ScheduleBlock,
  Student,
  Teacher,
} from "@/lib/types/entities";

export type ScheduleRange = {
  start: string;
  end: string;
};

export type ConflictItem = {
  id: string;
  kind: "teacher_overlap" | "room_overlap" | "student_overlap";
  blockDate: string;
  startTime: string;
  endTime: string;
  teacherId: string | null;
  roomId: string | null;
  studentId: string | null;
  locationId: string | null;
  conflictWithBlockIds: string[];
  reason: string;
};

export type SuggestedSlot = {
  teacherId: string;
  roomId: string | null;
  blockDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  score: number;
  rationale: string;
};

export type TeacherAvailabilityBucket = {
  dayOfWeek: number;
  hour: number;
  blockCount: number;
  totalMinutes: number;
};

export type TeacherAvailability = {
  teacherId: string;
  tenantId: string;
  range: ScheduleRange;
  totalBlocks: number;
  totalMinutes: number;
  buckets: TeacherAvailabilityBucket[];
  weeklyHours: number;
  utilizationPct: number;
};

export type RoomAvailabilityBucket = {
  dayOfWeek: number;
  hour: number;
  blockCount: number;
  totalMinutes: number;
};

export type RoomAvailability = {
  roomId: string;
  tenantId: string;
  range: ScheduleRange;
  totalBlocks: number;
  totalMinutes: number;
  buckets: RoomAvailabilityBucket[];
  utilizationPct: number;
};

export type SchedulingDashboardData = {
  tenantId: string;
  range: ScheduleRange;
  generatedAt: string;
  blocks: ScheduleBlock[];
  teachers: Teacher[];
  rooms: Room[];
  students: Student[];
  conflicts: ConflictItem[];
  teacherAvailability: TeacherAvailability[];
  roomAvailability: RoomAvailability[];
  suggestions: SuggestedSlot[];
  kpis: {
    totalBlocks: number;
    totalTeachers: number;
    totalRooms: number;
    totalStudents: number;
    conflictsCount: number;
    weeklyLessonHours: number;
  };
};

export type { Room, ScheduleBlock, Student, Teacher };

// Scheduling OS foundation domain model
export type DateRange = {
  start: string; // ISO timestamp or YYYY-MM-DD
  end: string; // ISO timestamp or YYYY-MM-DD
};

export type TimeRange = {
  start: string; // HH:mm
  end: string; // HH:mm
};

export type AppointmentStatus = "scheduled" | "canceled" | "completed";

export type RecurrenceRule =
  | {
      type: "daily";
      interval?: number;
    }
  | {
      type: "weekly";
      interval?: number;
      weekdays?: number[]; // 0-6
    }
  | {
      type: "custom";
      interval?: number;
      weekdays?: number[];
      until?: string | null;
    };

export type AvailabilityBlock = {
  id: string;
  tenantId: string;
  scheduleId: string;
  dayOfWeek: number; // 0-6
  range: TimeRange;
  createdAt: string;
  updatedAt: string;
};

export type Appointment = {
  id: string;
  tenantId: string;
  scheduleId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes: string | null;
  recurrence: RecurrenceRule | null;
  color: string | null;
  seriesParentId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Schedule = {
  id: string;
  tenantId: string;
  name: string;
  color?: string | null;
  timezone: string;
  isActive: boolean;
  availabilityBlocks: AvailabilityBlock[];
  createdAt: string;
  updatedAt: string;
};

export type ExpandedAvailabilityRange = {
  id: string;
  sourceBlockId: string;
  tenantId: string;
  scheduleId: string;
  startsAt: string;
  endsAt: string;
};

export type AppointmentConflict = {
  appointmentId: string;
  type: "overlap" | "outsideAvailability";
  conflictingWith?: string;
};
