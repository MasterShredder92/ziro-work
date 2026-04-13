import type { ClassifiedTask, Runtime } from "@/types/orchestrator";

// Keyword → task_type mapping
const TASK_TYPE_KEYWORDS: Record<string, string[]> = {
  fix: ["fix", "bug", "broken", "error", "crash", "failing", "not working", "issue", "wrong"],
  build: ["build", "create", "add", "new feature", "implement", "make"],
  feature: ["feature", "functionality", "capability"],
  component: ["component", "modal", "card", "panel", "sidebar", "header"],
  page: ["page", "view", "screen", "route"],
  ui: ["ui", "design", "style", "css", "layout", "responsive", "mobile"],
  schema: ["schema", "table", "column", "migration", "database", "rls"],
  query: ["query", "count", "how many", "report", "data", "show me", "list"],
  deploy: ["deploy", "push", "ship", "commit", "release"],
  backend: ["edge function", "rpc", "api", "webhook", "endpoint"],
};

// Task type → suggested runtime
const RUNTIME_MAP: Record<string, Runtime> = {
  fix: "claude_code",
  build: "claude_code",
  feature: "claude_code",
  component: "claude_code",
  page: "claude_code",
  ui: "claude_code",
  schema: "claude_code",
  query: "api",
  deploy: "claude_code",
  backend: "claude_code",
};

export function classifyTask(title: string, description: string): ClassifiedTask {
  const text = `${title} ${description}`.toLowerCase();

  // Score each task type by keyword matches
  let bestType = "build";
  let bestScore = 0;
  const matchedKeywords: string[] = [];

  for (const [taskType, keywords] of Object.entries(TASK_TYPE_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        score++;
        matchedKeywords.push(kw);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = taskType;
    }
  }

  return {
    task_type: bestType,
    keywords: [...new Set(matchedKeywords)],
    suggested_runtime: RUNTIME_MAP[bestType] || "claude_code",
  };
}
