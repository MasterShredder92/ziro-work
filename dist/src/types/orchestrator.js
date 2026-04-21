// ── Orchestrator Types — matches live Ziro Work Supabase schema ──
// Type guard helpers
export function isRouteDecision(r) {
    return !("proposed" in r) && "template" in r && r.template !== null;
}
export function isTemplateProposal(r) {
    return "proposed" in r && r.proposed === true;
}
export function isStarControlDelegation(r) {
    return "source" in r && r.source === "star_control";
}
