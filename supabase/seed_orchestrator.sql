-- ══════════════════════════════════════════════════════════
-- ORCHESTRATOR V1 SEED DATA
-- 8 skills + 6 agent templates + linkages
-- ══════════════════════════════════════════════════════════

-- ── SKILLS ──

insert into skills (slug, name, description, prompt_fragment, runtime, tags) values
(
  'react-frontend',
  'React Frontend',
  'Build and modify React 19 / TypeScript / Vite frontend components, pages, hooks, and styling.',
  'You are working on a React 19 + TypeScript + Vite frontend. Use functional components with hooks. Follow existing component patterns. Use Tailwind CSS utility classes. Import from @/ path alias. Do not add new dependencies without explicit approval.',
  'claude_code',
  '{react,frontend,typescript,vite}'
),
(
  'supabase-backend',
  'Supabase Backend',
  'Write and modify Supabase queries, RLS policies, migrations, Edge Functions, and database schema.',
  'You are working with Supabase (PostgreSQL). All queries must include tenant_id filter. Use the existing supabase client from src/lib/supabase.ts. Write migrations as idempotent SQL (IF NOT EXISTS, IF NOT EXISTS). Never drop tables or columns without explicit approval. Use RLS policies for all new tables.',
  'claude_code',
  '{supabase,database,sql,rls}'
),
(
  'bug-diagnosis',
  'Bug Diagnosis',
  'Systematically diagnose and fix bugs. Read error messages, trace data flow, identify root cause before changing code.',
  'When fixing a bug: 1) Read the error message or reproduction steps carefully. 2) Trace the data flow from UI to database. 3) Identify the exact root cause before writing any fix. 4) Fix only the root cause — do not refactor surrounding code. 5) Verify the fix does not break related functionality. 6) Add a console.log or comment explaining what was wrong if the bug was subtle.',
  'claude_code',
  '{debug,fix,diagnosis,error}'
),
(
  'git-operations',
  'Git Operations',
  'Handle git commits, pushes, branch management, and deployment triggers.',
  'For git operations: Always run commands from D:\\music-school-os\\app. Use descriptive commit messages. Never force push. Never rebase without explicit approval. After committing, report the commit hash and summary.',
  'claude_code',
  '{git,deploy,commit,push}'
),
(
  'api-integration',
  'API Integration',
  'Connect to external APIs (Square, SignWell, QUO SMS, etc.) via Supabase Edge Functions.',
  'When integrating external APIs: Use Supabase Edge Functions (supabase/functions/). Always validate incoming webhook payloads. Store API keys in environment variables, never in code. Handle rate limits and retries. Log all external API calls for observability.',
  'api',
  '{api,integration,webhook,edge-function}'
),
(
  'data-query',
  'Data Query & Analysis',
  'Run read-only SQL queries against databases to analyze data, generate reports, and answer business questions.',
  'When querying data: Only use SELECT statements. Always include tenant_id filter. Aggregate with COUNT/SUM/AVG where appropriate. Format results as clean tables or summaries. Never expose raw UUIDs to the user — show names and labels instead.',
  'api',
  '{query,data,analysis,reporting}'
),
(
  'ui-design',
  'UI Design System',
  'Apply the V9 glassmorphism design system — dark backgrounds, Plus Jakarta Sans, brand colors, mobile-first.',
  'Design system rules: Background #020209. Brand colors: Pink #D4226A, Orange #FF5500, Gold #FFB800. Font: Plus Jakarta Sans 800-900 weight. Use glassmorphism card patterns (bg-[#111] border border-[#1a1a1a] rounded-xl). Green accent #00ff88 for active states. Always build mobile-first. Loading states required. Error states required.',
  'claude_code',
  '{design,ui,css,styling}'
),
(
  'testing-verification',
  'Testing & Verification',
  'Verify that changes work end-to-end. Check data loads, buttons work, navigation flows, no console errors.',
  'After making changes, verify: 1) Data loads from real database (not placeholder). 2) All buttons and links go somewhere real. 3) Navigation works in both directions. 4) No console errors. 5) Mobile responsive. 6) Loading and error states present. Report each check as pass/fail.',
  'claude_code',
  '{test,verify,qa,validation}'
);

-- ── AGENT TEMPLATES ──

insert into agent_templates (slug, name, description, base_prompt, supported_runtimes, task_types) values
(
  'frontend-builder',
  'Frontend Builder',
  'Builds and modifies React frontend components, pages, and UI.',
  'You are a frontend builder agent. Your job is to create and modify React components, pages, and hooks in the Lessonpreneur codebase. Follow existing patterns. Build mobile-first. Connect everything end-to-end — no dead-end components.',
  '{claude_code}',
  '{build,feature,component,page,ui}'
),
(
  'backend-builder',
  'Backend Builder',
  'Creates and modifies Supabase schema, queries, Edge Functions, and backend logic.',
  'You are a backend builder agent. Your job is to create and modify database schema, write queries, build Edge Functions, and handle data layer logic. Every table needs RLS. Every query needs tenant_id. Every migration must be idempotent.',
  '{claude_code}',
  '{schema,migration,rls,edge-function,backend}'
),
(
  'bug-fixer',
  'Bug Fixer',
  'Diagnoses and fixes bugs with systematic root-cause analysis.',
  'You are a bug fixer agent. Your job is to diagnose and fix bugs in the Lessonpreneur codebase. Always trace the full data chain before writing a fix. Never patch — rebuild the broken section cleanly. Verify the fix does not break related functionality.',
  '{claude_code}',
  '{fix,bug,error,broken,debug}'
),
(
  'fullstack-builder',
  'Fullstack Builder',
  'Builds features that span frontend + backend + database.',
  'You are a fullstack builder agent. Your job is to build complete features that connect frontend components to backend data through Supabase. Every feature must work end-to-end: database schema → queries → API/hooks → UI components → navigation. Nothing is done until the full chain is verified.',
  '{claude_code}',
  '{feature,fullstack,end-to-end}'
),
(
  'data-analyst',
  'Data Analyst',
  'Queries databases and generates reports, summaries, and business insights.',
  'You are a data analyst agent. Your job is to query the Lessonpreneur database and provide business insights. Use read-only SQL. Format results clearly. Highlight anomalies and trends. Never modify data.',
  '{api}',
  '{query,report,data,analysis,count,summary}'
),
(
  'deployer',
  'Deployer',
  'Handles git operations, commits, pushes, and deployment triggers.',
  'You are a deployer agent. Your job is to commit changes, push to GitHub, and trigger deployments. Always verify changes before committing. Use descriptive commit messages. Never force push. Report deployment status.',
  '{claude_code}',
  '{deploy,push,commit,ship}'
);

-- ── LINK TEMPLATES TO SKILLS ──

-- Frontend Builder: react-frontend, ui-design, testing-verification
insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 0
from agent_templates t, skills s
where t.slug = 'frontend-builder' and s.slug = 'react-frontend';

insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 1
from agent_templates t, skills s
where t.slug = 'frontend-builder' and s.slug = 'ui-design';

insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 2
from agent_templates t, skills s
where t.slug = 'frontend-builder' and s.slug = 'testing-verification';

-- Backend Builder: supabase-backend, api-integration
insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 0
from agent_templates t, skills s
where t.slug = 'backend-builder' and s.slug = 'supabase-backend';

insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 1
from agent_templates t, skills s
where t.slug = 'backend-builder' and s.slug = 'api-integration';

-- Bug Fixer: bug-diagnosis, react-frontend, supabase-backend
insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 0
from agent_templates t, skills s
where t.slug = 'bug-fixer' and s.slug = 'bug-diagnosis';

insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 1
from agent_templates t, skills s
where t.slug = 'bug-fixer' and s.slug = 'react-frontend';

insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 2
from agent_templates t, skills s
where t.slug = 'bug-fixer' and s.slug = 'supabase-backend';

-- Fullstack Builder: react-frontend, supabase-backend, ui-design, testing-verification
insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 0
from agent_templates t, skills s
where t.slug = 'fullstack-builder' and s.slug = 'react-frontend';

insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 1
from agent_templates t, skills s
where t.slug = 'fullstack-builder' and s.slug = 'supabase-backend';

insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 2
from agent_templates t, skills s
where t.slug = 'fullstack-builder' and s.slug = 'ui-design';

insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 3
from agent_templates t, skills s
where t.slug = 'fullstack-builder' and s.slug = 'testing-verification';

-- Data Analyst: data-query
insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 0
from agent_templates t, skills s
where t.slug = 'data-analyst' and s.slug = 'data-query';

-- Deployer: git-operations, testing-verification
insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 0
from agent_templates t, skills s
where t.slug = 'deployer' and s.slug = 'git-operations';

insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 1
from agent_templates t, skills s
where t.slug = 'deployer' and s.slug = 'testing-verification';
