-- =============================================================================
-- DROP DEAD COLUMNS — Phase 1 structural cleanup
-- 2026-05-19
-- Audit findings:
--   schedule_blocks.room: legacy text field superseded by room_id (UUID FK).
--     Nullable, no constraints, no FK references — safe to drop.
--   teachers.is_sub_available: duplicate of sub_available (bool NOT NULL DEFAULT false).
--     No FK references — safe to drop.
--
-- NOTE: students dead columns (email, phone, card_last_four, card_brand,
--   square_customer_id) were already dropped by migration
--   20260423000002_drop_student_dead_columns.sql and do NOT exist in the live DB.
-- =============================================================================

-- schedule_blocks: drop legacy text room column (room_id UUID FK is canonical)
ALTER TABLE public.schedule_blocks DROP COLUMN IF EXISTS room;

-- teachers: drop duplicate sub availability flag
ALTER TABLE public.teachers DROP COLUMN IF EXISTS is_sub_available;
