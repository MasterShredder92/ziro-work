"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Activity, AlertCircle, AlertTriangle, ArrowRight, ArrowUpRight, BarChart3, CalendarClock, CalendarPlus, Clock, CreditCard, Edit, FileText, Flame, GraduationCap, Inbox, ListTodo, MessageSquare, Search, Sparkles, UserPlus, Users, } from "lucide-react";
const ICON_MAP = {
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
export function AgentQuickActionIcon({ name, size = 14, className }) {
    if (!name)
        return null;
    const Icon = ICON_MAP[name];
    if (!Icon)
        return null;
    return _jsx(Icon, { size: size, "aria-hidden": "true", className: className });
}
