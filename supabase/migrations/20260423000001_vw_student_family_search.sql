-- ============================================================
-- ZiroWork: vw_student_family_search
-- Migration: 20260423000001
-- Purpose: Flattened view for unified student + family search
-- Allows searching by student name OR family name OR email OR phone
-- in a single ILIKE query from the frontend.
-- ============================================================

CREATE OR REPLACE VIEW public.vw_student_family_search AS
SELECT
    -- Student identity
    s.id                                        AS student_id,
    s.first_name                                AS student_first_name,
    s.last_name                                 AS student_last_name,
    s.status                                    AS student_status,
    s.instrument                                AS student_instrument,
    s.teacher_id                                AS student_teacher_id,
    s.location_id                               AS student_location_id,
    s.tenant_id                                 AS tenant_id,

    -- Family identity
    f.id                                        AS family_id,
    f.name                                      AS family_name,
    f.primary_email                             AS family_primary_email,
    f.primary_phone                             AS family_primary_phone,
    f.status                                    AS family_status,
    f.billing_status                            AS family_billing_status,

    -- Unified search string
    -- Includes: student first + last name, family name, family email, family phone
    -- COALESCE ensures null email/phone does not break the concatenation
    -- Lowercased for case-insensitive frontend filtering
    lower(
        trim(s.first_name)
        || ' ' || trim(s.last_name)
        || ' ' || trim(f.name)
        || ' ' || coalesce(f.primary_email, '')
        || ' ' || coalesce(f.primary_phone, '')
    )                                           AS search_terms

FROM
    public.students s
    INNER JOIN public.families f ON f.id = s.family_id

WHERE
    s.family_id IS NOT NULL;

-- ============================================================
-- Access grants
-- ============================================================
GRANT SELECT ON public.vw_student_family_search TO service_role;
GRANT SELECT ON public.vw_student_family_search TO authenticated;

-- ============================================================
-- Verify:
-- SELECT student_first_name, student_last_name, family_name, search_terms
-- FROM vw_student_family_search
-- WHERE search_terms ILIKE '%alex%'
-- AND tenant_id = '00000000-0000-0000-0000-000000000001'
-- LIMIT 10;
-- ============================================================
