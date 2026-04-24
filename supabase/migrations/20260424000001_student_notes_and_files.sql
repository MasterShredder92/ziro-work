-- ============================================================
-- Migration: student_notes table + student_files storage fields
-- Date: 2026-04-24
-- ============================================================

-- 1. Create student_notes table
CREATE TABLE IF NOT EXISTS public.student_notes (
  id          uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id   uuid NOT NULL,
  student_id  uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name text,
  author_role text DEFAULT 'teacher',
  body        text NOT NULL,
  created_at  timestamp with time zone DEFAULT now() NOT NULL,
  updated_at  timestamp with time zone DEFAULT now() NOT NULL
);

-- Index for fast student lookups (also enables family-level filtered feed)
CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON public.student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_tenant_id  ON public.student_notes(tenant_id);

-- 2. Ensure student_files has a storage_path column for signed URL resolution
ALTER TABLE public.student_files
  ADD COLUMN IF NOT EXISTS storage_path text;

-- 3. Ensure students table has all profile fields
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS first_name      text,
  ADD COLUMN IF NOT EXISTS last_name       text,
  ADD COLUMN IF NOT EXISTS instrument      text,
  ADD COLUMN IF NOT EXISTS bio             text,
  ADD COLUMN IF NOT EXISTS goals           text,
  ADD COLUMN IF NOT EXISTS learning_style  text,
  ADD COLUMN IF NOT EXISTS lesson_day_of_week text;

-- 4. RLS — allow authenticated users to read/write their tenant's notes
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "tenant_isolation_student_notes"
  ON public.student_notes
  USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 5. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_notes TO service_role;
