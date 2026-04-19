export type PageBindings = {
  agent: string;
  skills: string[];
  contextLoaders: string[];
};

export const PAGE_AGENT_MAP: Record<string, string> = {
  "/dashboard": "ziro",
  "/leads": "star",
  "/students": "star",
  "/student": "star",
  "/families": "vader",
  "/family": "vader",
  "/teachers": "ruby",
  "/teacher": "ruby",
  "/schedule": "ruby",
  "/tasks": "ziro",
  "/billing": "bub",
  "/invoices": "bub",
  "/inbox": "vader",
  "/admin": "ziro",
  "/director": "ziro",
  "/templates": "vader",
  "/forms": "ziro",
  "/lesson-planner": "ziro",
  "/admin/branding": "ziro",
};

export const PAGE_CONTEXT_LOADERS_MAP: Record<string, string[]> = {
  "/dashboard": [],
  "/leads": ["lead"],
  "/students": ["student"],
  "/student": ["student"],
  "/families": ["family"],
  "/family": ["family"],
  "/teachers": ["teacher"],
  "/teacher": ["teacher"],
  "/schedule": ["teacher"],
  "/tasks": [],
  "/billing": ["invoice"],
  "/invoices": ["invoice"],
  "/inbox": ["family"],
  "/admin": [],
  "/director": [],
  "/lesson-planner": ["teacher"],
  "/admin/branding": [],
};

export type PageContextType =
  | "dashboard"
  | "leads"
  | "student"
  | "family"
  | "teacher"
  | "billing"
  | "schedule"
  | "inbox"
  | "admin"
  | "director"
  | "lesson_planner_dashboard"
  | "lesson_plan_surface"
  | "branding_dashboard"
  | "branding_theme"
  | "branding_domain"
  | "unknown";

export type PageContext = {
  type: PageContextType;
  pathname: string | null;
  agent: string;
};

export type RecommendedSkill = {
  id: string;
  agent: string;
  key: string;
  title: string;
  description: string;
};

export const PAGE_SKILL_MAP: Record<PageContextType, string[]> = {
  dashboard: [
    "ziro.kpiSnapshot",
    "ziro.systemCheck",
    "ziro.usageReport",
    "ziro.agentDiagnostics",
  ],
  student: [
    "star.qualifyLead",
    "stewie.scheduleFollowup",
    "vader.messageFamily",
    "ruby.findAvailability",
  ],
  family: [
    "vader.messageFamily",
    "bub.generateInvoice",
    "bub.listOutstanding",
    "stewie.scheduleFollowup",
  ],
  teacher: [
    "ruby.findAvailability",
    "ruby.addBlock",
    "ruby.detectConflicts",
    "ruby.teacherLoadReport",
    "vader.messageTeacher",
  ],
  billing: [
    "bub.generateInvoice",
    "bub.listOutstanding",
    "bub.recordPayment",
    "bub.invoiceAgingReport",
    "bub.reconcileSquare",
  ],
  leads: [
    "star.addLead",
    "star.hotLeads",
    "star.qualifyLead",
    "star.promoteLead",
    "star.findLeadDuplicates",
  ],
  schedule: [
    "ruby.findAvailability",
    "ruby.addBlock",
    "ruby.detectConflicts",
    "ruby.suggestSchedule",
    "stewie.scheduleFollowup",
  ],
  inbox: [
    "vader.inboxSummary",
    "vader.messageFamily",
    "vader.messageTeacher",
    "vader.messageStudent",
  ],
  admin: [
    "ziro.systemCheck",
    "ziro.kpiSnapshot",
    "ziro.usageReport",
    "ziro.agentDiagnostics",
  ],
  director: [
    "ziro.kpiSnapshot",
    "ziro.usageReport",
    "ruby.teacherLoadReport",
    "bub.invoiceAgingReport",
    "star.hotLeads",
  ],
  lesson_planner_dashboard: [
    "ziro.kpiSnapshot",
    "ziro.generateLessonPlan",
    "ziro.semanticSearch",
    "vader.messageTeacher",
    "stewie.scheduleFollowup",
  ],
  lesson_plan_surface: [
    "ziro.generateLessonPlan",
    "ziro.semanticSearch",
    "ziro.kpiSnapshot",
    "vader.messageTeacher",
    "stewie.scheduleFollowup",
  ],
  branding_dashboard: [
    "ziro.kpiSnapshot",
    "ruby.detectConflicts",
    "stewie.scheduleFollowup",
    "vader.messageTeacher",
  ],
  branding_theme: [
    "ziro.kpiSnapshot",
    "ruby.detectConflicts",
    "stewie.scheduleFollowup",
    "vader.messageTeacher",
  ],
  branding_domain: [
    "ziro.kpiSnapshot",
    "ruby.detectConflicts",
    "stewie.scheduleFollowup",
    "vader.messageTeacher",
  ],
  unknown: [],
};

const PATHNAME_TO_CONTEXT: Array<[string, PageContextType]> = [
  ["/admin/branding/theme", "branding_theme"],
  ["/admin/branding/domain", "branding_domain"],
  ["/admin/branding", "branding_dashboard"],
  ["/admin", "admin"],
  ["/director", "director"],
  ["/dashboard", "dashboard"],
  ["/leads", "leads"],
  ["/students", "student"],
  ["/student", "student"],
  ["/families", "family"],
  ["/family", "family"],
  ["/teachers", "teacher"],
  ["/teacher", "teacher"],
  ["/schedule", "schedule"],
  ["/billing", "billing"],
  ["/invoices", "billing"],
  ["/inbox", "inbox"],
  ["/lesson-planner", "lesson_planner_dashboard"],
];

const DEFAULT_AGENT = "ziro";

function normalize(pathname: string | null | undefined): string {
  if (!pathname) return "/";
  const trimmed = pathname.trim();
  if (trimmed.length === 0) return "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withSlash === "/") return "/";
  return withSlash.replace(/\/+$/g, "") || "/";
}

function findBestKey(
  pathname: string,
  map: Record<string, unknown>,
): string | null {
  if (Object.prototype.hasOwnProperty.call(map, pathname)) return pathname;

  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (pathname === key) return key;
    if (pathname.startsWith(`${key}/`)) return key;
  }
  return null;
}

function findBestMatch(pathname: string): string | null {
  const key = findBestKey(pathname, PAGE_AGENT_MAP);
  return key ? PAGE_AGENT_MAP[key] : null;
}

function findContextLoaders(pathname: string): string[] {
  const key = findBestKey(pathname, PAGE_CONTEXT_LOADERS_MAP);
  return key ? PAGE_CONTEXT_LOADERS_MAP[key] : [];
}

export function getPageBindings(
  pathname: string | null | undefined,
): PageBindings {
  const normalized = normalize(pathname);
  const agent = findBestMatch(normalized) ?? DEFAULT_AGENT;
  const contextLoaders = findContextLoaders(normalized);
  return {
    agent,
    skills: [],
    contextLoaders,
  };
}

export function getPageContextType(
  pathname: string | null | undefined,
): PageContextType {
  const normalized = normalize(pathname);

  if (
    normalized.startsWith("/lesson-planner/") &&
    !normalized.startsWith("/lesson-planner/api")
  ) {
    return "lesson_plan_surface";
  }

  const sorted = [...PATHNAME_TO_CONTEXT].sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [prefix, kind] of sorted) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return kind;
    }
  }
  return "unknown";
}

export function getPageContext(
  pathname: string | null | undefined,
): PageContext {
  const normalized = normalize(pathname);
  const type = getPageContextType(normalized);
  const agent = findBestMatch(normalized) ?? DEFAULT_AGENT;
  return { type, pathname: normalized, agent };
}

export type PageContextInput =
  | string
  | null
  | undefined
  | PageContext
  | { pathname?: string | null; type?: PageContextType | null };

function coercePageContextType(input: PageContextInput): PageContextType {
  if (!input) return "unknown";
  if (typeof input === "string") return getPageContextType(input);
  if ("type" in input && input.type) return input.type;
  if ("pathname" in input) return getPageContextType(input.pathname ?? null);
  return "unknown";
}

export function getPageRecommendedSkills(
  pageContext: PageContextInput,
): RecommendedSkill[] {
  const type = coercePageContextType(pageContext);
  const ids = PAGE_SKILL_MAP[type] ?? [];
  return ids.map((id) => {
    const [agent, key] = id.split(".") as [string, string];
    return {
      id,
      agent,
      key,
      title: humanizeSkillKey(key),
      description: `${humanizeAgent(agent)} · ${humanizeSkillKey(key)}`,
    };
  });
}

function humanizeSkillKey(key: string): string {
  if (!key) return "";
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function humanizeAgent(slug: string): string {
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}
