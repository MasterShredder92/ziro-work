/**
 * Scheduling & Calendar OS - core types.
 *
 * These types describe the new event-based scheduling layer that sits alongside
 * the existing `schedule_blocks` / `session_log` tables. Where possible,
 * LessonEvent maps 1:1 with the legacy `schedule_blocks` row so integrations
 * with Attendance OS / Billing OS / Messaging OS are transparent.
 */

export type ISODateString = string;
export type ISOTimeString = string;
export type ISODateTimeString = string;

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export interface RecurringRule {
  id: string;
  tenantId: string;
  frequency: RecurrenceFrequency;
  interval: number;
  byWeekday?: number[] | null;
  startDate: ISODateString;
  endDate?: ISODateString | null;
  count?: number | null;
  exceptions?: ISODateString[];
  createdAt?: ISODateTimeString | null;
  updatedAt?: ISODateTimeString | null;
}

export type RecurringRuleInsert = Omit<RecurringRule, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};
export type RecurringRuleUpdate = Partial<Omit<RecurringRule, "id" | "tenantId">>;

export type LessonEventStatus =
  | "scheduled"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show"
  | "rescheduled";

export type LessonEventKind =
  | "lesson"
  | "group"
  | "makeup"
  | "evaluation"
  | "hold"
  | "event"
  | "other";

export interface LessonEvent {
  id: string;
  tenantId: string;
  recurrenceId?: string | null;
  title: string;
  kind: LessonEventKind;
  status: LessonEventStatus;
  teacherId: string | null;
  studentId: string | null;
  familyId: string | null;
  roomId: string | null;
  locationId: string | null;
  startTime: ISODateTimeString;
  endTime: ISODateTimeString;
  notes?: string | null;
  color?: string | null;
  createdBy?: string | null;
  createdAt?: ISODateTimeString | null;
  updatedAt?: ISODateTimeString | null;
}

export type LessonEventInsert = Omit<
  LessonEvent,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
};
export type LessonEventUpdate = Partial<Omit<LessonEvent, "id" | "tenantId">>;

export interface TeacherAvailability {
  id: string;
  tenantId: string;
  teacherId: string;
  dayOfWeek: number; // 0-6 Sun..Sat
  startTime: ISOTimeString;
  endTime: ISOTimeString;
  effectiveFrom?: ISODateString | null;
  effectiveUntil?: ISODateString | null;
  notes?: string | null;
  createdAt?: ISODateTimeString | null;
  updatedAt?: ISODateTimeString | null;
}
export type TeacherAvailabilityInsert = Omit<
  TeacherAvailability,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };
export type TeacherAvailabilityUpdate = Partial<
  Omit<TeacherAvailability, "id" | "tenantId">
>;

export interface ScheduleRoom {
  id: string;
  tenantId: string;
  locationId: string | null;
  name: string;
  capacity: number;
  equipment: string[];
  roomType?: string | null;
  bookingRules?: Record<string, unknown> | null;
  isActive: boolean;
  displayOrder?: number | null;
  primaryInstruments?: string[] | null;
  floor?: number | null;
  color?: string | null;
  createdAt?: ISODateTimeString | null;
  updatedAt?: ISODateTimeString | null;
}
export type ScheduleRoomInsert = Omit<
  ScheduleRoom,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };
export type ScheduleRoomUpdate = Partial<Omit<ScheduleRoom, "id" | "tenantId">>;

export interface RoomBooking {
  id: string;
  tenantId: string;
  roomId: string;
  eventId: string | null;
  startTime: ISODateTimeString;
  endTime: ISODateTimeString;
  bookedBy?: string | null;
  purpose?: string | null;
  createdAt?: ISODateTimeString | null;
  updatedAt?: ISODateTimeString | null;
}
export type RoomBookingInsert = Omit<
  RoomBooking,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };
export type RoomBookingUpdate = Partial<Omit<RoomBooking, "id" | "tenantId">>;

export interface CalendarFeed {
  id: string;
  tenantId: string;
  ownerType: "teacher" | "student" | "family" | "room" | "tenant";
  ownerId: string | null;
  token: string;
  label: string;
  isActive: boolean;
  createdAt?: ISODateTimeString | null;
  updatedAt?: ISODateTimeString | null;
}
export type CalendarFeedInsert = Omit<
  CalendarFeed,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };
export type CalendarFeedUpdate = Partial<Omit<CalendarFeed, "id" | "tenantId">>;

export interface ScheduleConflict {
  id: string;
  kind: "teacher_overlap" | "room_overlap" | "student_overlap";
  eventIds: string[];
  startTime: ISODateTimeString;
  endTime: ISODateTimeString;
  teacherId: string | null;
  roomId: string | null;
  studentId: string | null;
  reason: string;
}

export interface ScheduleRange {
  start: ISODateTimeString;
  end: ISODateTimeString;
}

export interface ScheduleSuggestion {
  teacherId: string | null;
  roomId: string | null;
  startTime: ISODateTimeString;
  endTime: ISODateTimeString;
  score: number;
  rationale: string;
}
