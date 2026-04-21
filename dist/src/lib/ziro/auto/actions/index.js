import { leadAutoActions } from "./leadActions";
import { scheduleAutoActions } from "./scheduleActions";
import { billingAutoActions } from "./billingActions";
import { retentionAutoActions } from "./retentionActions";
export const autoActionPacks = {
    leads: leadAutoActions,
    schedule: scheduleAutoActions,
    billing: billingAutoActions,
    retention: retentionAutoActions,
};
export { leadAutoActions, scheduleAutoActions, billingAutoActions, retentionAutoActions, };
export { detectStaleLeads, detectHotLeads, autoAssignLeads, } from "./leadActions";
export { detectTeacherOverload, detectOpenSlots, autoSuggestMakeupLessons, } from "./scheduleActions";
export { detectOverdueInvoices, autoSendInvoiceReminders, autoApplyLateFees, } from "./billingActions";
export { detectAtRiskStudents, detectChurnSignals, autoNotifyFamily, } from "./retentionActions";
