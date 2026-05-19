# Failure Index

| Date | Domain | Method That Failed | Why It Failed | Use Instead |
|---|---|---|---|---|
| 2026-05-19 | DB Migration | Writing PL/pgSQL with assumed column types (text vs date for students.start_date, first_lesson_date) | Column types not confirmed before writing SQL — caused type assignment errors in enroll_student RPC | Run `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='students'` before writing UPDATE statements with type casts |
| 2026-05-19 | DB Migration | Using jsonb_build_object()::text for activity_log.details without confirming column type | Column may be jsonb (no cast needed) or text (::text required) — must verify first | Query `information_schema.columns WHERE table_name='activity_log' AND column_name='details'` before writing INSERT |
| 2026-05-19 | DB Migration | ON CONFLICT clause missing tenant_id for recurring_lessons | Assumed unique constraint was on (student_id, teacher_id, location_id, day_of_week, start_time); actual index includes tenant_id prefix | Always query `pg_indexes WHERE tablename=<table>` before writing ON CONFLICT — do not assume which columns are in the unique constraint |
