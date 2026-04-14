-- ======================================================================
-- ORCHESTRATOR V3 SEED DATA
-- Adds missing templates, skills, and linkages per STAR operating model.
-- Marks non-music-school templates as hidden. Idempotent (ON CONFLICT).
--
-- IMPORTANT: Uses actual DB column names:
--   skills: key, system_prompt_fragment, preferred_runtime (enum), category
--   agent_templates: key, role, base_system_prompt
--   agent_template_skills: agent_template_id
--   Alias columns (slug, prompt_fragment, runtime, tags) also exist.
-- ======================================================================

-- ── NEW SKILLS ──
-- These fill the gaps from the operating model roster (Sections 3B-3H).

INSERT INTO skills (key, name, description, system_prompt_fragment, preferred_runtime, category, is_active, business_context) VALUES
('repo-inspector', 'Repo Inspector',
 'Inspect repository structure, file dependencies, and code patterns for analysis.',
 'You can inspect any file in the repository. Use tree views, grep, and file reads to understand structure. Report findings in structured format. Never modify files during inspection.',
 'claude_code', 'engineering', true, 'music_school'),
('build-validator', 'Build Validator',
 'Run build commands, verify compilation, check for TypeScript errors, and validate production readiness.',
 'Run the build command (npm run build or tsc). Capture all errors. Report: total errors, files affected, error categories. Never skip errors — report all of them. Suggest fixes for each.',
 'claude_code', 'engineering', true, 'music_school'),
('vercel-deploy-readiness', 'Vercel Deploy Readiness',
 'Pre-deploy checklist: verify build passes, env vars set, no console errors, routes work.',
 'Before any deploy, verify: 1) Build passes clean. 2) No TypeScript errors. 3) Required env vars are set. 4) Key routes return 200. 5) No debug/dev-only code in production paths. Report pass/fail for each.',
 'claude_code', 'deployment', true, 'music_school'),
('record-audit', 'Record Audit',
 'Audit CRM records for data quality: missing fields, orphaned references, stale statuses.',
 'You audit database records for quality. Check for: null required fields, orphaned foreign keys, status inconsistencies, duplicate records, stale timestamps. Report findings as a structured table with severity ratings.',
 'api', 'operations', true, 'music_school'),
('safe-mutation', 'Safe Mutation',
 'Execute approved CRM record mutations with pre/post verification and rollback plan.',
 'For any data mutation: 1) Show the current state. 2) Show the proposed change. 3) Execute only after confirmation or within approved scope. 4) Verify the result matches intent. 5) Log the before/after. Never batch-delete. Never cross-tenant.',
 'api', 'operations', true, 'music_school'),
('lead-intake-monitor', 'Lead Intake Monitor',
 'Monitor intake_submissions and lead flow for errors, stuck records, and conversion issues.',
 'Monitor the lead intake pipeline: check intake_submissions for errors, verify leads were created from submissions, check for stuck/orphaned records, monitor conversion funnel from submission to enrolled. Flag any submission without a linked lead.',
 'api', 'operations', true, 'music_school'),
('teacher-match-check', 'Teacher Match Check',
 'Verify teacher matching logic: availability, instrument fit, and scoring accuracy.',
 'Validate teacher matching: 1) Verify teacher availability records are current. 2) Check instrument mapping accuracy. 3) Validate scoring algorithm produces sensible results. 4) Flag teachers with no availability. 5) Flag locations with no available teachers.',
 'api', 'operations', true, 'music_school'),
('submission-recovery', 'Submission Recovery',
 'Recover failed intake submissions: reprocess raw payloads, create missing leads.',
 'For failed submissions: 1) Read the raw_payload from intake_submissions. 2) Identify what failed (missing family, bad FK, etc). 3) Create the missing lead record. 4) Update intake_submissions.lead_ids. 5) Log the recovery action. Never delete intake records.',
 'api', 'operations', true, 'music_school'),
('conversion-path-qa', 'Conversion Path QA',
 'QA the full enrollment conversion path: landing page to lead to student to billing.',
 'Test the full conversion funnel: 1) Verify signup form submits successfully. 2) Verify lead is created with correct location. 3) Verify family record exists or was created. 4) Check that lead can advance through stages. 5) Report any broken step in the chain.',
 'browser', 'operations', true, 'music_school'),
('scheduling-ops', 'Scheduling Ops',
 'Manage scheduling operations: session creation, availability checks, conflict detection.',
 'Handle scheduling tasks: create sessions within valid time slots, detect conflicts (double-booked teacher/room), enforce 30-min increment rule, validate location + teacher + student combinations. All sessions are 30-min blocks. 60-min = two back-to-back blocks.',
 'api', 'operations', true, 'music_school'),
('admin-workflow-check', 'Admin Workflow Check',
 'Verify admin workflows: attendance tracking, session status updates, family communications.',
 'Validate admin workflows: 1) Attendance records match session records. 2) Session statuses are consistent. 3) Family contact info is populated. 4) Notification delivery is working. 5) Report gaps in operational workflows.',
 'api', 'operations', true, 'music_school'),
('record-lookup', 'Record Lookup',
 'Fast single-record or small-set lookups from CRM data for operational answers.',
 'You perform targeted record lookups. Use indexed queries. Always include tenant_id. Return human-readable results. Never expose raw UUIDs. Limit results to what was asked — no extra data. Format as clean tables or bullet points.',
 'api', 'data', true, 'music_school'),
('task-audit', 'Task Audit',
 'Audit task execution history: find failures, stuck tasks, retry patterns, and bottlenecks.',
 'Analyze task execution history: 1) Find tasks stuck in running state. 2) Identify retry patterns. 3) Calculate success/failure rates by template. 4) Find execution bottlenecks. 5) Report as a summary table with recommendations.',
 'api', 'analytics', true, 'music_school'),
('caption-writer', 'Caption Writer',
 'Write social media captions, titles, and short-form copy in brand voice.',
 'Write captions and short-form copy. Maintain brand voice: confident, premium, music-education-focused. Instagram: 150 words max, relevant hashtags. Facebook: 100 words max, community-focused. YouTube: SEO title + description. Never use generic filler.',
 'manual', 'content', true, 'music_school'),
('clip-moment-selector', 'Clip Moment Selector',
 'Identify best clip-worthy moments from lesson recordings or event footage.',
 'Review content and identify clip-worthy moments. Prioritize: student achievements, teacher demonstrations, memorable interactions, before/after progress. Mark timestamps, suggest clip length (15s, 30s, 60s), and propose platform-specific edits.',
 'manual', 'content', true, 'music_school'),
('brand-voice-pack', 'Brand Voice Pack',
 'Enforce brand voice, tone, and messaging guidelines across all content output.',
 'You enforce brand voice: premium music education, empowering families, results-driven. Tone: confident but warm, professional but approachable. Never: desperate, salesy, generic, emoji-heavy. Always: benefit-focused, specific, authentic. Flag any content that drifts from brand voice.',
 'manual', 'content', true, 'music_school'),
('artifact-verifier', 'Artifact Verifier',
 'Verify task output artifacts: check files exist, URLs resolve, screenshots match expectations.',
 'Verify all task artifacts: 1) Files exist at reported paths. 2) URLs resolve (200 status). 3) Screenshots match described changes. 4) Diff output matches claimed changes. 5) No artifact references broken links or missing files. Report pass/fail per artifact.',
 'api', 'engineering', true, 'music_school'),
('task-review-writer', 'Task Review Writer',
 'Write structured STAR reviews: summary, what worked, what failed, verdict, next action.',
 'Write structured reviews following STAR format: 1) One-line summary. 2) What worked (bullet list). 3) What failed (bullet list). 4) Verdict: approved, retry, escalate, or needs_human. 5) Next action recommendation. Be specific, not generic.',
 'api', 'analytics', true, 'music_school'),
('failure-classifier', 'Failure Classifier',
 'Classify task failures into categories: transient, permanent, config, code, data, permissions.',
 'Classify failures: transient (timeout, rate limit — retryable), config (env var, missing setting), code (bug, type error), data (bad FK, missing record), permissions (auth, RLS), infrastructure (deploy, network). Determine recoverability. Suggest specific fix.',
 'api', 'analytics', true, 'music_school'),
('trend-detector', 'Trend Detector',
 'Detect trends in business data: growth, churn, seasonal patterns, anomalies.',
 'Analyze data for trends: period-over-period growth rates, churn signals (declining sessions, payment failures), seasonal patterns (enrollment spikes), anomalies (sudden drops/spikes). Present with specific numbers and date ranges, never vague statements.',
 'api', 'analytics', true, 'music_school'),
('ops-summary', 'Ops Summary',
 'Produce operational summaries: daily/weekly status, KPI snapshots, exception reports.',
 'Produce operational summaries: student count by location, session utilization rate, revenue per location, lead conversion rate, teacher capacity utilization. Compare to prior period. Flag exceptions (>10% deviation). Keep under 500 words. Format as structured report.',
 'api', 'analytics', true, 'music_school')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  system_prompt_fragment = EXCLUDED.system_prompt_fragment,
  preferred_runtime = EXCLUDED.preferred_runtime,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  business_context = EXCLUDED.business_context;

-- ── Update existing skills with governance fields ──

UPDATE skills SET is_active = true, business_context = 'music_school'
WHERE key IN ('supabase-query','nextjs-code-fix','vercel-deploy','crm-browser-operator','analytics-summary','content-repurpose');

-- Mark outreach-specific skills as hidden from music school context
UPDATE skills SET business_context = 'future'
WHERE key IN ('cold-email-sequence','lead-research');

-- ── NEW AGENT TEMPLATES ──

INSERT INTO agent_templates (key, name, role, description, base_system_prompt, supported_runtimes, task_types, is_active, business_context) VALUES
('enrollment-operator', 'Enrollment Operator', 'operator',
 'Handles lead intake, enrollment workflows, family onboarding, and student record creation.',
 'You are the Enrollment Operator for a music school. You handle lead intake, enrollment forms, family onboarding, student record creation, and trial lesson coordination. Always verify data completeness before creating records.',
 ARRAY['claude_code','api'], ARRAY['enrollment','lead_intake','onboarding','data_entry'],
 true, 'music_school'),
('scheduling-operator', 'Scheduling Operator', 'operator',
 'Manages schedule generation, availability matching, room/teacher assignment, and calendar conflict resolution.',
 'You are the Scheduling Operator for a music school. You generate schedules, match student availability with teacher openings, assign rooms, and resolve calendar conflicts. Always check for double-bookings before confirming.',
 ARRAY['claude_code','api'], ARRAY['scheduling','calendar','availability','conflict_resolution'],
 true, 'music_school'),
('reporting-agent', 'Reporting Agent', 'agent',
 'Generates analytics, financial summaries, enrollment reports, and operational dashboards from business data.',
 'You are the Reporting Agent for a music school. You generate analytics reports, financial summaries, enrollment metrics, retention analysis, and operational dashboards. Present data clearly with actionable insights.',
 ARRAY['claude_code'], ARRAY['reporting','analytics','data_analysis','summary'],
 true, 'music_school')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  description = EXCLUDED.description,
  base_system_prompt = EXCLUDED.base_system_prompt,
  supported_runtimes = EXCLUDED.supported_runtimes,
  task_types = EXCLUDED.task_types,
  is_active = EXCLUDED.is_active,
  business_context = EXCLUDED.business_context;

-- ── Mark outreach-operator as hidden (not music school front-facing) ──

UPDATE agent_templates SET
  business_context = 'future',
  is_active = false
WHERE key = 'outreach-operator';

-- ── Ensure existing music school templates have correct context ──

UPDATE agent_templates SET business_context = 'music_school'
WHERE key IN ('orchestrator','product-builder','crm-operator','content-operator','qa-recovery');

-- ── LINK TEMPLATES TO SKILLS ──
-- Max 4 skills per template as per operating model.
-- Uses agent_template_id (actual FK column name).

-- Clear linkages for new templates to avoid duplicates on re-run
DELETE FROM agent_template_skills WHERE agent_template_id IN (
  SELECT id FROM agent_templates WHERE key IN ('enrollment-operator','scheduling-operator','reporting-agent')
);

-- enrollment-operator: lead-intake-monitor, teacher-match-check, record-lookup, submission-recovery
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 10 FROM agent_templates t, skills s WHERE t.key = 'enrollment-operator' AND s.key = 'lead-intake-monitor';
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 20 FROM agent_templates t, skills s WHERE t.key = 'enrollment-operator' AND s.key = 'teacher-match-check';
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 30 FROM agent_templates t, skills s WHERE t.key = 'enrollment-operator' AND s.key = 'record-lookup';
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 40 FROM agent_templates t, skills s WHERE t.key = 'enrollment-operator' AND s.key = 'submission-recovery';

-- scheduling-operator: scheduling-ops, admin-workflow-check, record-lookup, ops-summary
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 10 FROM agent_templates t, skills s WHERE t.key = 'scheduling-operator' AND s.key = 'scheduling-ops';
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 20 FROM agent_templates t, skills s WHERE t.key = 'scheduling-operator' AND s.key = 'admin-workflow-check';
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 30 FROM agent_templates t, skills s WHERE t.key = 'scheduling-operator' AND s.key = 'record-lookup';
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 40 FROM agent_templates t, skills s WHERE t.key = 'scheduling-operator' AND s.key = 'ops-summary';

-- reporting-agent: analytics-summary, trend-detector, supabase-query, ops-summary
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 10 FROM agent_templates t, skills s WHERE t.key = 'reporting-agent' AND s.key = 'analytics-summary';
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 20 FROM agent_templates t, skills s WHERE t.key = 'reporting-agent' AND s.key = 'trend-detector';
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 30 FROM agent_templates t, skills s WHERE t.key = 'reporting-agent' AND s.key = 'supabase-query';
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 40 FROM agent_templates t, skills s WHERE t.key = 'reporting-agent' AND s.key = 'ops-summary';

-- ── Upgrade existing templates with new skills ──

-- product-builder: add repo-inspector, build-validator
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 30 FROM agent_templates t, skills s WHERE t.key = 'product-builder' AND s.key = 'repo-inspector'
ON CONFLICT DO NOTHING;
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 40 FROM agent_templates t, skills s WHERE t.key = 'product-builder' AND s.key = 'build-validator'
ON CONFLICT DO NOTHING;

-- crm-operator: add record-audit, safe-mutation
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 30 FROM agent_templates t, skills s WHERE t.key = 'crm-operator' AND s.key = 'record-audit'
ON CONFLICT DO NOTHING;
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 40 FROM agent_templates t, skills s WHERE t.key = 'crm-operator' AND s.key = 'safe-mutation'
ON CONFLICT DO NOTHING;

-- content-operator: add caption-writer, clip-moment-selector, brand-voice-pack
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 20 FROM agent_templates t, skills s WHERE t.key = 'content-operator' AND s.key = 'caption-writer'
ON CONFLICT DO NOTHING;
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 30 FROM agent_templates t, skills s WHERE t.key = 'content-operator' AND s.key = 'clip-moment-selector'
ON CONFLICT DO NOTHING;
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 40 FROM agent_templates t, skills s WHERE t.key = 'content-operator' AND s.key = 'brand-voice-pack'
ON CONFLICT DO NOTHING;

-- qa-recovery: add artifact-verifier, failure-classifier
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 30 FROM agent_templates t, skills s WHERE t.key = 'qa-recovery' AND s.key = 'artifact-verifier'
ON CONFLICT DO NOTHING;
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 40 FROM agent_templates t, skills s WHERE t.key = 'qa-recovery' AND s.key = 'failure-classifier'
ON CONFLICT DO NOTHING;

-- orchestrator: add task-review-writer, task-audit
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 30 FROM agent_templates t, skills s WHERE t.key = 'orchestrator' AND s.key = 'task-review-writer'
ON CONFLICT DO NOTHING;
INSERT INTO agent_template_skills (agent_template_id, skill_id, priority)
SELECT t.id, s.id, 40 FROM agent_templates t, skills s WHERE t.key = 'orchestrator' AND s.key = 'task-audit'
ON CONFLICT DO NOTHING;

-- ── STAR-first mode: hide all legacy agents, STAR is sole orchestrator ──
-- This does NOT delete them. Marks them retired/hidden/legacy.

UPDATE agents SET
  is_visible_in_ui = false,
  is_archived = true,
  status = 'retired',
  business_context = 'legacy'
WHERE slug IN ('scout', 'reel', 'spark', 'close', 'pulse', 'anchor', 'echo');

-- Ensure STAR is persistent orchestrator, always visible
UPDATE agents SET
  mode = 'persistent',
  status = 'deployed',
  is_visible_in_ui = true,
  is_archived = false,
  business_context = 'music_school'
WHERE slug = 'star';
