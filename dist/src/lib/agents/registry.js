const registry = {
    ziro: {
        id: "ziro",
        name: "Ziro",
        role: "Plain-English helper",
        description: "Explains screens and next clicks in simple words — no jargon.",
    },
    star: {
        id: "star",
        name: "STAR",
        role: "Pipeline coach",
        description: "Tells you what to open first: leads, trials, and new sign-ups.",
    },
    ruby: {
        id: "ruby",
        name: "Ruby",
        role: "Schedule & calendar",
        description: "Finds open times, spots conflicts, and keeps lessons from colliding.",
    },
    stewie: {
        id: "stewie",
        name: "Stewie",
        role: "Follow-ups & onboarding",
        description: "Tracks who still needs a call or a next step so nobody slips away.",
    },
    vader: {
        id: "vader",
        name: "Vader",
        role: "Messages for families & staff",
        description: "Pulls teacher and family chatter together so replies stay in one place.",
    },
    bub: {
        id: "bub",
        name: "Bub",
        role: "Money & invoices",
        description: "Shows who owes you, what was paid, and what is still out.",
    },
    sid: {
        id: "sid",
        name: "Sid",
        role: "Retention & at-risk students",
        description: "Highlights families who might quit before you lose the tuition.",
    },
};
export function getAgent(agentId) {
    var _a;
    return (_a = registry[agentId]) !== null && _a !== void 0 ? _a : null;
}
export function listAgents() {
    return Object.values(registry);
}
