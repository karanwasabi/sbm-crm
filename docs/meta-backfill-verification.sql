-- Meta backfill verification (read-only)
-- Run BEFORE and AFTER backfill-meta-leads --apply
--
--   set -a && source ~/.config/sbm/audit.env && set +a
--   psql "$SBM_AUDIT_DATABASE_URL" -v ON_ERROR_STOP=1 -f code/sbm-crm/docs/meta-backfill-verification.sql

\echo '=== Snapshot timestamp ==='
SELECT now() AT TIME ZONE 'UTC' AS snapshot_utc;

\echo '=== Meta leads by integration (90d) ==='
SELECT
  COALESCE(la.integration, '(null)') AS integration,
  COUNT(*) AS leads,
  COUNT(*) FILTER (WHERE l.lifecycle_stage IN ('newbie', 'member', 'grace')) AS paid,
  COUNT(*) FILTER (WHERE la.meta_campaign_id IS NOT NULL AND la.meta_campaign_id <> '') AS has_campaign_id,
  COUNT(*) FILTER (WHERE la.external_id ~ '^[0-9]+$') AS external_id_is_leadgen_numeric
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE la.source = 'meta'
  AND l.created_at >= now() - interval '90 days'
GROUP BY 1
ORDER BY leads DESC;

\echo '=== native_meta external identities (90d leads) ==='
SELECT
  COUNT(DISTINCT l.id) AS leads_with_native_meta_attribution,
  COUNT(DISTINCT lei.lead_id) AS leads_with_native_meta_identity
FROM leads l
JOIN lead_attribution la ON la.lead_id = l.id AND la.source = 'meta'
LEFT JOIN lead_external_identities lei
  ON lei.lead_id = l.id AND lei.integration = 'native_meta'
WHERE l.created_at >= now() - interval '90 days';

\echo '=== Campaign performance join coverage (90d meta leads) ==='
SELECT
  COUNT(*) AS meta_leads,
  COUNT(*) FILTER (WHERE la.meta_campaign_id IS NOT NULL AND la.meta_campaign_id <> '') AS joinable_to_spend,
  COUNT(*) FILTER (WHERE la.meta_campaign_id IS NULL OR la.meta_campaign_id = '') AS unattributed_campaign
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE la.source = 'meta'
  AND l.created_at >= now() - interval '90 days';

\echo '=== Distinct meta_campaign_id on meta leads (90d) ==='
SELECT COUNT(DISTINCT la.meta_campaign_id) AS distinct_campaign_ids
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE la.source = 'meta'
  AND l.created_at >= now() - interval '90 days'
  AND la.meta_campaign_id IS NOT NULL AND la.meta_campaign_id <> '';

\echo '=== integration_sync_events native_meta (last 30d) ==='
SELECT event_type, status, COUNT(*) AS events
FROM integration_sync_events
WHERE integration = 'native_meta'
  AND occurred_at >= now() - interval '30 days'
GROUP BY 1, 2
ORDER BY events DESC;

\echo '=== Leads created per day (native_meta, last 14d) ==='
SELECT (l.created_at AT TIME ZONE 'UTC')::date AS day_utc, COUNT(*) AS leads
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE la.source = 'meta'
  AND la.integration = 'native_meta'
  AND l.created_at >= now() - interval '14 days'
GROUP BY 1
ORDER BY 1 DESC;

\echo '=== SAFETY: duplicate leadgen external_id across leads (should be 0) ==='
SELECT external_id, COUNT(*) AS lead_rows
FROM lead_external_identities
WHERE integration = 'native_meta'
GROUP BY 1
HAVING COUNT(*) > 1
LIMIT 10;

\echo '=== SAFETY: meta leads with same email, different lead ids (sample) ==='
SELECT lower(trim(l.email)) AS email, COUNT(DISTINCT l.id) AS lead_ids
FROM leads l
JOIN lead_attribution la ON la.lead_id = l.id
WHERE la.source = 'meta'
  AND l.email IS NOT NULL AND trim(l.email) <> ''
  AND l.created_at >= now() - interval '90 days'
GROUP BY 1
HAVING COUNT(DISTINCT l.id) > 1
ORDER BY lead_ids DESC
LIMIT 10;
