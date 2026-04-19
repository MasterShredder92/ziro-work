/**
 * Page Intelligence Map.
 *
 * Given a pathname, returns which agent should appear, what they should say,
 * and a small set of quick actions. Extensible without DB — purely static for now.
 *
 * Page → Agent → Behavior (per AgentOS spec):
 *   /dashboard          → Ziro
 *   /leads              → Star
 *   /students           → Star + Stewie
 *   /schedule           → Ruby
 *   /tasks              → Ziro
 *   /billing            → Bub
 *   /inbox              → Vader
 */

export type QuickActionIntent =
  | "nav"
  | "summon"
  | "analyze"
  | "pointer"
  | "open-chat"
  | "custom";

export type QuickAction = {
  id: string;
  label: string;
  icon?: string; // lucide-react icon name (resolved at render time)
  intent: QuickActionIntent;
  /** For "nav" intent: absolute pathname */
  href?: string;
  /** For "pointer" intent: CSS selector on the page to point at */
  target?: string;
  /** Tooltip line shown in pointer mode */
  pointerText?: string;
  /** Optional native tooltip (otherwise AgentBubble derives one). */
  tooltip?: string;
  /** Free-form payload for custom intents */
  payload?: Record<string, unknown>;
};

export type PageType =
  | "dashboard"
  | "leads"
  | "students"
  | "schedule"
  | "tasks"
  | "billing"
  | "inbox"
  | "teachers"
  | "families"
  | "lifecycle"
  | "reports"
  | "reports_dashboard"
  | "report_surface"
  | "director_dashboard"
  | "automation_dashboard"
  | "automation_rule"
  | "automation_workflow"
  | "automation_run"
  | "templates_dashboard"
  | "template_surface"
  | "templates_editor"
  | "forms_dashboard"
  | "form_surface"
  | "form_submission"
  | "files_dashboard"
  | "file_explorer"
  | "file_shares"
  | "files_signatures"
  | "public_share_link"
  | "file_surface"
  | "signature_request"
  | "curriculum_dashboard"
  | "program_surface"
  | "lesson_surface"
  | "progress_dashboard"
  | "progress_surface"
  | "assessments_dashboard"
  | "assessment_surface"
  | "assessment_attempt"
  | "inventory_dashboard"
  | "inventory_item_surface"
  | "attendance_dashboard"
  | "attendance_student"
  | "attendance_session"
  | "content_dashboard"
  | "content_explorer"
  | "content_editor"
  | "billing_dashboard"
  | "billing_invoice"
  | "billing_subscription"
  | "crm_dashboard"
  | "crm_contact"
  | "crm_student"
  | "crm_family"
  | "crm_teacher"
  | "crm_leads"
  | "crm_leads_pipeline"
  | "crm_enrollments"
  | "admin_dashboard"
  | "admin_roles"
  | "admin_settings"
  | "admin_audit"
  | "branding_dashboard"
  | "branding_theme"
  | "branding_domain"
  | "schedule_dashboard"
  | "schedule_event"
  | "schedule_room"
  | "messages_dashboard"
  | "message_thread"
  | "crm_student_progress"
  | "crm_student_progress_lesson"
  | "crm_student_billing_invoice"
  | "default";

export type PageRecommendedSkill = {
  agent: string;
  skillId: string;
  title: string;
};

export type PageBinding = {
  /** Stable key for the page type (used for recommended-skill lookups). */
  pageType?: PageType;
  /** Primary agent for the page (matches by getAgentMetadata id). */
  primaryAgentId: string;
  /** Optional secondary agent(s) that may also appear (orbiting). */
  secondaryAgentIds?: string[];
  /** Single-sentence guidance line shown in the bubble. */
  guidance: string;
  /** Quick actions shown in the bubble. */
  quickActions: QuickAction[];
  /** Skills recommended for this page, grouped per agent. */
  recommendedSkills?: PageRecommendedSkill[];
  /** Human-readable page label — fallback title. */
  label?: string;
};

type Rule = {
  match: (pathname: string) => boolean;
  binding: PageBinding;
  /**
   * Higher wins when multiple rules match. Omitted rules use index-based defaults
   * so existing first-match behavior is preserved except where explicitly overridden.
   */
  specificity?: number;
};

const PAGE_RECOMMENDED_SKILLS: Record<PageType, PageRecommendedSkill[]> = {
  dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "ziro", skillId: "usageReport", title: "Usage Report" },
  ],
  leads: [
    { agent: "star", skillId: "hotLeads", title: "Hot Leads" },
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
  ],
  students: [
    { agent: "star", skillId: "promoteLead", title: "Promote Lead" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
  ],
  schedule: [
    { agent: "ruby", skillId: "findAvailability", title: "Find Availability" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  tasks: [
    { agent: "ziro", skillId: "systemCheck", title: "System Check" },
  ],
  billing: [
    { agent: "bub", skillId: "invoiceAgingReport", title: "Invoice Aging" },
    { agent: "bub", skillId: "listOutstanding", title: "Outstanding" },
  ],
  inbox: [],
  teachers: [
    { agent: "ruby", skillId: "teacherLoadReport", title: "Teacher Load" },
  ],
  families: [],
  lifecycle: [],
  reports: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "ziro", skillId: "usageReport", title: "Usage Report" },
  ],
  reports_dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "ziro", skillId: "usageReport", title: "Usage Report" },
    { agent: "ruby", skillId: "teacherLoadReport", title: "Teacher Load Report" },
    { agent: "bub", skillId: "invoiceAgingReport", title: "Invoice Aging Report" },
    { agent: "star", skillId: "hotLeads", title: "Hot Leads" },
  ],
  report_surface: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "ziro", skillId: "usageReport", title: "Usage Report" },
    { agent: "ruby", skillId: "teacherLoadReport", title: "Teacher Load Report" },
    { agent: "bub", skillId: "invoiceAgingReport", title: "Invoice Aging Report" },
    { agent: "star", skillId: "hotLeads", title: "Hot Leads" },
  ],
  director_dashboard: [
    { agent: "star", skillId: "hotLeads", title: "Hot Leads" },
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
    { agent: "ruby", skillId: "teacherLoadReport", title: "Teacher Load Report" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
    { agent: "bub", skillId: "invoiceAgingReport", title: "Invoice Aging Report" },
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "ziro", skillId: "usageReport", title: "Usage Report" },
  ],
  automation_dashboard: [
    { agent: "ziro", skillId: "usageReport", title: "Usage Report" },
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  automation_rule: [
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "ziro", skillId: "usageReport", title: "Usage Report" },
  ],
  automation_workflow: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  automation_run: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  templates_dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  template_surface: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  templates_editor: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  forms_dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageFamily", title: "Message Family" },
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
  ],
  form_surface: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageFamily", title: "Message Family" },
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
  ],
  form_submission: [
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageFamily", title: "Message Family" },
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
  ],
  files_dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
  ],
  file_explorer: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
  ],
  file_shares: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
  ],
  files_signatures: [
    { agent: "vader", skillId: "signatureFlow", title: "Signature workflow" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Signer follow-up" },
  ],
  public_share_link: [],
  file_surface: [
    { agent: "ziro", skillId: "fileVersioning", title: "Versions & uploads" },
    { agent: "stewie", skillId: "shareLinkMgmt", title: "Share links" },
  ],
  signature_request: [
    { agent: "vader", skillId: "signatureFlow", title: "Signature workflow" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Signer follow-up" },
  ],
  curriculum_dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
  ],
  program_surface: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
  ],
  lesson_surface: [
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
  ],
  progress_dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  progress_surface: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  assessments_dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "vader", skillId: "messageStudent", title: "Message Student" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  assessment_surface: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "vader", skillId: "messageStudent", title: "Message Student" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  assessment_attempt: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "vader", skillId: "messageStudent", title: "Message Student" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  inventory_dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  inventory_item_surface: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  attendance_dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  attendance_student: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  attendance_session: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  content_dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  content_explorer: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  content_editor: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  billing_dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "bub", skillId: "invoiceAgingReport", title: "Invoice Aging" },
    { agent: "bub", skillId: "listOutstanding", title: "Outstanding" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  billing_invoice: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  billing_subscription: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  crm_dashboard: [
    { agent: "star", skillId: "hotLeads", title: "Hot Leads" },
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
  ],
  crm_contact: [
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
  ],
  crm_student: [
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  crm_student_progress: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  crm_student_progress_lesson: [
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
  ],
  crm_student_billing_invoice: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  crm_family: [
    { agent: "vader", skillId: "messageFamily", title: "Message Family" },
    { agent: "bub", skillId: "invoiceAgingReport", title: "Invoice Aging" },
  ],
  crm_teacher: [
    { agent: "ruby", skillId: "teacherLoadReport", title: "Teacher Load" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
  ],
  crm_leads: [
    { agent: "star", skillId: "hotLeads", title: "Hot Leads" },
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
  ],
  crm_leads_pipeline: [
    { agent: "star", skillId: "hotLeads", title: "Hot Leads" },
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
  ],
  crm_enrollments: [
    { agent: "star", skillId: "qualifyLead", title: "Qualify Lead" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
  ],
  admin_dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
  ],
  admin_roles: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  admin_settings: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
  ],
  admin_audit: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
  ],
  branding_dashboard: [
    { agent: "ziro", skillId: "ziro.kpiSnapshot", title: "KPI Snapshot" },
    { agent: "ruby", skillId: "ruby.detectConflicts", title: "Detect Conflicts" },
    { agent: "stewie", skillId: "stewie.scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "vader.messageTeacher", title: "Message Teacher" },
  ],
  branding_theme: [
    { agent: "ziro", skillId: "ziro.kpiSnapshot", title: "KPI Snapshot" },
    { agent: "ruby", skillId: "ruby.detectConflicts", title: "Detect Conflicts" },
    { agent: "stewie", skillId: "stewie.scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "vader.messageTeacher", title: "Message Teacher" },
  ],
  branding_domain: [
    { agent: "ziro", skillId: "ziro.kpiSnapshot", title: "KPI Snapshot" },
    { agent: "ruby", skillId: "ruby.detectConflicts", title: "Detect Conflicts" },
    { agent: "stewie", skillId: "stewie.scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "vader.messageTeacher", title: "Message Teacher" },
  ],
  schedule_dashboard: [
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
  ],
  schedule_event: [
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
  ],
  schedule_room: [
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
  ],
  messages_dashboard: [
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
  ],
  message_thread: [
    { agent: "vader", skillId: "messageTeacher", title: "Message Teacher" },
    { agent: "stewie", skillId: "scheduleFollowup", title: "Schedule Followup" },
    { agent: "ruby", skillId: "detectConflicts", title: "Detect Conflicts" },
    { agent: "ziro", skillId: "kpiSnapshot", title: "KPI Snapshot" },
  ],
  default: [],
};

const rules: Rule[] = [
  {
    match: (p) => p.startsWith("/admin/branding/theme"),
    binding: {
      pageType: "branding_theme",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["ruby", "stewie", "vader"],
      guidance:
        "Theme editor — tune palette, typography, and preview before publish.",
      label: "Branding theme",
      quickActions: [
        {
          id: "back",
          label: "Branding home",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/admin/branding",
        },
        {
          id: "preview",
          label: "Live preview",
          icon: "Eye",
          intent: "nav",
          href: "/admin/branding/preview",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/admin/branding/domain"),
    binding: {
      pageType: "branding_domain",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["ruby", "stewie", "vader"],
      guidance:
        "Custom domain — add a hostname, verify CNAME, then activate.",
      label: "Branding domain",
      quickActions: [
        {
          id: "back",
          label: "Branding home",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/admin/branding",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "share-link",
          label: "Share Link",
          icon: "Link",
          intent: "custom",
          payload: { domainAction: "files.share.create" },
        },
        {
          id: "update-permissions",
          label: "Update Permissions",
          icon: "ShieldCheck",
          intent: "custom",
          payload: { domainAction: "files.permissions.update" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/admin/branding"),
    binding: {
      pageType: "branding_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["ruby", "stewie", "vader"],
      guidance:
        "Branding OS — logos, theme, domain, email identity, and portal layouts.",
      label: "Branding",
      quickActions: [
        {
          id: "theme",
          label: "Theme editor",
          icon: "Palette",
          intent: "nav",
          href: "/admin/branding/theme",
        },
        {
          id: "domain",
          label: "Domains",
          icon: "Globe",
          intent: "nav",
          href: "/admin/branding/domain",
        },
        {
          id: "preview",
          label: "Live preview",
          icon: "Eye",
          intent: "nav",
          href: "/admin/branding/preview",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "edit-event",
          label: "Edit Event",
          icon: "Pencil",
          intent: "custom",
          payload: { domainAction: "schedule.edit" },
        },
      ],
    },
  },
  {
    match: (p) => p === "/admin" || p === "/admin/",
    binding: {
      pageType: "admin_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["ruby", "stewie", "vader"],
      guidance:
        "Tenant administration — roles, permissions, settings, flags, audit.",
      label: "Admin",
      quickActions: [
        {
          id: "roles",
          label: "Roles",
          icon: "Users",
          intent: "nav",
          href: "/admin/roles",
        },
        {
          id: "settings",
          label: "Settings",
          icon: "Settings",
          intent: "nav",
          href: "/admin/settings",
        },
        {
          id: "audit",
          label: "Audit",
          icon: "History",
          intent: "nav",
          href: "/admin/audit",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "share-link",
          label: "Share Link",
          icon: "Link",
          intent: "custom",
          payload: { domainAction: "files.share.create" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/admin/roles") || p.startsWith("/admin/permissions"),
    binding: {
      pageType: "admin_roles",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["ruby"],
      guidance:
        "Design roles & permission bundles. Safe updates prevent admin lockout.",
      label: "Roles & permissions",
      quickActions: [
        {
          id: "back",
          label: "All roles",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/admin/roles",
        },
        {
          id: "matrix",
          label: "Matrix",
          icon: "Grid3x3",
          intent: "nav",
          href: "/admin/permissions",
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) =>
      p.startsWith("/admin/settings") || p.startsWith("/admin/feature-flags"),
    binding: {
      pageType: "admin_settings",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader"],
      guidance:
        "Tenant branding, billing/scheduling/messaging settings, feature flags.",
      label: "Tenant settings",
      quickActions: [
        {
          id: "audit",
          label: "Audit log",
          icon: "History",
          intent: "nav",
          href: "/admin/audit",
        },
        {
          id: "flags",
          label: "Feature flags",
          icon: "Flag",
          intent: "nav",
          href: "/admin/feature-flags",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
      ],
    },
  },
  {
    match: (p) =>
      p.startsWith("/admin/audit") || p.startsWith("/admin/system-health"),
    binding: {
      pageType: "admin_audit",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["ruby"],
      guidance:
        "Search audit entries, review diffs, export CSV. Investigate anomalies.",
      label: "Audit & health",
      quickActions: [
        {
          id: "export",
          label: "Export CSV",
          icon: "Download",
          intent: "custom",
          payload: { href: "/api/admin/audit?format=csv" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => /^\/crm\/contacts\/[^/]+$/.test(p),
    binding: {
      pageType: "crm_contact",
      primaryAgentId: "stewie",
      secondaryAgentIds: ["vader", "star", "ziro"],
      guidance:
        "Contact surface — review timeline, message, qualify, or schedule a follow-up.",
      label: "Contact",
      quickActions: [
        { id: "back", label: "All contacts", icon: "ArrowLeft", intent: "nav", href: "/crm/contacts" },
        { id: "followup", label: "Schedule Follow-up", icon: "CalendarClock", intent: "custom", payload: { skill: "scheduleFollowup" } },
        { id: "message-teacher", label: "Message Teacher", icon: "MessageSquare", intent: "custom", payload: { skill: "messageTeacher" } },
        { id: "qualify", label: "Qualify Lead", icon: "UserCheck", intent: "custom", payload: { skill: "qualifyLead" } },
      ],
    },
  },
  {
    match: (p) => /^\/crm\/students\/[^/]+$/.test(p),
    binding: {
      pageType: "crm_student",
      primaryAgentId: "stewie",
      secondaryAgentIds: ["ruby", "vader", "ziro"],
      guidance:
        "Student profile — review schedule, progress, attendance, and billing.",
      label: "CRM Student",
      quickActions: [
        { id: "back", label: "All students", icon: "ArrowLeft", intent: "nav", href: "/crm/students" },
        { id: "followup", label: "Schedule Follow-up", icon: "CalendarClock", intent: "custom", payload: { skill: "scheduleFollowup" } },
        { id: "message-teacher", label: "Message Teacher", icon: "MessageSquare", intent: "custom", payload: { skill: "messageTeacher" } },
        { id: "update-student", label: "Update Profile", icon: "Pencil", intent: "custom", payload: { domainAction: "crm.student.update" } },
        { id: "detect-conflicts", label: "Detect Conflicts", icon: "AlertTriangle", intent: "custom", payload: { skill: "detectConflicts" } },
        { id: "kpis", label: "KPI Snapshot", icon: "BarChart3", intent: "custom", payload: { skill: "kpiSnapshot" } },
      ],
    },
  },
  {
    specificity: 9700,
    match: (p) => /^\/crm\/students\/[^/]+\/billing\/invoices\/[^/]+/.test(p),
    binding: {
      pageType: "crm_student_billing_invoice",
      primaryAgentId: "bub",
      secondaryAgentIds: ["ziro", "vader", "stewie", "ruby"],
      guidance:
        "Student billing — review this invoice in context of the student record.",
      label: "Student invoice",
      quickActions: [
        {
          id: "back-student",
          label: "Student profile",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/crm/students",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "record-payment",
          label: "Record Payment",
          icon: "CreditCard",
          intent: "custom",
          payload: { domainAction: "billing.payment.record" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
      ],
    },
  },
  {
    specificity: 9650,
    match: (p) => /^\/crm\/students\/[^/]+\/progress\/lesson\/[^/]+/.test(p),
    binding: {
      pageType: "crm_student_progress_lesson",
      primaryAgentId: "ruby",
      secondaryAgentIds: ["stewie", "ziro", "star"],
      guidance:
        "Lesson under this student’s progress — resolve conflicts or queue follow-ups.",
      label: "Student lesson",
      quickActions: [
        {
          id: "back-student",
          label: "Student profile",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/crm/students",
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
      ],
    },
  },
  {
    specificity: 9600,
    match: (p) => /^\/crm\/students\/[^/]+\/progress(?:\/|$)/.test(p),
    binding: {
      pageType: "crm_student_progress",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Student progress hub — goals, skills, and evidence for this learner.",
      label: "Student progress",
      quickActions: [
        {
          id: "back-student",
          label: "Student profile",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/crm/students",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
      ],
    },
  },
  {
    match: (p) => /^\/crm\/families\/[^/]+$/.test(p),
    binding: {
      pageType: "crm_family",
      primaryAgentId: "vader",
      secondaryAgentIds: ["bub", "stewie", "ziro"],
      guidance:
        "Family profile — message householders, review billing, and manage linked students.",
      label: "CRM Family",
      quickActions: [
        { id: "back", label: "All families", icon: "ArrowLeft", intent: "nav", href: "/crm/families" },
        { id: "message-family", label: "Message Family", icon: "MessageSquare", intent: "custom", payload: { skill: "messageFamily" } },
        { id: "update-family", label: "Update Profile", icon: "Pencil", intent: "custom", payload: { domainAction: "crm.family.update" } },
        { id: "invoice-aging", label: "Invoice Aging", icon: "Receipt", intent: "custom", payload: { skill: "invoiceAgingReport" } },
        { id: "followup", label: "Schedule Follow-up", icon: "CalendarClock", intent: "custom", payload: { skill: "scheduleFollowup" } },
      ],
    },
  },
  {
    match: (p) => /^\/crm\/teachers\/[^/]+$/.test(p),
    binding: {
      pageType: "crm_teacher",
      primaryAgentId: "ruby",
      secondaryAgentIds: ["vader", "stewie", "ziro"],
      guidance:
        "Teacher profile — review load, availability, and assigned students.",
      label: "CRM Teacher",
      quickActions: [
        { id: "back", label: "All teachers", icon: "ArrowLeft", intent: "nav", href: "/crm/teachers" },
        { id: "teacher-load", label: "Teacher Load", icon: "Users", intent: "custom", payload: { skill: "teacherLoadReport" } },
        { id: "detect-conflicts", label: "Detect Conflicts", icon: "AlertTriangle", intent: "custom", payload: { skill: "detectConflicts" } },
        { id: "update-teacher", label: "Update Profile", icon: "Pencil", intent: "custom", payload: { domainAction: "crm.teacher.update" } },
        { id: "message-teacher", label: "Message Teacher", icon: "MessageSquare", intent: "custom", payload: { skill: "messageTeacher" } },
      ],
    },
  },
  {
    match: (p) => p === "/crm/leads" || p.startsWith("/crm/leads/"),
    binding: {
      pageType: "crm_leads_pipeline",
      primaryAgentId: "star",
      secondaryAgentIds: ["stewie", "ziro"],
      guidance:
        "Lead pipeline — move stages, convert to students, and queue follow-ups.",
      label: "CRM Leads",
      quickActions: [
        { id: "contacts", label: "Contacts", icon: "Users", intent: "nav", href: "/crm/contacts" },
        { id: "students", label: "Students", icon: "GraduationCap", intent: "nav", href: "/crm/students" },
        { id: "hot-leads", label: "Hot Leads", icon: "Flame", intent: "custom", payload: { skill: "hotLeads" } },
      ],
    },
  },
  {
    match: (p) => p === "/crm/enrollments" || p.startsWith("/crm/enrollments/"),
    binding: {
      pageType: "crm_enrollments",
      primaryAgentId: "stewie",
      secondaryAgentIds: ["star", "ziro"],
      guidance:
        "Enrollment manager — filter by teacher or status, then save inline updates.",
      label: "CRM Enrollments",
      quickActions: [
        { id: "students", label: "Students", icon: "GraduationCap", intent: "nav", href: "/crm/students" },
        { id: "teachers", label: "Teachers", icon: "UserCog", intent: "nav", href: "/crm/teachers" },
        { id: "schedule-followup", label: "Schedule Follow-up", icon: "CalendarClock", intent: "custom", payload: { skill: "scheduleFollowup" } },
      ],
    },
  },
  {
    specificity: 1,
    match: (p) => p === "/crm" || p.startsWith("/crm/"),
    binding: {
      pageType: "crm_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby", "star"],
      guidance:
        "CRM OS — contacts, students, families, teachers, and enrollments.",
      label: "CRM",
      quickActions: [
        { id: "contacts", label: "Contacts", icon: "Users", intent: "nav", href: "/crm/contacts" },
        { id: "students", label: "Students", icon: "GraduationCap", intent: "nav", href: "/crm/students" },
        { id: "families", label: "Families", icon: "Home", intent: "nav", href: "/crm/families" },
        { id: "teachers", label: "Teachers", icon: "UserCog", intent: "nav", href: "/crm/teachers" },
        { id: "leads", label: "Lead Pipeline", icon: "Flame", intent: "nav", href: "/crm/leads" },
        { id: "hot-leads", label: "Hot Leads", icon: "Flame", intent: "custom", payload: { skill: "hotLeads" } },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/director"),
    binding: {
      pageType: "director_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["star", "ruby", "bub"],
      guidance: "Cross-location operations — pick an automation to run.",
      label: "Director",
      quickActions: [
        { id: "workflow", label: "Run Director Workflow", icon: "Workflow", intent: "analyze" },
        { id: "kpis", label: "KPI Snapshot", icon: "BarChart3", intent: "custom", payload: { skill: "kpiSnapshot" } },
        { id: "teacher-load", label: "Teacher Load", icon: "Users", intent: "custom", payload: { skill: "teacherLoadReport" } },
        { id: "invoice-aging", label: "Invoice Aging", icon: "Receipt", intent: "custom", payload: { skill: "invoiceAgingReport" } },
        { id: "hot-leads", label: "Hot Leads", icon: "Flame", intent: "custom", payload: { skill: "hotLeads" } },
      ],
      recommendedSkills: [],
    },
  },
  {
    match: (p) => /^\/content\/folder\/[^/]+$/.test(p),
    binding: {
      pageType: "content_explorer",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Browse this folder — move items, edit tags, or open the editor.",
      label: "Content Folder",
      quickActions: [
        {
          id: "back",
          label: "All content",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/content",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => /^\/content\/[^/]+$/.test(p),
    binding: {
      pageType: "content_editor",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Edit content, add assets, and publish new versions.",
      label: "Content Editor",
      quickActions: [
        {
          id: "back",
          label: "All content",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/content",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => p === "/content" || p === "/content/",
    binding: {
      pageType: "content_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Content Library — browse, search, and curate learning materials.",
      label: "Content Library",
      quickActions: [
        {
          id: "new-item",
          label: "New item",
          icon: "FilePlus",
          intent: "nav",
          href: "/content#upload",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => p === "/templates" || p === "/templates/",
    binding: {
      pageType: "templates_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Design reusable templates with merge fields for families, teachers, and students.",
      label: "Templates",
      quickActions: [
        {
          id: "new-template",
          label: "New template",
          icon: "FilePlus",
          intent: "nav",
          href: "/templates/new",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
      ],
      recommendedSkills: [],
    },
  },
  {
    match: (p) => /^\/templates\/[^/]+$/.test(p),
    binding: {
      pageType: "templates_editor",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Edit template content, preview with sample data, and publish a new version.",
      label: "Template editor",
      quickActions: [
        {
          id: "back",
          label: "All templates",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/templates",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
      recommendedSkills: [],
    },
  },
  {
    match: (p) =>
      /^\/files\/signatures\/(?!new$)[^/]+$/.test(p) || /^\/files\/sign\//.test(p),
    binding: {
      pageType: "signature_request",
      primaryAgentId: "stewie",
      secondaryAgentIds: ["vader", "ziro"],
      guidance:
        "Signature request — track status, nudge signers, or schedule a follow-up.",
      label: "Signature request",
      quickActions: [
        {
          id: "back",
          label: "All signatures",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/files/signatures",
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
      ],
    },
  },
  {
    match: (p) =>
      p === "/files/signatures" ||
      p === "/files/signatures/" ||
      p === "/files/signatures/new" ||
      p.startsWith("/files/signatures/new?"),
    binding: {
      pageType: "files_signatures",
      primaryAgentId: "stewie",
      secondaryAgentIds: ["vader", "ziro"],
      guidance:
        "Signature inbox — compose a request, assign signers and fields, then track completion.",
      label: "Signatures",
      quickActions: [
        {
          id: "files-home",
          label: "Files home",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/files",
        },
        {
          id: "explorer",
          label: "Explorer",
          icon: "Folder",
          intent: "nav",
          href: "/files/explorer",
        },
        {
          id: "sig-flow",
          label: "Signature tips",
          icon: "PenLine",
          intent: "custom",
          payload: { skill: "signatureFlow" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/files/explorer"),
    binding: {
      pageType: "file_explorer",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "File explorer — search, virtualized lists, multi-select, move/rename, folder tree, uploads.",
      label: "File explorer",
      quickActions: [
        {
          id: "back",
          label: "Files home",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/files",
        },
        {
          id: "upload",
          label: "Upload",
          icon: "Upload",
          intent: "nav",
          href: "/files/explorer?upload=1",
        },
        {
          id: "shares",
          label: "Share links",
          icon: "Link",
          intent: "nav",
          href: "/files/shares",
        },
        {
          id: "versioning",
          label: "Version tips",
          icon: "GitBranch",
          intent: "custom",
          payload: { skill: "fileVersioning" },
        },
      ],
      recommendedSkills: [],
    },
  },
  {
    match: (p) => p.startsWith("/files/shares"),
    binding: {
      pageType: "file_shares",
      primaryAgentId: "stewie",
      secondaryAgentIds: ["ziro", "vader"],
      guidance:
        "Manage share links — regenerate tokens, one-time view, expiry, and access limits.",
      label: "Share links",
      quickActions: [
        {
          id: "explorer",
          label: "Explorer",
          icon: "Folder",
          intent: "nav",
          href: "/files/explorer",
        },
        {
          id: "share-skill",
          label: "Share hygiene",
          icon: "Link",
          intent: "custom",
          payload: { skill: "shareLinkMgmt" },
        },
        {
          id: "usage",
          label: "Usage report",
          icon: "Activity",
          intent: "custom",
          payload: { skill: "usageReport" },
        },
      ],
      recommendedSkills: [],
    },
  },
  {
    match: (p) => /^\/files\/[^/]+$/.test(p) && p !== "/files/explorer" && p !== "/files/signatures" && p !== "/files/shares",
    binding: {
      pageType: "file_surface",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "File surface — preview, versions, permissions, share links, and signatures.",
      label: "File",
      quickActions: [
        {
          id: "back",
          label: "All files",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/files",
        },
        {
          id: "explorer",
          label: "Explorer",
          icon: "Folder",
          intent: "nav",
          href: "/files/explorer",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/files/share/"),
    binding: {
      pageType: "public_share_link",
      primaryAgentId: "stewie",
      secondaryAgentIds: ["ziro"],
      guidance:
        "Public share link — expiry, password, view cap, disabled links, and watermarks.",
      label: "Shared document",
      quickActions: [],
      recommendedSkills: [],
    },
  },
  {
    match: (p) =>
      (p === "/files" || p.startsWith("/files/")) &&
      !p.startsWith("/files/explorer") &&
      !p.startsWith("/files/shares") &&
      !p.startsWith("/files/share/"),
    binding: {
      pageType: "files_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Files & Documents OS — upload, organize, share, and request signatures.",
      label: "Files",
      quickActions: [
        {
          id: "explorer",
          label: "Explorer",
          icon: "Folder",
          intent: "nav",
          href: "/files/explorer",
        },
        {
          id: "upload",
          label: "Upload",
          icon: "Upload",
          intent: "nav",
          href: "/files/explorer?upload=1",
        },
        {
          id: "signatures",
          label: "Signatures",
          icon: "PenLine",
          intent: "nav",
          href: "/files/signatures",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
      ],
    },
  },
  {
    match: (p) => p === "/forms",
    binding: {
      pageType: "forms_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["star", "stewie", "vader"],
      guidance:
        "Design dynamic forms, monitor submissions, and wire automations on submit.",
      label: "Forms",
      quickActions: [
        {
          id: "new-form",
          label: "New form",
          icon: "FilePlus",
          intent: "nav",
          href: "/forms/new",
        },
        {
          id: "kpi",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
      ],
      recommendedSkills: [],
    },
  },
  {
    match: (p) => p.startsWith("/forms/submission/"),
    binding: {
      pageType: "form_submission",
      primaryAgentId: "star",
      secondaryAgentIds: ["stewie", "vader", "ziro"],
      guidance:
        "Review a submission, qualify the submitter, and queue follow-ups.",
      label: "Submission",
      quickActions: [
        {
          id: "qualify-lead",
          label: "Qualify Lead",
          icon: "ShieldCheck",
          intent: "custom",
          payload: { skill: "qualifyLead" },
        },
        {
          id: "schedule-followup",
          label: "Schedule Follow-up",
          icon: "Calendar",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
      ],
      recommendedSkills: [],
    },
  },
  {
    match: (p) => p.startsWith("/forms/run/"),
    binding: {
      pageType: "form_surface",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["star", "stewie", "vader"],
      guidance: "Public form runner. Submissions trigger automations.",
      label: "Form runner",
      quickActions: [],
      recommendedSkills: [],
    },
  },
  {
    match: (p) => p.startsWith("/forms/"),
    binding: {
      pageType: "form_surface",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["star", "stewie", "vader"],
      guidance:
        "Edit form fields, preview, and analyze submission KPIs & drop-off.",
      label: "Form",
      quickActions: [
        {
          id: "back",
          label: "All forms",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/forms",
        },
        {
          id: "kpi",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
      ],
      recommendedSkills: [],
    },
  },
  {
    match: (p) => p.startsWith("/curriculum/lesson/"),
    binding: {
      pageType: "lesson_surface",
      primaryAgentId: "ruby",
      secondaryAgentIds: ["stewie", "ziro", "star"],
      guidance:
        "Review this lesson — schedule it, detect conflicts, or queue a follow-up.",
      label: "Lesson",
      quickActions: [
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
      ],
    },
  },
  {
    match: (p) => p === "/curriculum",
    binding: {
      pageType: "curriculum_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "ruby", "star"],
      guidance:
        "Programs, levels, and lessons at a glance — run a KPI snapshot or schedule a curriculum follow-up.",
      label: "Curriculum",
      quickActions: [
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "qualify",
          label: "Qualify Lead",
          icon: "UserCheck",
          intent: "custom",
          payload: { skill: "qualifyLead" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/curriculum/"),
    binding: {
      pageType: "program_surface",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "ruby", "star"],
      guidance:
        "Program surface — review levels, lessons, and enrollment interest.",
      label: "Program",
      quickActions: [
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
        {
          id: "qualify",
          label: "Qualify Lead",
          icon: "UserCheck",
          intent: "custom",
          payload: { skill: "qualifyLead" },
        },
      ],
    },
  },
  {
    match: (p) => /^\/attendance\/session\/[^/]+$/.test(p),
    binding: {
      pageType: "attendance_session",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Session roster — quick-mark attendance, add reasons, override records.",
      label: "Attendance session",
      quickActions: [
        {
          id: "back",
          label: "All attendance",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/attendance",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => p === "/attendance" || p === "/attendance/",
    binding: {
      pageType: "attendance_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Attendance OS — monitor rates, streaks, risk flags, and upcoming sessions.",
      label: "Attendance",
      quickActions: [
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => /^\/attendance\/[^/]+$/.test(p),
    binding: {
      pageType: "attendance_student",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Student attendance — rate, streaks, flags, and recent records.",
      label: "Student attendance",
      quickActions: [
        {
          id: "back",
          label: "All attendance",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/attendance",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => p === "/progress" || p === "/progress/",
    binding: {
      pageType: "progress_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Student Progress OS — pick a student to review goals, skills, and evidence.",
      label: "Progress",
      quickActions: [
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
      ],
    },
  },
  {
    match: (p) => /^\/progress\/[^/]+$/.test(p),
    binding: {
      pageType: "progress_surface",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Progress surface — review this student's goals, skills, checkpoints, and evidence.",
      label: "Student Progress",
      quickActions: [
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/assessments/attempt/"),
    binding: {
      pageType: "assessment_attempt",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["vader", "stewie", "ruby"],
      guidance:
        "Review this attempt — grade rubric items, send feedback, or schedule a review lesson.",
      label: "Attempt",
      quickActions: [
        {
          id: "message-student",
          label: "Message Student",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageStudent" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/assessments/run/"),
    binding: {
      pageType: "assessment_surface",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["vader", "stewie", "ruby"],
      guidance:
        "Runner view — answer each question, then submit to trigger auto-scoring.",
      label: "Runner",
      quickActions: [],
    },
  },
  {
    match: (p) => p === "/assessments",
    binding: {
      pageType: "assessments_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["vader", "stewie", "ruby"],
      guidance:
        "Assessments OS — review KPIs, message students, or queue follow-ups.",
      label: "Assessments",
      quickActions: [
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "message-student",
          label: "Message Student",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageStudent" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/assessments/"),
    binding: {
      pageType: "assessment_surface",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["vader", "stewie", "ruby"],
      guidance:
        "Assessment surface — questions, rubric, and attempts. Run KPIs or schedule follow-ups.",
      label: "Assessment",
      quickActions: [
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "message-student",
          label: "Message Student",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageStudent" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => /^\/automation\/workflows\/[^/]+$/.test(p),
    binding: {
      pageType: "automation_workflow",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Workflow surface — tune triggers, actions, retries, and concurrency.",
      label: "Workflow",
      quickActions: [
        {
          id: "back",
          label: "All workflows",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/automation/workflows",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => /^\/automation\/runs\/[^/]+$/.test(p),
    binding: {
      pageType: "automation_run",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Run surface — step timeline, logs, retries, and escalations.",
      label: "Run",
      quickActions: [
        {
          id: "back",
          label: "All runs",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/automation/runs",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => p === "/automation" || p.startsWith("/automation/"),
    binding: {
      pageType: "automation_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "star", "ruby"],
      guidance: "Design workflows: pick a trigger, add actions, tune retries.",
      label: "Automation",
      quickActions: [
        {
          id: "new-workflow",
          label: "New workflow",
          icon: "Zap",
          intent: "nav",
          href: "/automation/workflows/new",
        },
        {
          id: "trigger-workflow",
          label: "Trigger Workflow",
          icon: "Play",
          intent: "custom",
          payload: { domainAction: "automation.workflow.trigger" },
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "usage",
          label: "Usage Report",
          icon: "Activity",
          intent: "custom",
          payload: { skill: "usageReport" },
        },
      ],
    },
  },
  {
    match: (p) => p === "/inventory" || p === "/inventory/",
    binding: {
      pageType: "inventory_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Inventory OS — track assets, stock, checkouts, maintenance, and depreciation.",
      label: "Inventory",
      quickActions: [
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "trigger-workflow",
          label: "Trigger Workflow",
          icon: "Play",
          intent: "custom",
          payload: { domainAction: "automation.workflow.trigger" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/inventory/"),
    binding: {
      pageType: "inventory_item_surface",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["stewie", "vader", "ruby"],
      guidance:
        "Asset surface — stock, checkouts, maintenance, and depreciation curve.",
      label: "Inventory Item",
      quickActions: [
        {
          id: "back",
          label: "All inventory",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/inventory",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => p === "/" || p.startsWith("/dashboard"),
    binding: {
      pageType: "dashboard",
      primaryAgentId: "ziro",
      guidance: "Here’s your day at a glance.",
      label: "Dashboard",
      quickActions: [
        { id: "kpis", label: "Show KPIs", icon: "BarChart3", intent: "custom" },
        { id: "insights", label: "Run Insights", icon: "Sparkles", intent: "analyze" },
        { id: "chat", label: "Ask Ziro", icon: "MessageSquare", intent: "open-chat" },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/leads"),
    binding: {
      pageType: "leads",
      primaryAgentId: "star",
      secondaryAgentIds: ["stewie"],
      guidance: "You have new leads today.",
      label: "Leads",
      quickActions: [
        {
          id: "add-lead",
          label: "Add Lead",
          icon: "UserPlus",
          intent: "pointer",
          target: "[data-agent-target=\"add-lead\"]",
          pointerText: "Click here to add a lead",
        },
        { id: "hot-leads", label: "Hot Leads", icon: "Flame", intent: "custom" },
        { id: "intake-review", label: "Intake Review", icon: "Inbox", intent: "custom" },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/students"),
    binding: {
      pageType: "students",
      primaryAgentId: "star",
      secondaryAgentIds: ["stewie"],
      guidance: "Want to promote a lead, or schedule a followup?",
      label: "Students",
      quickActions: [
        { id: "promote", label: "Promote Lead", icon: "ArrowUpRight", intent: "custom" },
        { id: "followup", label: "Schedule Followup", icon: "CalendarClock", intent: "custom" },
        {
          id: "add-student",
          label: "Add Student",
          icon: "UserPlus",
          intent: "pointer",
          target: "[data-agent-target=\"add-student\"]",
          pointerText: "Add a new student here",
        },
      ],
    },
  },
  {
    match: (p) => /^\/schedule\/events\/[^/]+$/.test(p),
    binding: {
      pageType: "schedule_event",
      primaryAgentId: "ruby",
      secondaryAgentIds: ["stewie", "vader", "ziro"],
      guidance:
        "Event surface — reschedule, reassign, detect conflicts, or message the teacher.",
      label: "Event",
      quickActions: [
        {
          id: "back",
          label: "All events",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/schedule",
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
      ],
    },
  },
  {
    match: (p) => /^\/schedule\/rooms\/[^/]+$/.test(p),
    binding: {
      pageType: "schedule_room",
      primaryAgentId: "ruby",
      secondaryAgentIds: ["ziro", "stewie", "vader"],
      guidance:
        "Room surface — review bookings, capacity, and equipment. Resolve overlaps with detect conflicts.",
      label: "Room",
      quickActions: [
        {
          id: "back",
          label: "All rooms",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/schedule/rooms",
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
      ],
    },
  },
  {
    match: (p) => p === "/schedule" || p.startsWith("/schedule/"),
    binding: {
      pageType: "schedule_dashboard",
      primaryAgentId: "ruby",
      secondaryAgentIds: ["ziro", "stewie", "vader"],
      guidance:
        "Schedule & Calendar OS — week/month views, availability, rooms, and conflicts.",
      label: "Schedule",
      quickActions: [
        {
          id: "new-event",
          label: "New event",
          icon: "CalendarPlus",
          intent: "custom",
          payload: { domainAction: "schedule.create" },
        },
        {
          id: "rooms",
          label: "Rooms",
          icon: "DoorOpen",
          intent: "nav",
          href: "/schedule/rooms",
        },
        {
          id: "availability",
          label: "Availability",
          icon: "Clock",
          intent: "nav",
          href: "/schedule/availability",
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "edit-event",
          label: "Edit Event",
          icon: "Pencil",
          intent: "custom",
          payload: { domainAction: "schedule.edit" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/studio-map"),
    binding: {
      pageType: "schedule",
      primaryAgentId: "ruby",
      guidance: "I found open slots today.",
      label: "Schedule",
      quickActions: [
        { id: "add-block", label: "Add Block", icon: "CalendarPlus", intent: "custom" },
        { id: "availability", label: "Teacher Availability", icon: "Clock", intent: "custom" },
        { id: "find-slots", label: "Find Availability", icon: "Search", intent: "analyze" },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/tasks") || p.startsWith("/automations"),
    binding: {
      pageType: "tasks",
      primaryAgentId: "ziro",
      guidance: "Here’s what needs attention.",
      label: "Tasks",
      quickActions: [
        { id: "system-check", label: "Run System Check", icon: "Activity", intent: "analyze" },
        { id: "kpis", label: "Show KPIs", icon: "BarChart3", intent: "custom" },
        { id: "next", label: "Next Steps", icon: "ListTodo", intent: "custom" },
      ],
    },
  },
  {
    match: (p) => /^\/billing\/invoices\/[^/]+$/.test(p),
    binding: {
      pageType: "billing_invoice",
      primaryAgentId: "bub",
      secondaryAgentIds: ["ziro", "vader", "stewie", "ruby"],
      guidance:
        "Invoice surface — review line items, record payments, or send a reminder.",
      label: "Invoice",
      quickActions: [
        {
          id: "back",
          label: "All invoices",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/billing/invoices",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => /^\/billing\/subscriptions\/[^/]+$/.test(p),
    binding: {
      pageType: "billing_subscription",
      primaryAgentId: "bub",
      secondaryAgentIds: ["ziro", "vader", "stewie", "ruby"],
      guidance:
        "Subscription surface — review plan, renewals, and generate recurring invoices.",
      label: "Subscription",
      quickActions: [
        {
          id: "back",
          label: "All subscriptions",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/billing/subscriptions",
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) =>
      p === "/billing" ||
      p === "/billing/" ||
      p.startsWith("/billing/invoices") ||
      p.startsWith("/billing/payments") ||
      p.startsWith("/billing/subscriptions") ||
      p.startsWith("/billing/settings"),
    binding: {
      pageType: "billing_dashboard",
      primaryAgentId: "bub",
      secondaryAgentIds: ["ziro", "vader", "stewie", "ruby"],
      guidance:
        "Billing OS — track revenue, aging, overdue, and upcoming renewals.",
      label: "Billing",
      quickActions: [
        {
          id: "new-invoice",
          label: "New invoice",
          icon: "FilePlus",
          intent: "custom",
          payload: { domainAction: "billing.invoice.create" },
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "invoice-aging",
          label: "Invoice Aging",
          icon: "Receipt",
          intent: "custom",
          payload: { skill: "invoiceAgingReport" },
        },
        {
          id: "record-payment",
          label: "Record Payment",
          icon: "CreditCard",
          intent: "custom",
          payload: { domainAction: "billing.payment.record" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/billing") || p.startsWith("/invoices"),
    binding: {
      pageType: "billing",
      primaryAgentId: "bub",
      guidance: "You have overdue invoices.",
      label: "Billing",
      quickActions: [
        { id: "generate-invoice", label: "Generate Invoice", icon: "FileText", intent: "custom" },
        { id: "record-payment", label: "Record Payment", icon: "CreditCard", intent: "custom" },
        { id: "overdue", label: "Show Overdue", icon: "AlertCircle", intent: "custom" },
      ],
    },
  },
  {
    match: (p) => /^\/messages\/threads\/[^/]+$/.test(p),
    binding: {
      pageType: "message_thread",
      primaryAgentId: "vader",
      secondaryAgentIds: ["stewie", "ruby", "ziro"],
      guidance:
        "Conversation surface — reply, attach a template, detect follow-ups, or message a teacher.",
      label: "Thread",
      quickActions: [
        {
          id: "back",
          label: "All messages",
          icon: "ArrowLeft",
          intent: "nav",
          href: "/messages",
        },
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "thread-mark-read",
          label: "Mark Read",
          icon: "CheckCheck",
          intent: "custom",
          payload: { domainAction: "messages.thread.action", threadAction: "markRead" },
        },
        {
          id: "thread-archive",
          label: "Archive Thread",
          icon: "Archive",
          intent: "custom",
          payload: { domainAction: "messages.thread.action", threadAction: "archive" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
      ],
    },
  },
  {
    match: (p) => p === "/messages" || p.startsWith("/messages/"),
    binding: {
      pageType: "messages_dashboard",
      primaryAgentId: "vader",
      secondaryAgentIds: ["stewie", "ruby", "ziro"],
      guidance:
        "Messaging OS — triage your inbox, draft templates, or schedule follow-ups.",
      label: "Messaging",
      quickActions: [
        {
          id: "message-teacher",
          label: "Message Teacher",
          icon: "MessageSquare",
          intent: "custom",
          payload: { skill: "messageTeacher" },
        },
        {
          id: "followup",
          label: "Schedule Follow-up",
          icon: "CalendarClock",
          intent: "custom",
          payload: { skill: "scheduleFollowup" },
        },
        {
          id: "detect-conflicts",
          label: "Detect Conflicts",
          icon: "AlertTriangle",
          intent: "custom",
          payload: { skill: "detectConflicts" },
        },
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/inbox") || p.startsWith("/announcements"),
    binding: {
      pageType: "inbox",
      primaryAgentId: "vader",
      guidance: "You have unread messages.",
      label: "Inbox",
      quickActions: [
        { id: "msg-family", label: "Message Family", icon: "Users", intent: "custom" },
        { id: "msg-teacher", label: "Message Teacher", icon: "GraduationCap", intent: "custom" },
        { id: "compose", label: "Compose", icon: "Edit", intent: "custom" },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/teachers"),
    binding: {
      pageType: "teachers",
      primaryAgentId: "ruby",
      secondaryAgentIds: ["vader"],
      guidance: "Review teacher rosters and availability.",
      label: "Teachers",
      quickActions: [
        { id: "invite", label: "Invite Teacher", icon: "UserPlus", intent: "custom" },
        { id: "availability", label: "Availability", icon: "Clock", intent: "custom" },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/families"),
    binding: {
      pageType: "families",
      primaryAgentId: "vader",
      secondaryAgentIds: ["bub"],
      guidance: "Manage family records and message householders.",
      label: "Families",
      quickActions: [
        { id: "add-family", label: "Add Family", icon: "UserPlus", intent: "custom" },
        { id: "message", label: "Message Family", icon: "MessageSquare", intent: "custom" },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/lifecycle") || p.startsWith("/recruitment"),
    binding: {
      pageType: "lifecycle",
      primaryAgentId: "star",
      secondaryAgentIds: ["stewie"],
      guidance: "Help the team finish today’s customer steps — one stage at a time.",
      label: "Customer lifecycle",
      quickActions: [
        { id: "next-stage", label: "What should I do next?", icon: "ArrowRight", intent: "custom" },
        { id: "blockers", label: "Show what needs attention", icon: "AlertTriangle", intent: "analyze" },
      ],
    },
  },
  {
    match: (p) => p === "/reports" || p === "/reports/",
    binding: {
      pageType: "reports_dashboard",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["ruby", "bub", "star"],
      guidance: "Reporting OS — pick a report or ask me for a KPI snapshot.",
      label: "Reports",
      quickActions: [
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "usage",
          label: "Usage Report",
          icon: "Activity",
          intent: "custom",
          payload: { skill: "usageReport" },
        },
        {
          id: "teacher-load",
          label: "Teacher Load",
          icon: "Users",
          intent: "custom",
          payload: { skill: "teacherLoadReport" },
        },
        {
          id: "invoice-aging",
          label: "Invoice Aging",
          icon: "Receipt",
          intent: "custom",
          payload: { skill: "invoiceAgingReport" },
        },
        {
          id: "hot-leads",
          label: "Hot Leads",
          icon: "Flame",
          intent: "custom",
          payload: { skill: "hotLeads" },
        },
      ],
    },
  },
  {
    match: (p) => /^\/reports\/[^/]+$/.test(p),
    binding: {
      pageType: "report_surface",
      primaryAgentId: "ziro",
      secondaryAgentIds: ["ruby", "bub", "star"],
      guidance: "Report surface — tune parameters and I can narrate results.",
      label: "Report",
      quickActions: [
        {
          id: "kpis",
          label: "KPI Snapshot",
          icon: "BarChart3",
          intent: "custom",
          payload: { skill: "kpiSnapshot" },
        },
        {
          id: "usage",
          label: "Usage Report",
          icon: "Activity",
          intent: "custom",
          payload: { skill: "usageReport" },
        },
        {
          id: "teacher-load",
          label: "Teacher Load",
          icon: "Users",
          intent: "custom",
          payload: { skill: "teacherLoadReport" },
        },
        {
          id: "invoice-aging",
          label: "Invoice Aging",
          icon: "Receipt",
          intent: "custom",
          payload: { skill: "invoiceAgingReport" },
        },
        {
          id: "hot-leads",
          label: "Hot Leads",
          icon: "Flame",
          intent: "custom",
          payload: { skill: "hotLeads" },
        },
      ],
    },
  },
  {
    match: (p) => p.startsWith("/marketing-insights"),
    binding: {
      pageType: "reports",
      primaryAgentId: "ziro",
      guidance: "Data at a glance — ask me anything.",
      label: "Reports",
      quickActions: [
        { id: "kpis", label: "Show KPIs", icon: "BarChart3", intent: "custom" },
        { id: "ask", label: "Ask Ziro", icon: "MessageSquare", intent: "open-chat" },
      ],
    },
  },
];

const DEFAULT_BINDING: PageBinding = {
  pageType: "dashboard",
  primaryAgentId: "ziro",
  guidance: "How can I help?",
  quickActions: [
    { id: "ask", label: "Ask Ziro", icon: "MessageSquare", intent: "open-chat" },
    { id: "system-check", label: "Run System Check", icon: "Activity", intent: "analyze" },
  ],
};

function rulePriority(rule: Rule, ruleIndex: number): number {
  if (rule.specificity != null) return rule.specificity;
  return 10000 - ruleIndex;
}

function applyRecommendedSkillsFromPageType(binding: PageBinding): PageBinding {
  if (binding.pageType) {
    const recommended = PAGE_RECOMMENDED_SKILLS[binding.pageType];
    if (recommended && recommended.length > 0 && !binding.recommendedSkills?.length) {
      return { ...binding, recommendedSkills: recommended };
    }
  }
  return binding;
}

/**
 * Maps alternate admin mirrors to canonical CRM/billing paths so nested rules apply.
 * (e.g. /admin/students/… → /crm/students/…)
 */
export function canonicalAgentOSPathname(pathname: string): string {
  let p = normalize(pathname);
  if (p.startsWith("/admin/students")) {
    p = p.replace(/^\/admin\/students/, "/crm/students");
  } else if (p.startsWith("/admin/families")) {
    p = p.replace(/^\/admin\/families/, "/crm/families");
  } else if (p.startsWith("/admin/billing")) {
    p = p.replace(/^\/admin\/billing/, "/billing");
  } else if (p === "/scheduling" || p.startsWith("/scheduling/")) {
    p = p.replace(/^\/scheduling/, "/schedule");
  } else if (p === "/students" || p.startsWith("/students/")) {
    p = p.replace(/^\/students/, "/crm/students");
  } else if (p === "/student" || p.startsWith("/student/")) {
    p = p.replace(/^\/student/, "/crm/students");
  } else if (p === "/families" || p.startsWith("/families/")) {
    p = p.replace(/^\/families/, "/crm/families");
  } else if (p === "/family" || p.startsWith("/family/")) {
    p = p.replace(/^\/family/, "/crm/families");
  } else if (p === "/teachers" || p.startsWith("/teachers/")) {
    p = p.replace(/^\/teachers/, "/crm/teachers");
  } else if (p === "/teacher" || p.startsWith("/teacher/")) {
    p = p.replace(/^\/teacher/, "/crm/teachers");
  } else if (p === "/invoices" || p.startsWith("/invoices/")) {
    p = p.replace(/^\/invoices/, "/billing/invoices");
  }
  return p;
}

export function getPageBinding(pathname: string): PageBinding {
  const normalized = canonicalAgentOSPathname(pathname);
  let best: { rule: Rule; index: number } | null = null;
  for (let index = 0; index < rules.length; index++) {
    const rule = rules[index];
    if (!rule.match(normalized)) continue;
    const pr = rulePriority(rule, index);
    if (
      !best ||
      pr > rulePriority(best.rule, best.index) ||
      (pr === rulePriority(best.rule, best.index) && index < best.index)
    ) {
      best = { rule, index };
    }
  }
  if (best === null) {
    return applyRecommendedSkillsFromPageType({ ...DEFAULT_BINDING });
  }
  return applyRecommendedSkillsFromPageType({ ...best.rule.binding });
}

export function getPageRecommendedSkills(
  pageType: PageType | string,
): PageRecommendedSkill[] {
  const key = (pageType as PageType) in PAGE_RECOMMENDED_SKILLS
    ? (pageType as PageType)
    : null;
  if (!key) return [];
  return PAGE_RECOMMENDED_SKILLS[key];
}

export function getPageTypeFromPathname(pathname: string): PageType {
  const binding = getPageBinding(pathname);
  return binding.pageType ?? "dashboard";
}

function normalize(path: string): string {
  if (!path) return "/";
  try {
    // Strip query/hash if accidentally passed in
    const q = path.indexOf("?");
    const h = path.indexOf("#");
    const cut = [q, h].filter((i) => i >= 0).sort((a, b) => a - b)[0];
    let out = cut != null ? path.slice(0, cut) : path;
    if (out.length > 1 && out.endsWith("/")) {
      out = out.slice(0, -1);
    }
    return out;
  } catch {
    return path;
  }
}

export { DEFAULT_BINDING };
