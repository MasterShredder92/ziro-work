-- =================================================================
-- Phase 3: Write Optimization — Triggers & RPC Functions
-- Migration: 20260519130000_write_optimization_triggers_rpcs.sql
--
-- VERIFICATION REQUIRED before applying to live:
--   1. Run each function body in Supabase SQL editor first.
--   2. Confirm students.start_date and first_lesson_date column types
--      (if date, remove ::text casts in enroll_student).
--   3. Confirm activity_log.details column type
--      (if jsonb, remove ::text cast from jsonb_build_object calls).
--   4. Confirm recurring_lessons unique constraint exists on
--      (student_id, teacher_id, location_id, day_of_week, start_time).
-- =================================================================


-- ── 1. STUDENT STAGE TRANSITION ENFORCEMENT ──────────────────────
-- Fires BEFORE UPDATE ON students.
-- Blocks enrolled/active students from regressing directly to lead
-- without deactivating first. All other transitions are permitted.
-- Stages outside the known vocabulary pass through unblocked
-- (preserves legacy/custom status values).

CREATE OR REPLACE FUNCTION enforce_student_stage_transitions()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_old text := OLD.status;
  v_new text := NEW.status;
BEGIN
  IF v_old IS NOT DISTINCT FROM v_new THEN
    RETURN NEW;
  END IF;

  IF v_old NOT IN ('lead', 'trial', 'prospect', 'enrolled', 'active', 'inactive') THEN
    RETURN NEW;
  END IF;

  IF v_old IN ('enrolled', 'active') AND v_new = 'lead' THEN
    RAISE EXCEPTION
      'student_stage_invalid: Cannot transition student from ''%'' to ''lead''. '
      'Set status to ''inactive'' first, then re-qualify as ''lead'' or ''prospect''.',
      v_old
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_student_stage_transitions ON students;
CREATE TRIGGER trg_enforce_student_stage_transitions
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION enforce_student_stage_transitions();


-- ── 2. SESSION LOG ↔ SCHEDULE BLOCK VALIDATION ───────────────────
-- Fires BEFORE INSERT OR UPDATE ON session_log.
-- Guarantees the referenced schedule_block belongs to the same
-- tenant and that student_id values agree.
-- Rows with NULL schedule_block_id (manual entries) are allowed through.

CREATE OR REPLACE FUNCTION validate_session_log_matches_block()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_block RECORD;
BEGIN
  IF NEW.schedule_block_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT tenant_id, student_id, teacher_id, status
  INTO v_block
  FROM schedule_blocks
  WHERE id = NEW.schedule_block_id
    AND tenant_id = NEW.tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'session_log_invalid_block: schedule_block ''%'' does not exist for this tenant.',
      NEW.schedule_block_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF NEW.student_id IS NOT NULL
     AND v_block.student_id IS NOT NULL
     AND NEW.student_id <> v_block.student_id THEN
    RAISE EXCEPTION
      'session_log_student_mismatch: session_log.student_id (''%'') does not match '
      'schedule_block.student_id (''%'') for block ''%''.',
      NEW.student_id, v_block.student_id, NEW.schedule_block_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_session_log_matches_block ON session_log;
CREATE TRIGGER trg_validate_session_log_matches_block
  BEFORE INSERT OR UPDATE ON session_log
  FOR EACH ROW
  EXECUTE FUNCTION validate_session_log_matches_block();


-- ── 3. SCHEDULE BLOCK COMPLETION AUTOMATION ──────────────────────
-- Fires AFTER UPDATE ON schedule_blocks when status → 'completed'.
-- Creates a session_log record if one does not exist, then appends
-- an activity_log audit entry. Both inserts are non-fatal so that
-- completion cannot be blocked by logging failures.

CREATE OR REPLACE FUNCTION handle_session_completion()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_existing_log_id uuid;
BEGIN
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_existing_log_id
  FROM session_log
  WHERE schedule_block_id = NEW.id
    AND tenant_id = NEW.tenant_id
  LIMIT 1;

  IF v_existing_log_id IS NULL THEN
    BEGIN
      INSERT INTO session_log (
        tenant_id, student_id, teacher_id, location_id,
        schedule_block_id, block_date, status
      ) VALUES (
        NEW.tenant_id,
        NEW.student_id,
        NEW.teacher_id,
        NEW.location_id,
        NEW.id,
        NEW.block_date,
        'completed'
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING
        'handle_session_completion: session_log insert failed for block %: %',
        NEW.id, SQLERRM;
    END;
  END IF;

  BEGIN
    INSERT INTO activity_log (
      tenant_id, entity_type, entity_id, entity_name, action, details, location_id
    ) VALUES (
      NEW.tenant_id,
      'schedule_block',
      NEW.id::text,
      NULL,
      'session_completed',
      jsonb_build_object(
        'student_id',    NEW.student_id,
        'teacher_id',    NEW.teacher_id,
        'block_date',    NEW.block_date,
        'completed_at',  now()
      )::text,
      NEW.location_id
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING
      'handle_session_completion: activity_log insert failed for block %: %',
      NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_session_completion ON schedule_blocks;
CREATE TRIGGER trg_handle_session_completion
  AFTER UPDATE ON schedule_blocks
  FOR EACH ROW
  EXECUTE FUNCTION handle_session_completion();


-- ── 4. RPC: book_session ─────────────────────────────────────────
-- Atomic single-transaction session booking.
-- Handles recurring rule upsert, schedule_block create-or-update,
-- and activity logging in one DB call.
-- Replaces multi-step logic in /api/schedule-blocks/book-session.

CREATE OR REPLACE FUNCTION book_session(
  p_tenant_id        uuid,
  p_teacher_id       uuid,
  p_location_id      uuid,
  p_student_id       uuid,
  p_block_date       date,
  p_start_time       time,
  p_end_time         time,
  p_is_recurring     boolean DEFAULT false,
  p_is_first_lesson  boolean DEFAULT false,
  p_block_id         uuid    DEFAULT NULL,
  p_room_id          uuid    DEFAULT NULL
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  v_block_type   text;
  v_result_block jsonb;
  v_instrument   text;
  v_day_of_week  int;
  v_block_id     uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM students WHERE id = p_student_id AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION
      'book_session_invalid_student: Student ''%'' not found for this tenant.',
      p_student_id
      USING ERRCODE = 'no_data_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM teachers WHERE id = p_teacher_id AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION
      'book_session_invalid_teacher: Teacher ''%'' not found for this tenant.',
      p_teacher_id
      USING ERRCODE = 'no_data_found';
  END IF;

  v_block_type := CASE WHEN p_is_first_lesson THEN 'first_day' ELSE 'student_session' END;

  IF p_is_recurring THEN
    v_day_of_week := EXTRACT(DOW FROM p_block_date)::int;

    SELECT instrument INTO v_instrument
    FROM students
    WHERE id = p_student_id AND tenant_id = p_tenant_id;

    INSERT INTO recurring_lessons (
      tenant_id, student_id, teacher_id, location_id,
      day_of_week, start_time, end_time, instrument,
      is_active, effective_from, effective_until, updated_at
    ) VALUES (
      p_tenant_id, p_student_id, p_teacher_id, p_location_id,
      v_day_of_week, p_start_time, p_end_time, v_instrument,
      true, p_block_date, NULL, now()
    )
    ON CONFLICT (tenant_id, student_id, teacher_id, location_id, day_of_week, start_time)
    DO UPDATE SET
      is_active      = true,
      effective_from = EXCLUDED.effective_from,
      updated_at     = now();
  END IF;

  IF p_block_id IS NOT NULL THEN
    UPDATE schedule_blocks SET
      student_id   = p_student_id,
      block_type   = v_block_type,
      status       = 'booked',
      is_recurring = p_is_recurring,
      updated_at   = now()
    WHERE id = p_block_id AND tenant_id = p_tenant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'book_session_block_not_found: schedule_block ''%'' not found for this tenant.',
        p_block_id
        USING ERRCODE = 'no_data_found';
    END IF;

    v_block_id := p_block_id;
  ELSE
    INSERT INTO schedule_blocks (
      tenant_id, teacher_id, location_id, room_id, student_id,
      block_date, start_time, end_time, block_type, status,
      is_recurring, generated_from_availability
    ) VALUES (
      p_tenant_id, p_teacher_id, p_location_id, p_room_id, p_student_id,
      p_block_date, p_start_time, p_end_time, v_block_type, 'booked',
      p_is_recurring, false
    )
    RETURNING id INTO v_block_id;
  END IF;

  SELECT to_jsonb(sb) INTO v_result_block
  FROM schedule_blocks sb
  WHERE sb.id = v_block_id AND sb.tenant_id = p_tenant_id;

  BEGIN
    INSERT INTO activity_log (
      tenant_id, entity_type, entity_id, entity_name, action, details, location_id
    ) VALUES (
      p_tenant_id, 'student', p_student_id::text, NULL, 'session_booked',
      jsonb_build_object(
        'schedule_block_id', v_block_id,
        'block_date',        p_block_date,
        'start_time',        p_start_time,
        'end_time',          p_end_time,
        'teacher_id',        p_teacher_id,
        'location_id',       p_location_id,
        'is_recurring',      p_is_recurring,
        'block_type',        v_block_type
      )::text,
      p_location_id
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'book_session: activity_log insert failed: %', SQLERRM;
  END;

  RETURN v_result_block;
END;
$$;


-- ── 5. RPC: enroll_student ───────────────────────────────────────
-- Atomic enrollment: validates student + teacher, creates the
-- enrollment row, and updates the student record — all in one
-- transaction. Replaces the two-step enrollStudent() TS function.

CREATE OR REPLACE FUNCTION enroll_student(
  p_tenant_id         uuid,
  p_student_id        uuid,
  p_teacher_id        uuid,
  p_start_date        date DEFAULT NULL,
  p_enrollment_status text DEFAULT 'active'
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  v_student    RECORD;
  v_enrollment RECORD;
  v_start_date date := COALESCE(p_start_date, CURRENT_DATE);
BEGIN
  SELECT * INTO v_student
  FROM students
  WHERE id = p_student_id AND tenant_id = p_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'enroll_student_not_found: Student ''%'' not found for this tenant.',
      p_student_id
      USING ERRCODE = 'no_data_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM teachers WHERE id = p_teacher_id AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION
      'enroll_student_invalid_teacher: Teacher ''%'' not found for this tenant.',
      p_teacher_id
      USING ERRCODE = 'no_data_found';
  END IF;

  INSERT INTO enrollments (
    tenant_id, student_id, teacher_id, start_date, status
  ) VALUES (
    p_tenant_id, p_student_id, p_teacher_id, v_start_date, p_enrollment_status
  )
  RETURNING * INTO v_enrollment;

  UPDATE students SET
    teacher_id        = p_teacher_id,
    status            = 'active',
    start_date        = v_start_date,
    first_lesson_date = COALESCE(v_student.first_lesson_date, v_start_date),
    updated_at        = now()
  WHERE id = p_student_id AND tenant_id = p_tenant_id;

  RETURN jsonb_build_object(
    'enrollment', to_jsonb(v_enrollment),
    'student_id', p_student_id,
    'teacher_id', p_teacher_id,
    'status',     p_enrollment_status,
    'start_date', v_start_date
  );
END;
$$;
