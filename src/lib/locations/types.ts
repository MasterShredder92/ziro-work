import type {
  Location as DbLocation,
  Room as DbRoom,
  ScheduleBlock,
} from "@/lib/types/entities";

export type Location = DbLocation;
export type Room = DbRoom;

export type LocationRange = {
  start: string;
  end: string;
};

export type LocationWithRooms = {
  location: Location;
  rooms: Room[];
};

export type RoomScheduleSummary = {
  roomId: string;
  roomName: string;
  tenantId: string;
  locationId: string | null;
  range: LocationRange;
  totalBlocks: number;
  totalMinutes: number;
  utilizationPct: number;
  uniqueTeacherCount: number;
  uniqueStudentCount: number;
};

export type LocationScheduleSummary = {
  locationId: string;
  tenantId: string;
  range: LocationRange;
  totalBlocks: number;
  totalMinutes: number;
  weeklyHours: number;
  uniqueTeacherCount: number;
  uniqueStudentCount: number;
  roomSummaries: RoomScheduleSummary[];
};

export type LocationKpis = {
  totalTeachers: number;
  totalStudents: number;
  totalRooms: number;
  activeRooms: number;
  weeklyScheduleLoadHours: number;
  averageRoomUtilizationPct: number;
  conflicts: number;
};

export type LocationDashboardData = {
  location: Location;
  rooms: Room[];
  kpis: LocationKpis;
  scheduleSummary: LocationScheduleSummary;
  upcomingBlocks: ScheduleBlock[];
  generatedAt: string;
};

export type RoomSurfaceData = {
  room: Room;
  location: Location | null;
  summary: RoomScheduleSummary;
  upcomingBlocks: ScheduleBlock[];
  generatedAt: string;
};
