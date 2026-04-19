// Load tools
import "./tools/enqueueTask";
import "./tools/getKpis";
import "./tools/getTenantSettings";
import "./tools/computeTenantKpis";
import "./tools/logTenantEvent";
import "./tools/getLeads";
import "./tools/getTrials";
import "./tools/getStudents";
import "./tools/scoreLead";
import "./tools/prioritizeTrials";
import "./tools/followUpLead";
import "./tools/sendTrialReminder";
import "./tools/computeLeadAging";
import "./tools/detectInactiveLeads";
import "./tools/planOutreachSequence";
import "./tools/computeTrialAging";
import "./tools/detectInactiveTrials";
import "./tools/planTrialSequence";
import "./tools/updateTrialStatus";
import "./tools/updateLeadStatus";
import "./tools/logLeadFollowUp";
import "./tools/scheduleTrial";
import "./tools/logEvent";
import "./tools/detectTrialToEnrollment";
import "./tools/createEnrollment";
import "./tools/planOnboardingSequence";
import "./tools/sendOnboardingMessage";
import "./tools/updateStudent";
import "./tools/detectAtRiskStudents";
import "./tools/planRetentionSequence";

// Load agents
// Legacy agents (dashboardAgent, enrollmentCoordinator) removed.
// Current agent roster is defined in ./registry.ts and ./agentMetadata.ts:
// ziro, star, ruby, stewie, vader, bub, sid

