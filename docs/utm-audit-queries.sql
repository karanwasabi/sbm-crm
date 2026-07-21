-- UTM / Ad Performance audit queries (read-only, aggregates only)
-- Run: set -a && source ~/.config/sbm/audit.env && set +a
--      psql "$SBM_AUDIT_DATABASE_URL" -v ON_ERROR_STOP=1 -f code/sbm-crm/docs/utm-audit-queries.sql

\echo '=== Leads by source (90d) ==='
SELECT la.source, COUNT(*) AS leads,
  COUNT(*) FILTER (WHERE l.lifecycle_stage IN ('newbie','member','grace')) AS paid
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE l.created_at >= now() - interval '90 days'
GROUP BY 1 ORDER BY 2 DESC;

\echo '=== Current vs expanded Ad Performance lead counts (90d) ==='
SELECT
  COUNT(*) FILTER (
    WHERE la.source = 'interest_form'
      AND la.utm_content IS NOT NULL AND la.utm_content <> ''
  ) AS current_ad_perf_leads,
  COUNT(*) FILTER (
    WHERE la.utm_content IS NOT NULL AND la.utm_content <> ''
  ) AS expanded_ad_perf_leads,
  COUNT(*) FILTER (
    WHERE la.source <> 'interest_form'
      AND la.utm_content IS NOT NULL AND la.utm_content <> ''
  ) AS excluded_by_interest_form_filter
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE l.created_at >= now() - interval '90 days';

\echo '=== Excluded by interest_form filter, by source (90d) ==='
SELECT la.source, COUNT(*) AS leads
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE la.source <> 'interest_form'
  AND la.utm_content IS NOT NULL AND la.utm_content <> ''
  AND l.created_at >= now() - interval '90 days'
GROUP BY 1 ORDER BY 2 DESC;

\echo '=== UTM fill rates by source (90d) ==='
SELECT la.source,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE la.utm_content IS NOT NULL AND la.utm_content <> '') AS has_utm_content,
  COUNT(*) FILTER (WHERE la.utm_campaign IS NOT NULL AND la.utm_campaign <> '') AS has_utm_campaign,
  COUNT(*) FILTER (WHERE la.utm_term IS NOT NULL AND la.utm_term <> '') AS has_utm_term
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE l.created_at >= now() - interval '90 days'
GROUP BY 1 ORDER BY 2 DESC;

\echo '=== interest_form UTM capture gap (90d) ==='
SELECT
  COUNT(*) AS interest_form_total,
  COUNT(*) FILTER (WHERE la.utm_content IS NULL OR la.utm_content = '') AS missing_utm_content
FROM lead_attribution la
JOIN leads l ON l.id = la.lead_id
WHERE la.source = 'interest_form'
  AND l.created_at >= now() - interval '90 days';

\echo '=== Ad Performance row groups: current vs expanded (90d) ==='
SELECT
  (SELECT COUNT(*) FROM (
    SELECT la.utm_content, la.utm_term, la.utm_campaign
    FROM lead_attribution la
    JOIN leads l ON l.id = la.lead_id
    WHERE la.source = 'interest_form'
      AND la.utm_content IS NOT NULL AND la.utm_content <> ''
      AND l.created_at >= now() - interval '90 days'
    GROUP BY 1,2,3
  ) t) AS current_row_groups,
  (SELECT COUNT(*) FROM (
    SELECT la.utm_content, la.utm_term, la.utm_campaign
    FROM lead_attribution la
    JOIN leads l ON l.id = la.lead_id
    WHERE la.utm_content IS NOT NULL AND la.utm_content <> ''
      AND l.created_at >= now() - interval '90 days'
    GROUP BY 1,2,3
  ) t) AS expanded_row_groups;

\echo '=== Leads without attribution row ==='
SELECT COUNT(*) AS leads_without_attribution
FROM leads l
LEFT JOIN lead_attribution la ON la.lead_id = l.id
WHERE la.lead_id IS NULL;

\echo '=== Meta spend vs meta leads (90d) ==='
SELECT
  (SELECT COUNT(DISTINCT campaign_id) FROM meta_ad_spend
   WHERE spend_date >= (current_date - interval '90 days')) AS campaigns_with_spend,
  (SELECT COUNT(DISTINCT la.meta_campaign_id) FROM lead_attribution la
   JOIN leads l ON l.id = la.lead_id
   WHERE la.source = 'meta' AND la.meta_campaign_id IS NOT NULL AND la.meta_campaign_id <> ''
     AND l.created_at >= now() - interval '90 days') AS meta_leads_with_campaign_id;
