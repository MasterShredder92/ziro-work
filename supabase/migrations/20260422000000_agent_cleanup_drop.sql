-- ==============================================================================
-- ZiroWork Agent Disintegration — Schema Cleanup
-- ==============================================================================
-- This script removes all agentic system tables, queues, and logs.
-- WARNING: This uses CASCADE to drop dependent foreign keys and policies.
--
-- Confirmed Agent Tables: 31
-- Confirmed CRM-Safe Tables: 105
-- ==============================================================================

BEGIN;

-- 1. Drop Agent Config & Definition Tables
DROP TABLE IF EXISTS public.agents CASCADE;
DROP TABLE IF EXISTS public.ziro_agents CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.ziro_skills CASCADE;
DROP TABLE IF EXISTS public.agent_skills CASCADE;
DROP TABLE IF EXISTS public.ziro_agent_skills CASCADE;
DROP TABLE IF EXISTS public.agent_templates CASCADE;
DROP TABLE IF EXISTS public.agent_template_skills CASCADE;
DROP TABLE IF EXISTS public.ziro_config CASCADE;
DROP TABLE IF EXISTS public.ziro_page_intelligence_bindings CASCADE;

-- 2. Drop Agent Execution & Task Queues
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.job_runs CASCADE;
DROP TABLE IF EXISTS public.dead_letter_jobs CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.task_runs CASCADE;
DROP TABLE IF EXISTS public.agent_tasks CASCADE;
DROP TABLE IF EXISTS public.ziro_idempotency_keys CASCADE;

-- 3. Drop Agent Communication & Threads
DROP TABLE IF EXISTS public.ai_conversations CASCADE;
DROP TABLE IF EXISTS public.agent_conversations CASCADE;
DROP TABLE IF EXISTS public.ai_messages CASCADE;
DROP TABLE IF EXISTS public.ai_legacy_message_log CASCADE;
DROP TABLE IF EXISTS public.task_threads CASCADE;
DROP TABLE IF EXISTS public.task_messages CASCADE;

-- 4. Drop Agent Logs & Artifacts
DROP TABLE IF EXISTS public.ai_action_logs CASCADE;
DROP TABLE IF EXISTS public.task_artifacts CASCADE;
DROP TABLE IF EXISTS public.task_failures CASCADE;
DROP TABLE IF EXISTS public.ai_feedback CASCADE;
DROP TABLE IF EXISTS public.ai_workflows CASCADE;

-- 5. Drop Legacy / Other Agent Objects
DROP TABLE IF EXISTS public.agenteventsubscriptions CASCADE;
DROP TABLE IF EXISTS public.agentpermissionprofiles CASCADE;
DROP TABLE IF EXISTS public.agenttoolassignments CASCADE;
DROP TABLE IF EXISTS public.zirorbs CASCADE;

-- Note: The following tables were flagged by keywords but are actually CRM core:
--   - enrollments (student records)
--   - audit_log (compliance trail)
--   - session_log (lesson sessions)
--   - star_config (star rating / rewards config)
--   - star_reviews (student reviews)
-- They have been preserved.

COMMIT;
