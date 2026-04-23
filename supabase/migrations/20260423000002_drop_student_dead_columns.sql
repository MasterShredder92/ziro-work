-- ============================================================
-- Migration: Drop dead administrative columns from students
-- Date: 2026-04-23
-- Reason: Parent-Child architecture refactor.
--   Contact data (email, phone) lives exclusively on families.
--   Billing data (square_customer_id, card_brand, card_last_four)
--   lives exclusively on families.
--   is_military is a family-level attribute, not student-level.
--   All 5 columns confirmed 100% null across all 683 linked students
--   (verified in Step 2 and Step 3 of the architecture audit).
-- ============================================================

ALTER TABLE public.students
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS square_customer_id,
  DROP COLUMN IF EXISTS card_brand,
  DROP COLUMN IF EXISTS card_last_four,
  DROP COLUMN IF EXISTS is_military;
