-- ══════════════════════════════════════════════════════════
-- ORCHESTRATOR V2 SEED DATA
-- 8 skills + 6 agent templates + linkages
-- Uses ON CONFLICT to be idempotent (safe to re-run)
-- ══════════════════════════════════════════════════════════

-- ── SKILLS ──

insert into skills (slug, name, description, prompt_fragment, runtime, tags) values
(
  'supabase-query',
  'Supabase Query',
  'Run read-only SQL queries against Supabase databases for data retrieval, reporting, and business intelligence.',
  'You have access to Supabase PostgreSQL. Only use SELECT statements. Always include tenant_id filter where applicable. Format results as clean summaries. Never expose raw UUIDs — show human-readable labels.',
  'api',
  '{supabase,sql,query,data,reporting}'
),
(
  'nextjs-code-fix',
  'Next.js Code Fix',
  'Build, modify, and fix React 19 / Next.js / TypeScript / Vite frontend and backend code.',
  'You are working on a React 19 + TypeScript codebase (Vite or Next.js). Use functional components with hooks. Follow existing patterns. Use Tailwind CSS. Import from @/ path alias. Every change must be verified end-to-end before committing.',
  'claude_code',
  '{react,nextjs,typescript,frontend,fix,build}'
),
(
  'vercel-deploy',
  'Vercel Deploy',
  'Handle git operations, commits, pushes, and Vercel deployment triggers.',
  'For deployment: Run all commands from the correct app directory. Use descriptive commit messages. Never force push. After pushing, verify deployment status. Report commit hash and deploy URL.',
  'claude_code',
  '{deploy,git,vercel,commit,push}'
),
(
  'crm-browser-operator',
  'CRM Browser Operator',
  'Operate browser-based CRM interfaces — navigate forms, update records, manage student/family data.',
  'You are a browser automation agent for CRM operations. Navigate carefully. Verify each action before confirming. Handle form validation errors gracefully. Take screenshots at key steps for audit trail.',
  'browser',
  '{crm,browser,automation,forms,data-entry}'
),
(
  'cold-email-sequence',
  'Cold Email Sequence',
  'Research prospects and compose personalized cold email sequences for outreach campaigns.',
  'You write cold email sequences. Research the prospect first. Personalize the opener. Keep emails under 150 words. Include a clear CTA. Write 3-email sequences with 3-day spacing. Never use spam triggers. A/B test subject lines.',
  'browser',
  '{email,outreach,cold-email,sequence,sales}'
),
(
  'lead-research',
  'Lead Research',
  'Research business leads — find contact info, assess fit, score leads, and compile dossiers.',
  'You research business leads. Find owner name, email, phone, website, social profiles. Assess fit based on vertical, location, and size. Score leads 1-10. Compile findings into structured dossiers.',
  'browser',
  '{research,leads,prospecting,scoring}'
),
(
  'content-repurpose',
  'Content Repurpose',
  'Transform existing content into multiple formats — blog posts, social media, email newsletters, video scripts.',
  'You repurpose content across formats. Maintain the core message but adapt tone for each platform. Blog posts: 800-1200 words. Social posts: platform-specific lengths. Email: scannable with clear CTA. Video scripts: conversational tone with timestamps.',
  'manual',
  '{content,repurpose,blog,social,email,video}'
),
(
  'analytics-summary',
  'Analytics Summary',
  'Aggregate data from multiple sources and produce executive-level business summaries and dashboards.',
  'You produce analytics summaries. Pull data from relevant sources. Calculate KPIs: MRR, churn, student count, lesson utilization, revenue per location. Present trends with period-over-period comparisons. Flag anomalies. Keep summaries under 500 words with key metrics highlighted.',
  'api',
  '{analytics,summary,kpi,dashboard,reporting}'
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  prompt_fragment = excluded.prompt_fragment,
  runtime = excluded.runtime,
  tags = excluded.tags;

-- ── AGENT TEMPLATES ──

insert into agent_templates (slug, name, description, base_prompt, supported_runtimes, task_types) values
(
  'orchestrator',
  'Orchestrator',
  'Meta-agent that coordinates other agents, triages tasks, and handles operational workflows.',
  'You are the orchestrator. You do not execute tasks yourself. You classify, route, compose, and review. Delegate to specialized agents. Monitor progress. Escalate blockers. Produce status summaries.',
  '{claude_code,api,manual}',
  '{ops,analytics}'
),
(
  'product-builder',
  'Product Builder',
  'Builds and fixes frontend/backend code in the product codebase.',
  'You are a product builder agent. Build and fix React/Next.js components, Supabase schema, Edge Functions, and full-stack features. Follow existing patterns. Connect everything end-to-end. Commit locally after verified changes.',
  '{claude_code}',
  '{code}'
),
(
  'crm-operator',
  'CRM Operator',
  'Operates CRM interfaces via browser automation and database queries.',
  'You are a CRM operator agent. Navigate CRM interfaces, update records, manage student/family data, and run database queries for CRM operations. Verify every action. Handle errors gracefully.',
  '{browser,api}',
  '{crm}'
),
(
  'outreach-operator',
  'Outreach Operator',
  'Runs lead research and cold email outreach campaigns via browser automation.',
  'You are an outreach operator agent. Research leads, find contact information, score prospects, and compose personalized cold email sequences. Track outreach status. Report results.',
  '{browser}',
  '{outreach}'
),
(
  'content-operator',
  'Content Operator',
  'Repurposes and creates content across formats — requires human review.',
  'You are a content operator agent. Transform content across formats (blog, social, email, video). Maintain brand voice. Produce drafts for human review. Flag any content that needs compliance check.',
  '{manual}',
  '{content}'
),
(
  'qa-recovery',
  'QA & Recovery',
  'Analyzes data quality, recovers from failures, and produces diagnostic reports.',
  'You are a QA and recovery agent. Investigate data quality issues, diagnose failures, produce recovery plans, and generate analytical summaries. Always verify before recommending destructive fixes.',
  '{api,claude_code}',
  '{analytics,ops}'
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  base_prompt = excluded.base_prompt,
  supported_runtimes = excluded.supported_runtimes,
  task_types = excluded.task_types;

-- ── LINK TEMPLATES TO SKILLS ──
-- Delete existing links for these templates first, then re-insert
delete from agent_template_skills where template_id in (
  select id from agent_templates where slug in (
    'orchestrator','product-builder','crm-operator','outreach-operator','content-operator','qa-recovery'
  )
);

-- product-builder -> nextjs-code-fix (0), vercel-deploy (1)
insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 0
from agent_templates t, skills s
where t.slug = 'product-builder' and s.slug = 'nextjs-code-fix';

insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 1
from agent_templates t, skills s
where t.slug = 'product-builder' and s.slug = 'vercel-deploy';

-- crm-operator -> crm-browser-operator (0), supabase-query (1)
insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 0
from agent_templates t, skills s
where t.slug = 'crm-operator' and s.slug = 'crm-browser-operator';

insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 1
from agent_templates t, skills s
where t.slug = 'crm-operator' and s.slug = 'supabase-query';

-- outreach-operator -> lead-research (0), cold-email-sequence (1)
insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 0
from agent_templates t, skills s
where t.slug = 'outreach-operator' and s.slug = 'lead-research';

insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 1
from agent_templates t, skills s
where t.slug = 'outreach-operator' and s.slug = 'cold-email-sequence';

-- content-operator -> content-repurpose (0)
insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 0
from agent_templates t, skills s
where t.slug = 'content-operator' and s.slug = 'content-repurpose';

-- qa-recovery -> analytics-summary (0), supabase-query (1)
insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 0
from agent_templates t, skills s
where t.slug = 'qa-recovery' and s.slug = 'analytics-summary';

insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 1
from agent_templates t, skills s
where t.slug = 'qa-recovery' and s.slug = 'supabase-query';

-- orchestrator -> analytics-summary (0)
insert into agent_template_skills (template_id, skill_id, priority)
select t.id, s.id, 0
from agent_templates t, skills s
where t.slug = 'orchestrator' and s.slug = 'analytics-summary';
