-- Meta ad & CAC audit queries (aggregate-only, no PII)
-- Run: set -a && source ~/.config/sbm/audit.env && set +a
--      psql "$SBM_AUDIT_DATABASE_URL" -v ON_ERROR_STOP=1 -f code/sbm-crm/docs/meta-cac-audit-queries.sql
--
-- Default window: last 90 days (matches CRM dashboard default)

\set audit_days 90

-- === Phase 1: Pipeline health ===

\echo '--- integration_sync_events: ad_spend_sync (last 10) ---'
SELECT occurred_at, status, context->>'campaign_days' AS campaign_days,
       (context->>'spend_minor')::bigint / 100.0 AS spend_inr
FROM integration_sync_events
WHERE integration = 'native_meta' AND event_type = 'ad_spend_sync'
ORDER BY occurred_at DESC
LIMIT 10;

\echo '--- integration_sync_events: native_meta webhook (last 30 days summary) ---'
SELECT event_type, status, COUNT(*) AS n
FROM integration_sync_events
WHERE integration = 'native_meta'
  AND occurred_at >= now() - interval '30 days'
GROUP BY event_type, status
ORDER BY event_type, status;

\echo '--- meta_ad_spend freshness ---'
SELECT MIN(spend_date) AS min_date, MAX(spend_date) AS max_date,
       COUNT(*) AS row_count,
       COUNT(DISTINCT campaign_id) AS campaigns,
       SUM(spend_minor) / 100.0 AS total_spend_inr,
       MAX(currency) AS currency,
       MAX(updated_at) AS last_updated
FROM meta_ad_spend;

\echo '--- meta_ad_spend in audit window ---'
SELECT COUNT(*) AS row_count,
       COUNT(DISTINCT campaign_id) AS campaigns,
       SUM(spend_minor) / 100.0 AS spend_inr
FROM meta_ad_spend
WHERE spend_date >= (current_date - :'audit_days'::int)
  AND spend_date <= current_date;

-- === Phase 2: Spend by campaign (audit window) ===

\echo '--- spend by campaign (audit window) ---'
SELECT campaign_id,
       COALESCE(MAX(campaign_name), '') AS campaign_name,
       SUM(spend_minor) / 100.0 AS spend_inr,
       SUM(impressions) AS impressions,
       SUM(clicks) AS clicks
FROM meta_ad_spend
WHERE spend_date >= (current_date - :'audit_days'::int)
  AND spend_date <= current_date
GROUP BY campaign_id
ORDER BY spend_inr DESC;

-- === Phase 3: Lead counts ===

\echo '--- meta leads total (audit window, CRM definition) ---'
SELECT COUNT(*) AS meta_leads
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE la.source = 'meta'
  AND l.created_at >= now() - (:audit_days || ' days')::interval
  AND l.created_at < now();

\echo '--- meta leads by integration ---'
SELECT COALESCE(la.integration, '(null)') AS integration, COUNT(*) AS leads,
       COUNT(*) FILTER (WHERE l.lifecycle_stage IN ('newbie','member','grace')) AS paid
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE la.source = 'meta'
  AND l.created_at >= now() - (:audit_days || ' days')::interval
  AND l.created_at < now()
GROUP BY la.integration
ORDER BY leads DESC;

\echo '--- meta leads missing campaign_id ---'
SELECT COUNT(*) AS missing_campaign_id
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE la.source = 'meta'
  AND l.created_at >= now() - (:audit_days || ' days')::interval
  AND l.created_at < now()
  AND (la.meta_campaign_id IS NULL OR la.meta_campaign_id = '');

\echo '--- meta UTM leads NOT source=meta ---'
SELECT la.source, COUNT(*) AS leads
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE l.created_at >= now() - (:audit_days || ' days')::interval
  AND l.created_at < now()
  AND la.source != 'meta'
  AND (
    la.utm_source ILIKE '%meta%' OR la.utm_source ILIKE '%facebook%'
    OR la.utm_medium = 'paid'
  )
GROUP BY la.source
ORDER BY leads DESC;

\echo '--- leads with NO attribution row ---'
SELECT COUNT(*) AS unattributed_leads
FROM leads l
LEFT JOIN lead_attribution la ON la.lead_id = l.id
WHERE la.lead_id IS NULL
  AND l.created_at >= now() - (:audit_days || ' days')::interval
  AND l.created_at < now();

\echo '--- meta leads by campaign (audit window) ---'
SELECT la.meta_campaign_id,
       COALESCE(MAX(la.utm_campaign), '') AS utm_campaign,
       COUNT(*) AS leads,
       COUNT(*) FILTER (WHERE l.lifecycle_stage IN ('newbie','member','grace')) AS paid
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE la.source = 'meta'
  AND la.meta_campaign_id IS NOT NULL AND la.meta_campaign_id <> ''
  AND l.created_at >= now() - (:audit_days || ' days')::interval
  AND l.created_at < now()
GROUP BY la.meta_campaign_id
ORDER BY leads DESC;

-- === Phase 4: CPL / CAC ===

\echo '--- source performance rollup (meta) ---'
WITH spend AS (
  SELECT COALESCE(SUM(spend_minor), 0) AS spend_minor
  FROM meta_ad_spend
  WHERE spend_date >= (current_date - :'audit_days'::int)
    AND spend_date <= current_date
),
meta_leads AS (
  SELECT COUNT(*) AS leads,
         COUNT(*) FILTER (WHERE l.lifecycle_stage IN ('newbie','member','grace')) AS paid
  FROM lead_attribution la
  JOIN leads l ON l.id = la.lead_id
  WHERE la.source = 'meta'
    AND l.created_at >= now() - (:audit_days || ' days')::interval
    AND l.created_at < now()
)
SELECT spend.spend_minor / 100.0 AS spend_inr,
       meta_leads.leads,
       meta_leads.paid,
       CASE WHEN meta_leads.leads > 0
            THEN (spend.spend_minor / 100.0) / meta_leads.leads END AS cpl_inr,
       CASE WHEN meta_leads.paid > 0
            THEN (spend.spend_minor / 100) / meta_leads.paid END AS cac_inr
FROM spend, meta_leads;

\echo '--- meta lead lifecycle funnel ---'
SELECT l.lifecycle_stage, COUNT(*) AS n
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE la.source = 'meta'
  AND l.created_at >= now() - (:audit_days || ' days')::interval
  AND l.created_at < now()
GROUP BY l.lifecycle_stage
ORDER BY n DESC;

-- === Phase 5: Attribution completeness (all-time meta) ===

\echo '--- meta attribution field completeness (all-time) ---'
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE meta_campaign_id IS NOT NULL AND meta_campaign_id <> '') AS has_campaign_id,
       COUNT(*) FILTER (WHERE meta_ad_id IS NOT NULL AND meta_ad_id <> '') AS has_ad_id,
       COUNT(*) FILTER (WHERE meta_adset_id IS NOT NULL AND meta_adset_id <> '') AS has_adset_id,
       COUNT(*) FILTER (WHERE meta_form_id IS NOT NULL AND meta_form_id <> '') AS has_form_id
FROM lead_attribution
WHERE source = 'meta';

\echo '--- interest_form + portal with paid meta UTMs (audit window) ---'
SELECT la.source, COUNT(*) AS leads,
       COUNT(*) FILTER (WHERE l.lifecycle_stage IN ('newbie','member','grace')) AS paid
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE la.source IN ('interest_form', 'portal_signup')
  AND l.created_at >= now() - (:audit_days || ' days')::interval
  AND l.created_at < now()
  AND (
    la.utm_source ILIKE '%meta%' OR la.utm_source ILIKE '%facebook%'
    OR la.utm_medium = 'paid'
  )
GROUP BY la.source;

\echo '--- source performance all sources (audit window) ---'
SELECT la.source,
       COUNT(*) AS leads,
       COUNT(*) FILTER (WHERE l.lifecycle_stage IN ('newbie','member','grace')) AS paid,
       ROUND(100.0 * COUNT(*) FILTER (WHERE l.lifecycle_stage IN ('newbie','member','grace')) / NULLIF(COUNT(*), 0), 1) AS cvr_pct
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE l.created_at >= now() - (:audit_days || ' days')::interval
  AND l.created_at < now()
GROUP BY la.source
ORDER BY leads DESC;
