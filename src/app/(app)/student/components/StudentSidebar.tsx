"use client";

import { PortalSidebarNav } from "@/components/portals/PortalSidebarNav";

export interface StudentNavItem {
  id: string;
  href: string;
  label: string;
  icon: string;
  scope?: string;
  match: (pathname: string) => boolean;
}

export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  {
    id: "overview",
    href: "/student",
    label: "Overview",
    icon: "▦",
    match: (p) => p === "/student",
  },
  {
    id: "profile",
    href: "/student/profile",
    label: "My Profile",
    icon: "☺",
    scope: "crm.read",
    match: (p) => p.startsWith("/student/profile"),
  },
  {
    id: "schedule",
    href: "/schedule/student",
    label: "Schedule",
    icon: "⌚",
    scope: "schedule.read",
    match: (p) => p.startsWith("/schedule/student"),
  },
  {
    id: "lessons",
    href: "/student#lessons",
    label: "Lessons",
    icon: "♪",
    scope: "student.read",
    match: (p) => p.startsWith("/student/lessons"),
  },
  {
    id: "progress",
    href: "/student/progress",
    label: "Progress",
    icon: "★",
    scope: "student.read",
    match: (p) => p.startsWith("/student/progress"),
  },
  {
    id: "attendance",
    href: "/student/attendance",
    label: "Attendance",
    icon: "⏱",
    scope: "attendance.read",
    match: (p) => p.startsWith("/student/attendance"),
  },
  {
    id: "assessments",
    href: "/assessments",
    label: "Assessments",
    icon: "◈",
    scope: "assessments.read",
    match: (p) => p.startsWith("/assessments"),
  },
  {
    id: "resources",
    href: "/content",
    label: "Resources",
    icon: "▤",
    scope: "content.read",
    match: (p) => p.startsWith("/content"),
  },
  {
    id: "automation",
    href: "/automation",
    label: "Automations",
    icon: "⚙",
    scope: "automation.read",
    match: (p) => p.startsWith("/automation"),
  },
  {
    id: "messages",
    href: "/messages",
    label: "Messages",
    icon: "✉",
    scope: "messages.read",
    match: (p) => p === "/messages" || p.startsWith("/messages/"),
  },
  {
    id: "billing",
    href: "/student#billing",
    label: "Billing",
    icon: "$",
    scope: "billing.read",
    match: (p) => p.startsWith("/student/billing"),
  },
  {
    id: "payments",
    href: "/student/payments",
    label: "Payments",
    icon: "◉",
    scope: "billing.read",
    match: (p) => p.startsWith("/student/payments"),
  },
];

export interface StudentSidebarProps {
  allowedNavIds?: string[] | null;
  onNavigate?: () => void;
}

export function StudentSidebar({
  allowedNavIds,
  onNavigate,
}: StudentSidebarProps) {
  return (
    <PortalSidebarNav
      label="Student Portal"
      items={STUDENT_NAV_ITEMS}
      allowedNavIds={allowedNavIds}
      onNavigate={onNavigate}
    />
  );
}
