-- Pre/post deploy audit: paid renewals with cancelled enrollment + live access.
-- Run: psql "$SBM_AUDIT_DATABASE_URL" -v ON_ERROR_STOP=1 -f code/sbm-crm/docs/renewal-lifecycle-lapsed-audit.sql
--
-- Expected BEFORE deploy: wrongly_lapsed = total_bug_rows (Jul 2026 renewals ~58).
-- Expected AFTER 20260929130000: wrongly_lapsed = 0 (lifecycle only).
-- Expected AFTER 20260929140000 + backend cron fix: need_enrollment_reactivate = 0.
--
-- Root cause: lifecycle-sync CancelEnrollmentsPastAccessUntil matched ANY paid checkout
-- on the enrollment (expired initial trial), re-cancelling after 20260929130000 reactivated.

\echo '=== Summary ==='
WITH latest_paid AS (
    SELECT DISTINCT ON (e.user_id)
        e.user_id,
        e.status AS enrollment_status,
        e.phase AS enrollment_phase,
        cs.checkout_product,
        cs.renewal_category,
        cs.renewal_plan_key,
        cs.paid_at,
        cs.access_until,
        cs.grace_until,
        c.name AS cohort_name
    FROM enrollments e
    JOIN cohorts c ON c.id = e.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN checkout_sessions cs ON cs.enrollment_id = e.id AND cs.status = 'paid'
    WHERE p.slug = 'take-control'
    ORDER BY e.user_id, cs.paid_at DESC NULLS LAST, cs.created_at DESC
),
classified AS (
    SELECT
        lp.*,
        l.lifecycle_stage AS current_lifecycle_stage,
        CASE
            WHEN lp.enrollment_status = 'cancelled'
                 AND lp.access_until IS NOT NULL
                 AND lp.access_until > now()
            THEN true
            ELSE false
        END AS is_bug_row,
        CASE
            WHEN lp.enrollment_status = 'cancelled'
                 AND lp.access_until IS NOT NULL
                 AND lp.access_until > now()
                 AND l.lifecycle_stage = 'lapsed'
            THEN true
            ELSE false
        END AS wrongly_lapsed,
        CASE
            WHEN lp.enrollment_status = 'cancelled'
                 AND lp.access_until IS NOT NULL
                 AND lp.access_until > now()
            THEN true
            ELSE false
        END AS need_enrollment_reactivate
    FROM latest_paid lp
    LEFT JOIN leads l ON l.converted_user_id = lp.user_id
)
SELECT
    COUNT(*) FILTER (WHERE is_bug_row) AS total_bug_rows,
    COUNT(*) FILTER (WHERE wrongly_lapsed) AS wrongly_lapsed,
    COUNT(*) FILTER (WHERE need_enrollment_reactivate) AS need_enrollment_reactivate,
    COUNT(*) FILTER (WHERE is_bug_row AND checkout_product = 'renewal') AS renewal_checkouts,
    COUNT(DISTINCT cohort_name) FILTER (WHERE is_bug_row) AS cohorts_affected
FROM classified;

\echo ''
\echo '=== Full member list (export) ==='
WITH latest_paid AS (
    SELECT DISTINCT ON (e.user_id)
        e.user_id,
        e.status AS enrollment_status,
        e.phase AS enrollment_phase,
        cs.checkout_product,
        cs.renewal_category,
        cs.renewal_plan_key,
        cs.paid_at,
        cs.access_until,
        cs.grace_until,
        c.name AS cohort_name
    FROM enrollments e
    JOIN cohorts c ON c.id = e.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN checkout_sessions cs ON cs.enrollment_id = e.id AND cs.status = 'paid'
    WHERE p.slug = 'take-control'
    ORDER BY e.user_id, cs.paid_at DESC NULLS LAST, cs.created_at DESC
)
SELECT
    u.email,
    lp.cohort_name,
    lp.enrollment_status,
    lp.enrollment_phase,
    lp.checkout_product,
    lp.renewal_category,
    lp.renewal_plan_key,
    lp.paid_at::date AS renewal_paid_on,
    lp.access_until::date AS access_until,
    lp.grace_until::date AS grace_until,
    l.lifecycle_stage AS current_stage,
    CASE
        WHEN lp.enrollment_phase = 'monthly' THEN 'member'
        ELSE 'newbie'
    END AS expected_stage_after_fix
FROM latest_paid lp
JOIN audit_auth_users u ON u.id = lp.user_id
LEFT JOIN leads l ON l.converted_user_id = lp.user_id
WHERE lp.enrollment_status = 'cancelled'
  AND lp.access_until IS NOT NULL
  AND lp.access_until > now()
ORDER BY lp.cohort_name, u.email;

\echo ''
\echo '=== Safety: truly lapsed should stay lapsed ==='
WITH latest_paid AS (
    SELECT DISTINCT ON (e.user_id)
        e.user_id,
        cs.access_until,
        cs.grace_until
    FROM enrollments e
    JOIN checkout_sessions cs ON cs.enrollment_id = e.id AND cs.status = 'paid'
    ORDER BY e.user_id, cs.paid_at DESC NULLS LAST, cs.created_at DESC
)
SELECT COUNT(*) AS should_stay_lapsed
FROM latest_paid lp
JOIN leads l ON l.converted_user_id = lp.user_id
WHERE lp.access_until IS NOT NULL
  AND lp.access_until <= now()
  AND lp.grace_until IS NOT NULL
  AND lp.grace_until <= now()
  AND l.lifecycle_stage = 'lapsed';

\echo ''
\echo '=== Spot check: moon.mishra@gmail.com ==='
SELECT
    u.email,
    l.lifecycle_stage,
    e.status AS enrollment_status,
    cs.checkout_product,
    cs.renewal_category,
    cs.access_until::date,
    public.resolve_lead_stage_for_member(u.id) AS resolved_stage
FROM audit_auth_users u
JOIN leads l ON l.converted_user_id = u.id
JOIN enrollments e ON e.user_id = u.id
JOIN checkout_sessions cs ON cs.enrollment_id = e.id AND cs.status = 'paid'
WHERE lower(u.email) = 'moon.mishra@gmail.com'
ORDER BY cs.paid_at DESC
LIMIT 1;
