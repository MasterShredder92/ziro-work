import "server-only";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getLeadById, getLeadConversations, getLeadFamily, getLeadConvertedStudent, getLeadSourceStats, getLeadTimeline, lastActivityAt, listLeads, scoreLead, } from "./queries";
function computeTotals(leads) {
    let open = 0;
    let converted = 0;
    let hot = 0;
    let warm = 0;
    let cold = 0;
    for (const lead of leads) {
        if (lead.converted_student_id)
            converted += 1;
        else if (lead.stage !== "lost")
            open += 1;
        switch (lead.qualification_tier) {
            case "hot":
                hot += 1;
                break;
            case "warm":
                warm += 1;
                break;
            case "cold":
                cold += 1;
                break;
            default:
                break;
        }
    }
    return { all: leads.length, open, converted, hot, warm, cold };
}
export async function getLeadDashboard(tenantId = DEFAULT_TENANT_ID, filters) {
    const [leads, sourceStats] = await Promise.all([
        listLeads(tenantId, filters),
        getLeadSourceStats(tenantId),
    ]);
    return {
        tenantId,
        leads,
        sourceStats,
        totals: computeTotals(leads),
        generatedAt: new Date().toISOString(),
    };
}
export async function getLeadSurface(leadId, tenantId = DEFAULT_TENANT_ID) {
    const lead = await getLeadById(leadId, tenantId);
    if (!lead)
        return null;
    const [conversations, timeline, family, convertedStudent] = await Promise.all([
        getLeadConversations(leadId, lead, tenantId),
        getLeadTimeline(leadId, tenantId),
        getLeadFamily(lead, tenantId),
        getLeadConvertedStudent(lead, tenantId),
    ]);
    const qualification = scoreLead(lead, {
        conversationCount: conversations.length,
        lastActivityAt: lastActivityAt(lead, conversations),
    });
    return {
        tenantId,
        detail: {
            lead,
            family,
            convertedStudent,
            qualification,
            timeline,
            conversations,
        },
        generatedAt: new Date().toISOString(),
    };
}
export async function getLeadSourceStatsSummary(tenantId = DEFAULT_TENANT_ID) {
    return getLeadSourceStats(tenantId);
}
