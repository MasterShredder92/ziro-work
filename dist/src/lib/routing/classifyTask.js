// Keyword → task category mapping
const CATEGORY_KEYWORDS = {
    code: [
        "fix", "bug", "broken", "error", "crash", "build", "create", "component",
        "page", "feature", "schema", "migration", "rls", "edge function",
        "api route", "deploy", "push", "commit", "frontend", "backend", "refactor",
        "test",
    ],
    ui: [
        "ui", "layout", "responsive", "styling", "style", "css", "tailwind", "design system",
        "typography", "spacing", "breakpoint", "mobile view", "visual", "figma", "pixel",
    ],
    crm: [
        "crm", "student", "family", "enrollment", "contact record", "update record",
        "billing", "invoice", "schedule", "session", "teacher", "location",
        "attendance", "profile", "registration",
    ],
    outreach: [
        "outreach", "cold email", "lead", "prospect", "campaign", "sequence",
        "follow up", "sales", "pipeline", "research business", "find email",
        "lead score",
    ],
    content: [
        "content", "blog", "social media", "newsletter", "video script",
        "repurpose", "write post", "marketing", "copy", "announcement",
    ],
    analytics: [
        "analytics", "report", "summary", "kpi", "dashboard", "metrics",
        "how many", "count", "revenue", "churn", "growth", "trend",
        "data quality", "recovery", "audit",
    ],
    ops: [
        "ops", "operations", "workflow", "automation", "status", "triage",
        "coordinate", "escalate", "review", "monitor", "infrastructure",
    ],
};
// Category → default runtime
const RUNTIME_MAP = {
    code: "claude_code",
    ui: "claude_code",
    crm: "browser",
    outreach: "browser",
    content: "manual",
    analytics: "api",
    ops: "manual",
};
export function classifyTask(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    let bestCategory = "code";
    let bestScore = 0;
    const matchedKeywords = [];
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        let score = 0;
        for (const kw of keywords) {
            if (text.includes(kw)) {
                score++;
                matchedKeywords.push(kw);
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
        }
    }
    return {
        task_type: bestCategory,
        keywords: [...new Set(matchedKeywords)],
        suggested_runtime: RUNTIME_MAP[bestCategory],
    };
}
