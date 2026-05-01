// Plain data/type module — no "use client" directive.
// Safe to import from both server and client components.

export type DirectorNavItem = {
  id: string;
  label: string;
  href: string;
  description?: string;
  scope?: string;
};

export const DIRECTOR_NAV: DirectorNavItem[] = [
  { id: "overview", label: "Overview", href: "#overview", description: "KPIs and summary" },
  { id: "crm", label: "CRM", href: "/crm", description: "Contacts, students, families", scope: "crm.read" },
  { id: "leads", label: "Leads", href: "#leads", description: "Pipeline", scope: "leads.read" },
  { id: "students", label: "Students", href: "#students", description: "Enrollment", scope: "students.read" },
  { id: "teachers", label: "Teachers", href: "#teachers", description: "Load & roster", scope: "students.read" },
  { id: "schedule", label: "Schedule", href: "/schedule", description: "Calendar & events", scope: "schedule.read" },
  { id: "billing", label: "Billing", href: "/billing", description: "Revenue & AR", scope: "billing.read" },
  { id: "attendance", label: "Attendance", href: "/attendance", description: "Sessions & risk", scope: "attendance.read" },
  { id: "lesson-planner", label: "Lesson Planner", href: "/lesson-planner", description: "AI-drafted lesson plans", scope: "lessonPlanner.read" },
  { id: "inventory", label: "Inventory", href: "/inventory", description: "Assets & maintenance", scope: "inventory.read" },
  { id: "content", label: "Content Library", href: "/content", description: "Files, tags, collections", scope: "content.read" },
  { id: "files", label: "Files", href: "/files", description: "Documents, signatures, share links", scope: "files.read" },
  { id: "messages", label: "Messages", href: "/messages", description: "Inbox, threads & delivery", scope: "messages.read" },
  { id: "templates", label: "Templates", href: "/templates", description: "Communication templates", scope: "templates.read" },
  { id: "student-messages", label: "Student Messages", href: "#student-messages", description: "Feedback routed to director" },
  { id: "reports", label: "Reports", href: "/reports", description: "Dashboards, KPIs & exports", scope: "reports.read" },
  { id: "crew", label: "Agent Crew", href: "/director/crew", description: "Automation activity & savings" },
  { id: "outbox", label: "RAVEN Outbox", href: "/director/crew/approvals", description: "Pending messages awaiting approval" },
];
