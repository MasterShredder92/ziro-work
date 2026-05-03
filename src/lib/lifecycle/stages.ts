import type { LifecycleBlocker, LifecycleContext, LifecycleStageDefinition } from "./types";

function blocker(code: string, message: string, severity: "info" | "warn" | "error" = "warn"): LifecycleBlocker {
  return { code, message, severity };
}

function hasOverdueInvoices(ctx: LifecycleContext) {
  return ctx.signals.overdueInvoices > 0;
}

function studentStatus(ctx: LifecycleContext): string {
  return ((ctx.student?.status as string | undefined) ?? "").toLowerCase();
}

function isInactiveStudent(ctx: LifecycleContext): boolean {
  const status = studentStatus(ctx);
  return status === "inactive";
}

function isActiveStudent(ctx: LifecycleContext): boolean {
  const status = studentStatus(ctx);
  return status === "active";
}

function hasEnrollmentSignal(ctx: LifecycleContext): boolean {
  return (
    ctx.enrolled ||
    isActiveStudent(ctx) ||
    typeof (ctx.student?.start_date as string | undefined) === "string" ||
    typeof (ctx.student?.first_lesson_date as string | undefined) === "string"
  );
}

export const lifecycleStages: LifecycleStageDefinition[] = [
  {
    id: "intake",
    name: "Inquiries",
    description: "New contacts from web, phone, walk-ins — capture who they are and how to reach them.",
    agent: "star",
    autoAdvance: true,
    entry: () => true,
    exit: (ctx) => {
      const leadStatus = (ctx.lead?.status as string | undefined) ?? null;
      return (
        leadStatus === "contacted" ||
        leadStatus === "trial_scheduled" ||
        leadStatus === "enrolled" ||
        ctx.scheduled ||
        hasEnrollmentSignal(ctx)
      );
    },
    blockers: (ctx) => {
      const out: LifecycleBlocker[] = [];
      if (!ctx.lead) out.push(blocker("missing_lead", "Add how they found you and what they want."));
      // Contact data lives on the family record; student.email/phone were dropped.
      const email = (ctx.student?.primary_email as string | null | undefined) ?? null;
      const phone = (ctx.student?.primary_phone as string | null | undefined) ?? null;
      if (!email && !phone) {
        out.push(blocker("missing_contact", "Add a phone number or email to the family account so you can reach them.", "error"));
      }
      return out;
    },
  },
  {
    id: "lead-work",
    name: "Follow-up",
    description: "Stay in touch until they are ready to put a lesson on the calendar.",
    agent: "star",
    autoAdvance: true,
    entry: (ctx) => {
      const leadStatus = (ctx.lead?.status as string | undefined) ?? null;
      return (
        leadStatus === "contacted" ||
        leadStatus === "trial_scheduled" ||
        leadStatus === "enrolled" ||
        ctx.scheduled ||
        hasEnrollmentSignal(ctx)
      );
    },
    exit: (ctx) => {
      const leadStatus = (ctx.lead?.status as string | undefined) ?? null;
      const trialStatus = (ctx.trial?.status as string | undefined) ?? null;
      return leadStatus === "trial_scheduled" || trialStatus === "scheduled" || trialStatus === "confirmed" || ctx.scheduled;
    },
    blockers: (ctx) => {
      const out: LifecycleBlocker[] = [];
      const leadStatus = (ctx.lead?.status as string | undefined) ?? null;
      if (!leadStatus && !ctx.scheduled && !hasEnrollmentSignal(ctx)) {
        out.push(blocker("missing_lead_status", "Pick where they are in the process (new, interested, ready to book)."));
      }
      return out;
    },
  },
  {
    id: "scheduling",
    name: "Scheduling",
    description: "Match a teacher and lock in a trial or first lesson time.",
    agent: "star",
    autoAdvance: true,
    entry: (ctx) => {
      const leadStatus = (ctx.lead?.status as string | undefined) ?? null;
      const trialStatus = (ctx.trial?.status as string | undefined) ?? null;
      return (
        leadStatus === "trial_scheduled" ||
        trialStatus === "scheduled" ||
        trialStatus === "confirmed" ||
        ctx.scheduled ||
        hasEnrollmentSignal(ctx)
      );
    },
    exit: (ctx) => {
      const trialStatus = (ctx.trial?.status as string | undefined) ?? null;
      return trialStatus === "completed" || trialStatus === "enrolled" || hasEnrollmentSignal(ctx);
    },
    blockers: (ctx) => {
      const out: LifecycleBlocker[] = [];
      if (!ctx.teacherAssigned && !hasEnrollmentSignal(ctx)) {
        out.push(blocker("teacher_unassigned", "Pick a teacher before you book."));
      }
      if (!ctx.scheduled && !hasEnrollmentSignal(ctx)) {
        out.push(blocker("not_scheduled", "Book a trial or first lesson time."));
      }
      return out;
    },
  },
  {
    id: "enrollment",
    name: "Enrollment",
    description: "Plans, paperwork, and payment so regular lessons can start without loose ends.",
    agent: "star",
    autoAdvance: true,
    entry: (ctx) => {
      const trialStatus = (ctx.trial?.status as string | undefined) ?? null;
      return trialStatus === "completed" || trialStatus === "enrolled" || hasEnrollmentSignal(ctx);
    },
    exit: (ctx) => {
      if (!hasEnrollmentSignal(ctx)) return false;
      // Exit enrollment once the student has started receiving service (attendance) or teacher assignment + schedule is set.
      return ctx.serviceStarted || (ctx.teacherAssigned && ctx.scheduled);
    },
    blockers: (ctx) => {
      const out: LifecycleBlocker[] = [];
      if (!hasEnrollmentSignal(ctx))
        out.push(blocker("not_enrolled", "Finish signup so they can start lessons.", "error"));
      if (hasOverdueInvoices(ctx)) {
        out.push(blocker("invoice_overdue", "Collect payment or fix the invoice before the next lesson.", "error"));
      }
      return out;
    },
  },
  {
    id: "service-delivery",
    name: "Ongoing lessons",
    description: "The day-to-day: attendance, subs, billing signals, and keeping the schedule honest.",
    agent: "star",
    autoAdvance: false,
    entry: (ctx) => hasEnrollmentSignal(ctx) && !isInactiveStudent(ctx),
    exit: (ctx) => {
      // Service delivery continues unless churn/inactivity indicates retention/win-back.
      return ctx.riskBand === "high" || (ctx.signals.inactivityDays != null && ctx.signals.inactivityDays >= 30);
    },
    blockers: (ctx) => {
      const out: LifecycleBlocker[] = [];
      if (!ctx.teacherAssigned) out.push(blocker("teacher_unassigned", "Assign a teacher so someone owns the lessons.", "warn"));
      if (hasOverdueInvoices(ctx)) {
        out.push(blocker("invoice_overdue", "Payment is late — follow up kindly before it becomes a problem.", "warn"));
      }
      return out;
    },
  },
  {
    id: "relationship",
    name: "Client care",
    description: "When things are steady, stay visible — families notice consistency before referrals.",
    agent: "star",
    autoAdvance: false,
    entry: (ctx) => hasEnrollmentSignal(ctx) && !isInactiveStudent(ctx) && ctx.riskBand !== "high",
    exit: (ctx) => ctx.riskBand === "high",
    blockers: (ctx) => {
      const out: LifecycleBlocker[] = [];
      if (ctx.signals.missedLessons30d >= 2) {
        out.push(blocker("missed_lessons", "Fix missed lessons before asking for a review.", "info"));
      }
      return out;
    },
  },
  {
    id: "retention",
    name: "Retention",
    description: "When warning lights turn on, step in early with a clear save plan.",
    agent: "star",
    autoAdvance: false,
    entry: (ctx) => hasEnrollmentSignal(ctx) && !isInactiveStudent(ctx) && ctx.riskBand === "high",
    exit: (ctx) => ctx.riskBand !== "high",
    blockers: (ctx) => {
      const out: LifecycleBlocker[] = [];
      if (ctx.signals.inactivityDays != null && ctx.signals.inactivityDays >= 45) {
        out.push(blocker("inactive_long", "They have been gone a long time — switch to a comeback plan.", "info"));
      }
      return out;
    },
  },
  {
    id: "win-back",
    name: "Invite them back",
    description: "Reach out with a simple, respectful comeback offer.",
    agent: "star",
    autoAdvance: false,
    entry: (ctx) => {
      const days = ctx.signals.inactivityDays;
      return (days != null && days >= 45) || isInactiveStudent(ctx);
    },
    exit: () => false,
    blockers: (ctx) => {
      const out: LifecycleBlocker[] = [];
      // Contact data lives on the family record; student.email/phone were dropped.
      const email = (ctx.student?.primary_email as string | null | undefined) ?? null;
      const phone = (ctx.student?.primary_phone as string | null | undefined) ?? null;
      if (!email && !phone) {
        out.push(blocker("missing_contact", "Add a phone number or email to the family account so you can invite them back.", "error"));
      }
      return out;
    },
  },
];

export function getLifecycleStage(id: string): LifecycleStageDefinition | null {
  return lifecycleStages.find((s) => s.id === id) ?? null;
}

