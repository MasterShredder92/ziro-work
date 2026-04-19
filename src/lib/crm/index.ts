export {
  ingestIntake,
  convertLead,
  markLeadLost,
  logFollowup,
  sendFollowup,
  promoteLeadToStudent,
  scheduleFollowup,
  type IntakeIngestInput,
  type IntakeIngestResult,
  type ConvertLeadToStudentInput,
} from "./leadLifecycle";

export {
  listContacts,
  listEnrollments,
  getContactById,
  listStudentsScoped,
  listFamiliesScoped,
  listTeachersScoped,
  listLeadsScoped,
  searchCRM,
  getCRMKpis,
} from "./queries";

export {
  setStudentStage,
  createProspect,
  enrollStudentAsActive,
  canTransition as canStudentTransition,
} from "./studentLifecycle";

export {
  onboardTeacher,
  setTeacherStage,
  canTransition as canTeacherTransition,
} from "./teacherLifecycle";

export {
  enrollStudent,
  updateEnrollment,
  endEnrollment,
  listEnrollmentsFor,
  getEnrollment,
  type EnrollInput,
} from "./enrollmentEngine";

export {
  addStudentToFamily,
  removeStudentFromFamily,
  setPrimaryGuardian,
} from "./familyLinking";

export { listChannelsForContact, type ContactChannel } from "./messaging";
export {
  getFamilyBillingSummary,
  listStudentsForFamily,
  type FamilyBillingSummary,
} from "./billingIntegration";
export {
  getStudentSchedule,
  getTeacherSchedule,
  assignTeacherToStudent,
  getNextLessonLabelsForStudents,
  batchNextLessonSummariesForStudents,
  summarizeTeacherScheduleHeadline,
  batchTeacherScheduleHeadlines,
  type StudentScheduleEntry,
} from "./schedulingIntegration";
export {
  getStudentProgressSummary,
  type StudentProgressSummary,
} from "./progressIntegration";

export { crmProfileHref } from "./contactLinks";
export { summarizeNextLesson } from "./scheduleReadouts";
