"use client";

import * as React from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CalendarPlus,
  Clock,
  CreditCard,
  Edit,
  FileText,
  Flame,
  GraduationCap,
  Inbox,
  ListTodo,
  MessageSquare,
  Search,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CalendarPlus,
  Clock,
  CreditCard,
  Edit,
  FileText,
  Flame,
  GraduationCap,
  Inbox,
  ListTodo,
  MessageSquare,
  Search,
  Sparkles,
  UserPlus,
  Users,
};

type Props = { name?: string; size?: number; className?: string };

export function AgentQuickActionIcon({ name, size = 14, className }: Props) {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} aria-hidden="true" className={className} />;
}
