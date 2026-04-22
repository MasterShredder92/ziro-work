-- ============================================================
-- ZiroWork: Automation + AI Table Cleanup
-- Run in Supabase SQL Editor
-- All automation, AI chat, job queue, and webhook tables
-- ============================================================

-- AI / Chat tables
DROP TABLE IF EXISTS ai_action_logs CASCADE;
DROP TABLE IF EXISTS ai_feedback CASCADE;
DROP TABLE IF EXISTS ai_legacy_message_log CASCADE;
DROP TABLE IF EXISTS ai_workflows CASCADE;
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS agent_conversations CASCADE;

-- Job queue / task execution tables
DROP TABLE IF EXISTS dead_letter_jobs CASCADE;
DROP TABLE IF EXISTS job_runs CASCADE;
DROP TABLE IF EXISTS task_runs CASCADE;
DROP TABLE IF EXISTS task_artifacts CASCADE;
DROP TABLE IF EXISTS task_failures CASCADE;
DROP TABLE IF EXISTS task_threads CASCADE;
DROP TABLE IF EXISTS task_messages CASCADE;

-- Webhook tables
DROP TABLE IF EXISTS webhook_events CASCADE;

-- Idempotency keys (automation runtime)
DROP TABLE IF EXISTS ziro_idempotency_keys CASCADE;

-- ============================================================
-- Verify: run SELECT tablename FROM pg_tables WHERE schemaname = 'public'
-- None of the above should appear in results
-- ============================================================
