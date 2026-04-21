import { clientFor } from "@data/_client";
import { getAgentById } from "./agentRegistry";
const TABLE = "ziro_page_intelligence_bindings";
export function pageKeyFromPath(pathname) {
    if (!pathname || pathname === "/")
        return "dashboard";
    const trimmed = pathname.replace(/^\/+|\/+$/g, "");
    const first = trimmed.split("/")[0];
    return first || "dashboard";
}
const TEACHER_DASHBOARD_SKILLS = [
    {
        agent: "ruby",
        key: "findAvailability",
        id: "ruby.findAvailability",
        title: "Find Availability",
        description: "Find open slots for a teacher or student within a timeframe.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check for overlapping schedule entries across teachers and students.",
    },
    {
        agent: "ruby",
        key: "suggestSchedule",
        id: "ruby.suggestSchedule",
        title: "Suggest Schedule",
        description: "Propose schedule options based on student preferences.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Schedule a follow-up task tied to a student or family.",
    },
    {
        agent: "stewie",
        key: "overdueFollowups",
        id: "stewie.overdueFollowups",
        title: "Overdue Follow-ups",
        description: "Flag follow-ups whose due date has passed without completion.",
    },
    {
        agent: "vader",
        key: "messageFamily",
        id: "vader.messageFamily",
        title: "Message Family",
        description: "Draft and send a message to a family account.",
    },
    {
        agent: "vader",
        key: "messageStudent",
        id: "vader.messageStudent",
        title: "Message Student",
        description: "Draft and send a message to a student.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute the current snapshot of top-level workspace KPIs.",
    },
];
const DIRECTOR_DASHBOARD_SKILLS = [
    {
        agent: "star",
        key: "hotLeads",
        id: "star.hotLeads",
        title: "Hot Leads",
        description: "Summarize the most engaged leads for follow-up prioritization.",
    },
    {
        agent: "star",
        key: "qualifyLead",
        id: "star.qualifyLead",
        title: "Qualify Lead",
        description: "Score a lead against qualification criteria and recommend next action.",
    },
    {
        agent: "ruby",
        key: "teacherLoadReport",
        id: "ruby.teacherLoadReport",
        title: "Teacher Load Report",
        description: "Summarize teaching load across teachers for a given window.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check for overlapping schedule entries across teachers and students.",
    },
    {
        agent: "bub",
        key: "invoiceAgingReport",
        id: "bub.invoiceAgingReport",
        title: "Invoice Aging Report",
        description: "Bucket outstanding invoices by age for collections review.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute the current snapshot of top-level workspace KPIs.",
    },
    {
        agent: "ziro",
        key: "usageReport",
        id: "ziro.usageReport",
        title: "Usage Report",
        description: "Report workspace-level usage of agents, skills, and tokens.",
    },
];
const SCHEDULING_DASHBOARD_SKILLS = [
    {
        agent: "ruby",
        key: "findAvailability",
        id: "ruby.findAvailability",
        title: "Find Availability",
        description: "Find open slots for a teacher or student within a timeframe.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check for overlapping schedule entries across teachers, rooms, and students.",
    },
    {
        agent: "ruby",
        key: "suggestSchedule",
        id: "ruby.suggestSchedule",
        title: "Suggest Schedule",
        description: "Propose schedule options based on teacher and room availability.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute the current snapshot of top-level workspace KPIs.",
    },
];
const LOCATION_DASHBOARD_SKILLS = [
    {
        agent: "ruby",
        key: "findAvailability",
        id: "ruby.findAvailability",
        title: "Find Availability",
        description: "Find open slots across rooms and teachers at this location.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Identify overlapping teacher, room, and student bookings at this location.",
    },
    {
        agent: "ruby",
        key: "suggestSchedule",
        id: "ruby.suggestSchedule",
        title: "Suggest Schedule",
        description: "Propose schedule options that maximize room utilization at this location.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute the current KPI snapshot (teachers, students, utilization) for this location.",
    },
];
const LEADS_DASHBOARD_SKILLS = [
    {
        agent: "star",
        key: "hotLeads",
        id: "star.hotLeads",
        title: "Hot Leads",
        description: "Summarize the most engaged leads for follow-up prioritization.",
    },
    {
        agent: "star",
        key: "qualifyLead",
        id: "star.qualifyLead",
        title: "Qualify Lead",
        description: "Score a lead against qualification criteria and recommend next action.",
    },
    {
        agent: "star",
        key: "promoteLead",
        id: "star.promoteLead",
        title: "Promote Lead",
        description: "Promote a qualified lead to a student and prepare onboarding intent.",
    },
    {
        agent: "star",
        key: "findLeadDuplicates",
        id: "star.findLeadDuplicates",
        title: "Find Lead Duplicates",
        description: "Identify candidate duplicates using email, phone, and name similarity.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Schedule a follow-up task tied to a lead, family, or student.",
    },
];
const LEAD_SURFACE_SKILLS = [
    {
        agent: "star",
        key: "qualifyLead",
        id: "star.qualifyLead",
        title: "Qualify Lead",
        description: "Score this lead against qualification criteria and recommend next action.",
    },
    {
        agent: "star",
        key: "promoteLead",
        id: "star.promoteLead",
        title: "Promote Lead",
        description: "Promote this lead to a student and prepare onboarding intent.",
    },
    {
        agent: "star",
        key: "findLeadDuplicates",
        id: "star.findLeadDuplicates",
        title: "Find Lead Duplicates",
        description: "Check this lead against existing records for possible duplicates.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Schedule the next follow-up with this lead.",
    },
    {
        agent: "star",
        key: "hotLeads",
        id: "star.hotLeads",
        title: "Hot Leads",
        description: "See how this lead compares with the current hot list.",
    },
];
const ROOM_SURFACE_SKILLS = [
    {
        agent: "ruby",
        key: "findAvailability",
        id: "ruby.findAvailability",
        title: "Find Availability",
        description: "Find open slots for this room within a timeframe.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check for overlapping bookings in this room.",
    },
    {
        agent: "ruby",
        key: "suggestSchedule",
        id: "ruby.suggestSchedule",
        title: "Suggest Schedule",
        description: "Suggest lessons that fit open windows in this room.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute utilization and load KPIs for this room.",
    },
];
const AUTOMATION_DASHBOARD_SKILLS = [
    {
        agent: "ziro",
        key: "usageReport",
        id: "ziro.usageReport",
        title: "Usage Report",
        description: "Report workspace-level usage of agents, skills, and automation runs.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute the current KPI snapshot to inform automation targeting.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up action from a rule template.",
    },
    {
        agent: "star",
        key: "qualifyLead",
        id: "star.qualifyLead",
        title: "Qualify Lead",
        description: "Score a lead against qualification criteria as part of automation testing.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check for overlapping schedule entries before an automation fires.",
    },
];
const AUTOMATION_WORKFLOW_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute workflow KPIs (runs, success rate, avg duration) for design decisions.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Insert a schedule-follow-up action into this workflow.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Add a teacher messaging action to this workflow.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check for schedule conflicts before workflow actions execute.",
    },
];
const AUTOMATION_RUN_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute run KPIs (duration, success, retry depth) for this workflow.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up tied to a failed or escalated run.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Notify a teacher about the outcome of this run.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check for schedule conflicts caused by this run's actions.",
    },
];
const AUTOMATION_RULE_SKILLS = [
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Insert a schedule-follow-up action into this rule.",
    },
    {
        agent: "star",
        key: "qualifyLead",
        id: "star.qualifyLead",
        title: "Qualify Lead",
        description: "Use the lead qualification skill as an action.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Run conflict detection before triggering notifications.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Capture KPIs at the moment a rule executes.",
    },
    {
        agent: "ziro",
        key: "usageReport",
        id: "ziro.usageReport",
        title: "Usage Report",
        description: "Record usage from the action pipeline for this rule.",
    },
];
const TEMPLATES_DASHBOARD_SKILLS = [
    {
        agent: "vader",
        key: "messageFamily",
        id: "vader.messageFamily",
        title: "Message Family",
        description: "Draft and send a message to a family account.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Draft and send a message to a teacher.",
    },
    {
        agent: "vader",
        key: "messageStudent",
        id: "vader.messageStudent",
        title: "Message Student",
        description: "Draft and send a message to a student.",
    },
    {
        agent: "ziro",
        key: "usageReport",
        id: "ziro.usageReport",
        title: "Usage Report",
        description: "Summarize how templates are being used across the workspace.",
    },
];
const TEMPLATE_SURFACE_SKILLS = [
    {
        agent: "vader",
        key: "messageFamily",
        id: "vader.messageFamily",
        title: "Message Family",
        description: "Send this template to a family account.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Send this template to a teacher.",
    },
    {
        agent: "vader",
        key: "messageStudent",
        id: "vader.messageStudent",
        title: "Message Student",
        description: "Send this template to a student.",
    },
    {
        agent: "ziro",
        key: "usageReport",
        id: "ziro.usageReport",
        title: "Usage Report",
        description: "Track how this template is performing.",
    },
];
const FORMS_DASHBOARD_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute form funnel KPIs: submissions, completion rate, drop-off.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up tied to a recent form submission.",
    },
    {
        agent: "vader",
        key: "messageFamily",
        id: "vader.messageFamily",
        title: "Message Family",
        description: "Draft and send a message to a family based on form answers.",
    },
    {
        agent: "star",
        key: "qualifyLead",
        id: "star.qualifyLead",
        title: "Qualify Lead",
        description: "Score a submitter against lead qualification criteria and recommend next action.",
    },
];
const FORM_SURFACE_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute completion, abandonment, and drop-off KPIs for this form.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up tied to recent submissions of this form.",
    },
    {
        agent: "vader",
        key: "messageFamily",
        id: "vader.messageFamily",
        title: "Message Family",
        description: "Reach out to submitters with a templated message.",
    },
    {
        agent: "star",
        key: "qualifyLead",
        id: "star.qualifyLead",
        title: "Qualify Lead",
        description: "Evaluate submitters against lead criteria.",
    },
];
const FORM_SUBMISSION_SKILLS = [
    {
        agent: "star",
        key: "qualifyLead",
        id: "star.qualifyLead",
        title: "Qualify Lead",
        description: "Score this submission against lead qualification criteria.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Schedule a follow-up tied to this submission.",
    },
    {
        agent: "vader",
        key: "messageFamily",
        id: "vader.messageFamily",
        title: "Message Family",
        description: "Send a templated reply to the submitter.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute form KPIs including this submission.",
    },
];
const CURRICULUM_DASHBOARD_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute the current snapshot of curriculum KPIs (programs, lessons, completions).",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a curriculum review follow-up for a student or family.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check for scheduling conflicts before assigning lessons in this program.",
    },
    {
        agent: "star",
        key: "qualifyLead",
        id: "star.qualifyLead",
        title: "Qualify Lead",
        description: "Score a prospective enrollment against this program’s qualification criteria.",
    },
];
const PROGRAM_SURFACE_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute the current KPIs for this program (levels, lessons, completion).",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up tied to a student's progress in this program.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Identify scheduling conflicts before placing lessons into this program.",
    },
    {
        agent: "star",
        key: "qualifyLead",
        id: "star.qualifyLead",
        title: "Qualify Lead",
        description: "Evaluate an enrollment interest against this program’s criteria.",
    },
];
const LESSON_SURFACE_SKILLS = [
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check for schedule overlaps before scheduling this lesson for a student.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a practice or review follow-up tied to this lesson.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute lesson-level completion and engagement KPIs.",
    },
    {
        agent: "star",
        key: "qualifyLead",
        id: "star.qualifyLead",
        title: "Qualify Lead",
        description: "Evaluate whether a prospective student is ready for this lesson.",
    },
];
const PROGRESS_DASHBOARD_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute the current snapshot of student progress KPIs across the workspace.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up tied to a student's progress or a weak area.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Draft and send a message to the teacher about a student's progress.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check lesson scheduling for weak areas before assigning focused practice blocks.",
    },
];
const PROGRESS_SURFACE_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute the current progress KPIs for this student (goals, skills, checkpoints).",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Schedule a follow-up tied to this student's next checkpoint or weak area.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Send the teacher a note about this student's recent progress.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check scheduling conflicts before adding focused lessons for weak areas.",
    },
];
const ASSESSMENTS_DASHBOARD_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute the current snapshot of assessment KPIs (attempts, mastery, pass rate).",
    },
    {
        agent: "vader",
        key: "messageStudent",
        id: "vader.messageStudent",
        title: "Message Student",
        description: "Send a templated nudge, reminder, or feedback note about an assessment.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up for students who need re-assessment or review.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check scheduling conflicts before booking a test, retake, or review lesson.",
    },
];
const ASSESSMENT_SURFACE_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute KPIs for this assessment (average score, pass rate, difficulty index).",
    },
    {
        agent: "vader",
        key: "messageStudent",
        id: "vader.messageStudent",
        title: "Message Student",
        description: "Message a student about their performance or an upcoming attempt.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Schedule review or retake follow-ups tied to this assessment.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check scheduling conflicts before booking this assessment with a student.",
    },
];
const INVENTORY_DASHBOARD_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute the current snapshot of inventory KPIs (assets, in use, overdue, maintenance, value).",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up tied to overdue checkouts or upcoming maintenance.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Draft a message to a teacher about an asset or maintenance need.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check scheduling conflicts before assigning a shared asset to a lesson block.",
    },
];
const INVENTORY_ITEM_SURFACE_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute per-asset KPIs (on hand, checkouts, maintenance, depreciation).",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Schedule a follow-up tied to this asset (return reminder, maintenance check).",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Message the teacher currently assigned this asset.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check for scheduling conflicts when planning to checkout this asset.",
    },
];
const ASSESSMENT_ATTEMPT_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute per-student mastery KPIs derived from this attempt.",
    },
    {
        agent: "vader",
        key: "messageStudent",
        id: "vader.messageStudent",
        title: "Message Student",
        description: "Draft a feedback message to the student about this attempt.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Schedule a review lesson or retake tied to this attempt.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check scheduling conflicts before booking a retake or review.",
    },
];
const CONTENT_DASHBOARD_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute the current snapshot of content library KPIs (items, tags, collections, embedding coverage).",
    },
    {
        agent: "ziro",
        key: "semanticSearch",
        id: "ziro.semanticSearch",
        title: "Semantic Search",
        description: "Search the content library semantically across titles, descriptions, and tags.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Share a content item or collection with a teacher.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up tied to new or updated content.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check scheduling conflicts before assigning a content item to a lesson block.",
    },
];
const CONTENT_SURFACE_SKILLS = [
    {
        agent: "ziro",
        key: "semanticSearch",
        id: "ziro.semanticSearch",
        title: "Semantic Search",
        description: "Find related content items using this item as the semantic anchor.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute usage KPIs for this content item (access count, coverage, freshness).",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Share this content item with a teacher.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up tied to reviewing or updating this content.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check scheduling conflicts before assigning this content to a lesson.",
    },
];
const CONTENT_COLLECTION_SKILLS = [
    {
        agent: "ziro",
        key: "semanticSearch",
        id: "ziro.semanticSearch",
        title: "Semantic Search",
        description: "Find more items matching this collection's theme.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute KPIs for this collection (size, access count, embedding coverage).",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Share this collection with a teacher.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up tied to curating or reviewing this collection.",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Check scheduling conflicts when assigning this collection to a lesson block.",
    },
];
const BRANDING_DASHBOARD_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute branding & white-label KPIs (profile status, domains, identity, layouts).",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Detect scheduling conflicts when rolling out new tenant branding to portals.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up for verification of a domain or email identity.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Notify a teacher when their portal branding or layout is being updated.",
    },
];
const BRANDING_THEME_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute theme KPIs (published status, draft age, color contrast).",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Detect conflicts between theme tokens and portal layout constraints.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up to publish a draft theme after review.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Notify staff when a new theme is ready for review.",
    },
];
const BRANDING_DOMAIN_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute domain readiness KPIs (verification status, SSL, DNS).",
    },
    {
        agent: "ruby",
        key: "detectConflicts",
        id: "ruby.detectConflicts",
        title: "Detect Conflicts",
        description: "Detect conflicts between primary domain and existing CNAME records.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Schedule a verification re-check follow-up for a pending domain.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Notify staff about a domain cutover or DNS change.",
    },
];
const MESSAGES_DASHBOARD_SKILLS = [
    {
        agent: "vader",
        key: "messageFamily",
        id: "vader.messageFamily",
        title: "Message Family",
        description: "Draft and send a message to a family account.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Draft and send a message to a teacher.",
    },
    {
        agent: "vader",
        key: "messageStudent",
        id: "vader.messageStudent",
        title: "Message Student",
        description: "Draft and send a message to a student.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute messaging KPIs (volume, response time, open rate).",
    },
];
const MESSAGE_THREAD_SKILLS = [
    {
        agent: "vader",
        key: "messageFamily",
        id: "vader.messageFamily",
        title: "Message Family",
        description: "Draft a reply in this thread to a family account.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Draft a reply in this thread to a teacher.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up tied to this message thread.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute per-thread KPIs (response latency, participants).",
    },
];
const REPORTS_DASHBOARD_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Compute the tenant-wide KPI snapshot across enrollment, revenue, attendance, progress, and more.",
    },
    {
        agent: "ziro",
        key: "semanticSearch",
        id: "ziro.semanticSearch",
        title: "Semantic Search",
        description: "Find related reports or widgets using semantic similarity.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up to review or act on report findings.",
    },
];
const REPORT_VIEWER_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Refresh the KPI values surfaced alongside this report.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Message Teacher",
        description: "Share this report with staff for follow-up.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Schedule Follow-up",
        description: "Queue a follow-up based on a finding in this report.",
    },
];
const FILES_DASHBOARD_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "Files overview",
        description: "Summarize storage, active share links, and signature queue.",
    },
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Follow up on files",
        description: "Nudge owners when uploads or signatures are overdue.",
    },
];
const FILE_SURFACE_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "File summary",
        description: "Explain versions, permissions, and share links for this file.",
    },
    {
        agent: "vader",
        key: "messageTeacher",
        id: "vader.messageTeacher",
        title: "Share or notify",
        description: "Draft a message about this document for staff or families.",
    },
];
const SIGNATURE_REQUEST_SKILLS = [
    {
        agent: "stewie",
        key: "scheduleFollowup",
        id: "stewie.scheduleFollowup",
        title: "Signer follow-up",
        description: "Remind pending signers or reschedule the deadline.",
    },
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "Request status",
        description: "Summarize who has viewed, signed, or declined.",
    },
];
const REPORT_BUILDER_SKILLS = [
    {
        agent: "ziro",
        key: "kpiSnapshot",
        id: "ziro.kpiSnapshot",
        title: "KPI Snapshot",
        description: "Use live KPIs as inspiration for new custom reports.",
    },
    {
        agent: "ziro",
        key: "semanticSearch",
        id: "ziro.semanticSearch",
        title: "Semantic Search",
        description: "Search existing saved reports to avoid duplicates before authoring a new one.",
    },
];
const PAGE_RECOMMENDED_SKILLS = {
    dashboard: [
        {
            agent: "ziro",
            key: "kpiSnapshot",
            id: "ziro.kpiSnapshot",
            title: "KPI Snapshot",
            description: "Compute the current snapshot of workspace KPIs.",
        },
    ],
    teacher_dashboard: TEACHER_DASHBOARD_SKILLS,
    student_dashboard: [],
    family_dashboard: [],
    admin_dashboard: [],
    director_dashboard: DIRECTOR_DASHBOARD_SKILLS,
    scheduling_dashboard: SCHEDULING_DASHBOARD_SKILLS,
    leads: LEADS_DASHBOARD_SKILLS,
    leads_dashboard: LEADS_DASHBOARD_SKILLS,
    lead_surface: LEAD_SURFACE_SKILLS,
    students: [],
    schedule: SCHEDULING_DASHBOARD_SKILLS,
    billing: [],
    inbox: [],
    location_dashboard: LOCATION_DASHBOARD_SKILLS,
    room_surface: ROOM_SURFACE_SKILLS,
    automation_dashboard: AUTOMATION_DASHBOARD_SKILLS,
    automation_rule: AUTOMATION_RULE_SKILLS,
    automation_workflow: AUTOMATION_WORKFLOW_SKILLS,
    automation_run: AUTOMATION_RUN_SKILLS,
    templates_dashboard: TEMPLATES_DASHBOARD_SKILLS,
    template_surface: TEMPLATE_SURFACE_SKILLS,
    forms_dashboard: FORMS_DASHBOARD_SKILLS,
    form_surface: FORM_SURFACE_SKILLS,
    form_submission: FORM_SUBMISSION_SKILLS,
    files_dashboard: FILES_DASHBOARD_SKILLS,
    file_surface: FILE_SURFACE_SKILLS,
    signature_request: SIGNATURE_REQUEST_SKILLS,
    curriculum_dashboard: CURRICULUM_DASHBOARD_SKILLS,
    program_surface: PROGRAM_SURFACE_SKILLS,
    lesson_surface: LESSON_SURFACE_SKILLS,
    progress_dashboard: PROGRESS_DASHBOARD_SKILLS,
    progress_surface: PROGRESS_SURFACE_SKILLS,
    assessments_dashboard: ASSESSMENTS_DASHBOARD_SKILLS,
    assessment_surface: ASSESSMENT_SURFACE_SKILLS,
    assessment_attempt: ASSESSMENT_ATTEMPT_SKILLS,
    inventory_dashboard: INVENTORY_DASHBOARD_SKILLS,
    inventory_item_surface: INVENTORY_ITEM_SURFACE_SKILLS,
    content_dashboard: CONTENT_DASHBOARD_SKILLS,
    content_surface: CONTENT_SURFACE_SKILLS,
    content_collection: CONTENT_COLLECTION_SKILLS,
    branding_dashboard: BRANDING_DASHBOARD_SKILLS,
    branding_theme: BRANDING_THEME_SKILLS,
    branding_domain: BRANDING_DOMAIN_SKILLS,
    branding_email: BRANDING_DASHBOARD_SKILLS,
    branding_layout: BRANDING_DASHBOARD_SKILLS,
    branding_preview: BRANDING_DASHBOARD_SKILLS,
    messages_dashboard: MESSAGES_DASHBOARD_SKILLS,
    message_thread: MESSAGE_THREAD_SKILLS,
    reports_dashboard: REPORTS_DASHBOARD_SKILLS,
    report_viewer: REPORT_VIEWER_SKILLS,
    report_builder: REPORT_BUILDER_SKILLS,
    reports_widgets: REPORTS_DASHBOARD_SKILLS,
    reports_exports: REPORTS_DASHBOARD_SKILLS,
};
export function getPageRecommendedSkills(pageType) {
    var _a;
    const key = pageType;
    return (_a = PAGE_RECOMMENDED_SKILLS[key]) !== null && _a !== void 0 ? _a : [];
}
export function pageTypeFromPath(pathname) {
    if (!pathname)
        return "dashboard";
    const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
    if (p === "/admin/branding" || p === "/admin/branding/")
        return "branding_dashboard";
    if (p.startsWith("/admin/branding/theme"))
        return "branding_theme";
    if (p.startsWith("/admin/branding/domain"))
        return "branding_domain";
    if (p.startsWith("/admin/branding/email"))
        return "branding_email";
    if (p.startsWith("/admin/branding/layouts"))
        return "branding_layout";
    if (p.startsWith("/admin/branding/preview"))
        return "branding_preview";
    if (p.startsWith("/admin/branding"))
        return "branding_dashboard";
    if (p === "/teacher" || p.startsWith("/teacher/"))
        return "teacher_dashboard";
    if (p === "/student" || p.startsWith("/student/"))
        return "student_dashboard";
    if (p === "/family" || p.startsWith("/family/"))
        return "family_dashboard";
    if (p === "/admin" || p.startsWith("/admin/"))
        return "admin_dashboard";
    if (p === "/director" || p.startsWith("/director/"))
        return "director_dashboard";
    if (p === "/scheduling" || p.startsWith("/scheduling/"))
        return "scheduling_dashboard";
    if (p === "/progress")
        return "progress_dashboard";
    if (p.startsWith("/progress/"))
        return "progress_surface";
    if (p === "/automation")
        return "automation_dashboard";
    if (p.startsWith("/automation/workflows/"))
        return "automation_workflow";
    if (p === "/automation/workflows")
        return "automation_dashboard";
    if (p.startsWith("/automation/runs/"))
        return "automation_run";
    if (p === "/automation/runs")
        return "automation_dashboard";
    if (p === "/automation/triggers" ||
        p === "/automation/actions" ||
        p === "/automation/rules")
        return "automation_dashboard";
    if (p.startsWith("/automation/"))
        return "automation_rule";
    if (p === "/templates")
        return "templates_dashboard";
    if (p.startsWith("/templates/"))
        return "template_surface";
    if (/^\/messages\/threads\/[^/]+$/.test(p))
        return "message_thread";
    if (p === "/messages" || p.startsWith("/messages/"))
        return "messages_dashboard";
    if (p === "/forms")
        return "forms_dashboard";
    if (p.startsWith("/forms/submission/"))
        return "form_submission";
    if (p.startsWith("/forms/run/"))
        return "form_surface";
    if (p.startsWith("/forms/"))
        return "form_surface";
    if (p === "/files")
        return "files_dashboard";
    if (p.startsWith("/files/signatures/") && p !== "/files/signatures/new")
        return "signature_request";
    if (p.startsWith("/files/sign/"))
        return "signature_request";
    if (p === "/files/explorer" ||
        p === "/files/signatures" ||
        p === "/files/signatures/new" ||
        p === "/files/shares")
        return "files_dashboard";
    if (p.startsWith("/files/share/"))
        return "file_surface";
    if (p.startsWith("/files/"))
        return "file_surface";
    if (p.startsWith("/locations/rooms/"))
        return "room_surface";
    if (p === "/locations" || p.startsWith("/locations/"))
        return "location_dashboard";
    if (p === "/leads")
        return "leads_dashboard";
    if (p.startsWith("/leads/"))
        return "lead_surface";
    if (p.startsWith("/leads"))
        return "leads_dashboard";
    if (p.startsWith("/curriculum/lesson/"))
        return "lesson_surface";
    if (p === "/curriculum")
        return "curriculum_dashboard";
    if (p.startsWith("/curriculum/"))
        return "program_surface";
    if (p.startsWith("/assessments/attempt/"))
        return "assessment_attempt";
    if (p.startsWith("/assessments/run/"))
        return "assessment_surface";
    if (p === "/assessments")
        return "assessments_dashboard";
    if (p.startsWith("/assessments/"))
        return "assessment_surface";
    if (p === "/inventory" || p === "/inventory/")
        return "inventory_dashboard";
    if (p.startsWith("/inventory/"))
        return "inventory_item_surface";
    if (p === "/content" || p === "/content/")
        return "content_dashboard";
    if (p.startsWith("/content/collections/"))
        return "content_collection";
    if (p.startsWith("/content/"))
        return "content_surface";
    if (p === "/reports" || p === "/reports/")
        return "reports_dashboard";
    if (p.startsWith("/reports/builder"))
        return "report_builder";
    if (p.startsWith("/reports/widgets"))
        return "reports_widgets";
    if (p.startsWith("/reports/exports"))
        return "reports_exports";
    if (p.startsWith("/reports/custom/"))
        return "report_viewer";
    if (p.startsWith("/reports/"))
        return "report_viewer";
    if (p.startsWith("/students"))
        return "students";
    if (p.startsWith("/schedule"))
        return "schedule";
    if (p.startsWith("/billing"))
        return "billing";
    if (p.startsWith("/inbox"))
        return "inbox";
    return "dashboard";
}
export async function listBindings(tenantId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .order("page_key", { ascending: true });
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getBinding(pageKey, tenantId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("page_key", pageKey)
        .maybeSingle();
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : null);
}
export async function resolvePageBindings(input, tenantId) {
    var _a;
    const pageKey = (_a = input.pageKey) !== null && _a !== void 0 ? _a : (input.pathname ? pageKeyFromPath(input.pathname) : "dashboard");
    const binding = await getBinding(pageKey, tenantId);
    if (!binding) {
        return { pageKey, binding: null, primaryAgent: null, supportingAgents: [] };
    }
    const [primaryAgent, supportingAgents] = await Promise.all([
        binding.primary_agent_id
            ? getAgentById(binding.primary_agent_id, tenantId)
            : Promise.resolve(null),
        binding.supporting_agent_ids.length > 0
            ? loadAgents(binding.supporting_agent_ids, tenantId)
            : Promise.resolve([]),
    ]);
    return {
        pageKey,
        binding,
        primaryAgent,
        supportingAgents,
    };
}
async function loadAgents(ids, tenantId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from("ziro_agents")
        .select("*")
        .eq("tenant_id", tenantId)
        .in("id", ids);
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function upsertBinding(tenantId, input) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .upsert(Object.assign(Object.assign({}, input), { tenant_id: tenantId, updated_at: new Date().toISOString() }), { onConflict: "tenant_id,page_key" })
        .select("*")
        .single();
    if (error)
        throw error;
    return data;
}
export async function deleteBinding(pageKey, tenantId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("page_key", pageKey);
    if (error)
        throw error;
}
