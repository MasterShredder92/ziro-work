function blocker(code, message, severity = "warn") {
    return { code, message, severity };
}
function hasOverdueInvoices(ctx) {
    return ctx.signals.overdueInvoices > 0;
}
function studentStatus(ctx) {
    var _a, _b;
    return ((_b = (_a = ctx.student) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : "").toLowerCase();
}
function isInactiveStudent(ctx) {
    const status = studentStatus(ctx);
    return status === "inactive" || status === "former" || status === "cancelled" || status === "churned";
}
function isActiveStudent(ctx) {
    const status = studentStatus(ctx);
    return status === "active" || status === "enrolled" || status === "current";
}
function hasEnrollmentSignal(ctx) {
    var _a, _b;
    return (ctx.enrolled ||
        isActiveStudent(ctx) ||
        typeof ((_a = ctx.student) === null || _a === void 0 ? void 0 : _a.start_date) === "string" ||
        typeof ((_b = ctx.student) === null || _b === void 0 ? void 0 : _b.first_lesson_date) === "string");
}
export const lifecycleStages = [
    {
        id: "intake",
        name: "Inquiries",
        description: "New contacts from web, phone, walk-ins — capture who they are and how to reach them.",
        agent: "star",
        autoAdvance: true,
        entry: () => true,
        exit: (ctx) => {
            var _a, _b;
            const leadStatus = (_b = (_a = ctx.lead) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : null;
            return (leadStatus === "contacted" ||
                leadStatus === "trial_scheduled" ||
                leadStatus === "enrolled" ||
                ctx.scheduled ||
                hasEnrollmentSignal(ctx));
        },
        blockers: (ctx) => {
            var _a, _b, _c, _d;
            const out = [];
            if (!ctx.lead)
                out.push(blocker("missing_lead", "Add how they found you and what they want."));
            const email = (_b = (_a = ctx.student) === null || _a === void 0 ? void 0 : _a.email) !== null && _b !== void 0 ? _b : null;
            const phone = (_d = (_c = ctx.student) === null || _c === void 0 ? void 0 : _c.phone) !== null && _d !== void 0 ? _d : null;
            if (!email && !phone) {
                out.push(blocker("missing_contact", "Add a phone number or email so you can reach them.", "error"));
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
            var _a, _b;
            const leadStatus = (_b = (_a = ctx.lead) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : null;
            return (leadStatus === "contacted" ||
                leadStatus === "trial_scheduled" ||
                leadStatus === "enrolled" ||
                ctx.scheduled ||
                hasEnrollmentSignal(ctx));
        },
        exit: (ctx) => {
            var _a, _b, _c, _d;
            const leadStatus = (_b = (_a = ctx.lead) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : null;
            const trialStatus = (_d = (_c = ctx.trial) === null || _c === void 0 ? void 0 : _c.status) !== null && _d !== void 0 ? _d : null;
            return leadStatus === "trial_scheduled" || trialStatus === "scheduled" || trialStatus === "confirmed" || ctx.scheduled;
        },
        blockers: (ctx) => {
            var _a, _b;
            const out = [];
            const leadStatus = (_b = (_a = ctx.lead) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : null;
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
            var _a, _b, _c, _d;
            const leadStatus = (_b = (_a = ctx.lead) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : null;
            const trialStatus = (_d = (_c = ctx.trial) === null || _c === void 0 ? void 0 : _c.status) !== null && _d !== void 0 ? _d : null;
            return (leadStatus === "trial_scheduled" ||
                trialStatus === "scheduled" ||
                trialStatus === "confirmed" ||
                ctx.scheduled ||
                hasEnrollmentSignal(ctx));
        },
        exit: (ctx) => {
            var _a, _b;
            const trialStatus = (_b = (_a = ctx.trial) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : null;
            return trialStatus === "completed" || trialStatus === "enrolled" || hasEnrollmentSignal(ctx);
        },
        blockers: (ctx) => {
            const out = [];
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
            var _a, _b;
            const trialStatus = (_b = (_a = ctx.trial) === null || _a === void 0 ? void 0 : _a.status) !== null && _b !== void 0 ? _b : null;
            return trialStatus === "completed" || trialStatus === "enrolled" || hasEnrollmentSignal(ctx);
        },
        exit: (ctx) => {
            if (!hasEnrollmentSignal(ctx))
                return false;
            // Exit enrollment once the student has started receiving service (attendance) or teacher assignment + schedule is set.
            return ctx.serviceStarted || (ctx.teacherAssigned && ctx.scheduled);
        },
        blockers: (ctx) => {
            const out = [];
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
            const out = [];
            if (!ctx.teacherAssigned)
                out.push(blocker("teacher_unassigned", "Assign a teacher so someone owns the lessons.", "warn"));
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
            const out = [];
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
            const out = [];
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
            var _a, _b, _c, _d;
            const out = [];
            const email = (_b = (_a = ctx.student) === null || _a === void 0 ? void 0 : _a.email) !== null && _b !== void 0 ? _b : null;
            const phone = (_d = (_c = ctx.student) === null || _c === void 0 ? void 0 : _c.phone) !== null && _d !== void 0 ? _d : null;
            if (!email && !phone) {
                out.push(blocker("missing_contact", "Add a phone number or email so you can invite them back.", "error"));
            }
            return out;
        },
    },
];
export function getLifecycleStage(id) {
    var _a;
    return (_a = lifecycleStages.find((s) => s.id === id)) !== null && _a !== void 0 ? _a : null;
}
