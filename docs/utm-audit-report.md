# UTM & Ad Performance Audit Report

**Date:** 2026-07-21  
**Database:** Production (read-only `sbm_audit_ro`)  
**Window:** Primary metrics use last **90 days** unless noted.

---

## Executive summary

The Ad Performance table shows almost no data for two independent reasons:

1. **Reporting bug (critical):** The query filters `lead_attribution.source = 'interest_form'`, which excludes **99% of ad-attributed leads** in the last 90 days (1,391 of 1,408 leads with `utm_content`). Nearly all excluded leads are **Meta Lead Ads** (`source = 'meta'`).

2. **Capture gap on interest forms:** Even among interest-form leads, **98.6%** lack `utm_content` (1,181 of 1,198 in 90d). URL UTMs from landing pages are rarely persisted.

3. **Naming mismatch:** The UTM link catalog (`SBM_UTM_LINKS.csv`) uses values like `HEALTH_AND_FITNESS_AD-1`, but Meta leads store **Meta ad names** (e.g. `Woman_Tier-1_Ad-4`). Only **3 leads all-time** match catalog-style `RTG_AD-*` / `*_AD-*` patterns from the CSV.

4. **Wrong funnel for CPC ads:** Meta ads land on `slowburnmethod.in/sbm-take-control/` but CTAs go to WordPress Gravity Forms or `portal.slowburnmethod.in` — **not** `forms.slowburnmethod.in`. See [`utm-funnel-trace.md`](utm-funnel-trace.md).

**Bottom line:** Fixing the `interest_form` filter is necessary but not sufficient. Most paid leads enter via Meta instant forms, not the website interest form with URL UTMs.

---

## Phase 0 — `interest_form` filter

### Origin

Introduced in commit `c78da20` (_feat: add utm table_, 2026-07-12) with comment _"Interest-form (website ad funnel) leads"_. This was an implementation assumption, not a stated product requirement.

### Production impact (90 days)

| Metric                                                                |                                    Count |
| --------------------------------------------------------------------- | ---------------------------------------: |
| Leads in **current** Ad Performance (`interest_form` + `utm_content`) |                                   **17** |
| Leads in **expanded** Ad Performance (any source + `utm_content`)     |                                **1,408** |
| Leads **hidden** by `interest_form` filter                            | **1,391** (98.8% of ad-attributed leads) |
| Hidden leads from `meta`                                              |                                    1,389 |
| Hidden leads from `trial_3m_signup`                                   |                                        2 |

| Metric                                                               | Current | Expanded |
| -------------------------------------------------------------------- | ------: | -------: |
| Distinct ad row groups (`utm_content` × `utm_term` × `utm_campaign`) |  **11** |   **80** |

### All-time

| Current Ad Performance leads | Expanded | Hidden by filter |
| ---------------------------: | -------: | ---------------: |
|                           27 |    1,628 |            1,601 |

**Recommendation (P0):** Remove `la.source = 'interest_form'` from `CountAdPerformanceByContent`. Group all leads with non-empty `utm_content` (optionally include `meta_ad_id` fallback). Update CRM subtitle accordingly.

---

## Phase 1 — Ad catalog vs database

### `SBM_UTM_LINKS.csv`

| Status    | Ads in catalog |
| --------- | -------------: |
| ACTIVE    |             20 |
| PAUSED    |             12 |
| **Total** |         **32** |

Catalog `utm_content` values use underscore landing-page convention (e.g. `HEALTH_AND_FITNESS_AD-1`, `utm_term=3-MONTHS`).

### Catalog match in production

Sample catalog values (`HEALTH_AND_FITNESS_AD-*`, `FOOD_CHOICES_AD-*`, `WOMAN_AD-*`, `RTG_AD-*`): **3 leads all-time**, only on `RTG_AD-1`, `RTG_AD-6`, `RTG_AD-7` from non–interest-form sources.

**Zero** catalog matches for the main 3-month active ad set naming.

### What actually appears in `utm_content` (90d, top sources)

Meta ad names dominate, e.g.:

- `SBM_INST_LEAD_WEBINAR-4_AD-6 - Copy` (230 leads)
- `Food_Choices_Tier-1_Ad-4` (96)
- `Woman_Tier-1_Ad-4` (86)
- `Health_&_Fitness_Tier-1_Ad-4` (84)

These come from **Meta Lead Ads webhook** (`source = meta`), mapping ad name → `utm_content`. They do not match the CSV landing-page UTM strings.

---

## Phase 2 — Attribution inventory (90 days)

### Leads by source

| Source          | Leads | Paid |
| --------------- | ----: | ---: |
| meta            | 2,360 |   37 |
| interest_form   | 1,198 |  112 |
| old_students    |   665 |  132 |
| referral        |    44 |   11 |
| cr_handle       |    11 |    5 |
| trial_3m_signup |     2 |    1 |

### UTM fill rates by source

| Source        | Total | Has `utm_content` | Has `utm_campaign` | Has `utm_term` |
| ------------- | ----: | ----------------: | -----------------: | -------------: |
| meta          | 2,360 |       1,389 (59%) |              1,389 |          1,389 |
| interest_form | 1,198 |     **17 (1.4%)** |                170 |             17 |
| old_students  |   665 |                 0 |                  0 |              0 |
| referral      |    44 |                 0 |                  0 |              0 |

Meta leads without `utm_content` (971 in 90d) are likely older ingest or Graph API gaps.

### Other gaps

| Issue                                    | Count |
| ---------------------------------------- | ----: |
| Leads with **no** `lead_attribution` row |   255 |
| Meta campaigns with spend (90d)          |    12 |
| Meta leads with `meta_campaign_id` (90d) |     4 |

Meta Campaign Performance is also thin: spend sync covers 12 campaigns but only 4 campaign IDs appear on leads in-window.

---

## Phase 3 — Ingestion paths (code review)

| Path                    | `source`                   | UTM capture                                                 | Ad Performance today |
| ----------------------- | -------------------------- | ----------------------------------------------------------- | -------------------- |
| Meta Lead Ads webhook   | `meta`                     | Ad/campaign/adset **names** → UTM fields + Meta IDs         | **Excluded**         |
| Interest form           | `interest_form`            | URL UTMs from cookie — **rarely present**                   | Only path included   |
| Portal / trial register | `portal_signup`, `trial_*` | 4 UTMs in auth metadata; sync to attribution on member lead | Excluded             |
| Standard checkout       | —                          | No UTM                                                      | —                    |

**interest_form capture:** `sbm-forms` sets 30-day first-touch cookie; only **1.4%** of interest-form leads have `utm_content` in DB — cookie not surviving, form submitted without landing on tagged URL, or duplicate submissions not updating attribution.

**auth.users audit:** `sbm_audit_ro` lacks `SELECT` on `auth.users` in current grants — leakage check (UTM in app metadata but not on lead) deferred until grant is added.

---

## Phase 4 — Dashboard reconciliation

| Table                         | What it shows                        | 90d usefulness                          |
| ----------------------------- | ------------------------------------ | --------------------------------------- |
| **Ad Performance**            | `interest_form` + `utm_content` only | **17 leads**, 11 rows — misleading      |
| **Meta Campaign Performance** | `meta` + `meta_campaign_id` + spend  | 4 campaigns with leads vs 12 with spend |
| **Source Performance**        | By `source` slug, not `utm_source`   | Meta 2,360 leads; CAC only on Meta row  |

The three tables measure **non-overlapping slices** of the funnel. Users expecting “all ads” from Ad Performance will see ~1% of reality.

---

## Gap matrix (prioritized)

| Priority | Gap                                           | Impact                                     | Fix                                                                    |
| -------- | --------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| **P0**   | `source = 'interest_form'` on Ad Performance  | Hides 98.8% of ad-attributed leads         | Remove filter in SQL + update UI copy                                  |
| **P1**   | Interest form missing `utm_content` (98.6%)   | Landing-page UTMs lost                     | Debug cookie domain, form submit payload, duplicate attribution update |
| **P1**   | Catalog names ≠ Meta ad names                 | CSV reconciliation useless for Meta funnel | Document two namespaces; optional mapping table                        |
| **P2**   | Meta campaign ID on only 4/12 spend campaigns | Thin Meta Campaign Performance             | Webhook/backfill + spend join                                          |
| **P2**   | 255 leads without attribution                 | Unknown source                             | Backfill / ingest audit                                                |
| **P3**   | `auth.users` not readable by audit role       | Can't quantify metadata leakage            | `GRANT SELECT ON auth.users` to `sbm_audit_ro`                         |
| **P3**   | Lead export has no UTM columns                | Offline analysis hard                      | Add UTM columns to XLSX export                                         |

---

## Recommended next steps

1. **Ship P0** — Expand `CountAdPerformanceByContent` to all sources with `utm_content` (validate row count goes from 11 → ~80 for 90d).
2. **Investigate interest-form UTM** — Sample recent interest-form leads; trace cookie + API payload in `intake_form_submit`.
3. **Align reporting with funnels** — Meta Lead Ads are the primary ad path; Ad Performance after P0 will show Meta ad names, not CSV link names.
4. **Re-run** `utm-audit-queries.sql` after P0 deploy to confirm counts.

---

## Artifacts

- Queries: [`utm-audit-queries.sql`](utm-audit-queries.sql)
- Catalog: [`SBM_UTM_LINKS.csv`](SBM_UTM_LINKS.csv)
- Funnel trace + fix plan: [`utm-funnel-trace.md`](utm-funnel-trace.md)
- Cursor rule: [`.cursor/rules/audit-database.mdc`](../../.cursor/rules/audit-database.mdc)
