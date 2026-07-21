# Meta ad & CAC audit report

**Audit date:** 2026-07-21 (UTC)  
**Window:** Last **90 days** — lead `created_at` in `[2026-04-22, 2026-07-21)` UTC; spend `spend_date` in `[2026-04-22, 2026-07-21]` inclusive (CRM default dashboard window).

**Data source:** Production read-only (`sbm_audit_ro`). Re-run queries: [`meta-cac-audit-queries.sql`](./meta-cac-audit-queries.sql).

---

## Executive summary

Marketing is likely comparing **different metrics** between Meta Ads Manager and the CRM dashboard. The data pipelines are **healthy** (daily spend sync OK, native Meta webhook ingesting since July). The largest reconcilable gaps are:

| Issue                                                      | Impact                                                                                                                           |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **CRM CAC ≠ Meta CPL**                                     | CRM CAC = spend ÷ **paying members** (37). Meta CPL = spend ÷ **leads** (~2,360). CRM-implied CPL ≈ **₹332** vs CAC **₹21,185**. |
| **74% of “Meta leads” are Zoho CSV imports**               | 1,748 of 2,360 meta leads are `integration=csv_import` (June bulk). Only **612** came through the native webhook in 90d.         |
| **41% of meta leads lack `meta_campaign_id`**              | 971 leads invisible in the **Campaign performance** table; source row still counts them.                                         |
| **8 of 12 campaigns have spend but zero attributed leads** | ₹6.5L+ spend on campaigns with no `source=meta` leads tied to that `campaign_id` in CRM.                                         |
| **Interest-form Meta traffic excluded**                    | 17 leads with Meta UTMs sit under **Interest Form**, not **Meta Leads**.                                                         |

**Bottom line:** Trust Meta for **spend** and **lead form volume** at the ad-account level (after matching date range and timezone). Trust CRM for **lifecycle conversion** (registered → paid member). Do **not** compare Meta CPL to CRM CAC without reading the definitions below.

---

## 1. Metric definitions (marketing cheat sheet)

| Question                             | Use this number                                                                     | Where                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| How much did we spend on Meta?       | **₹7,83,832** (90d, account total)                                                  | Meta Ads Manager ≈ CRM `meta_ad_spend` sum                                   |
| How many Meta form leads did we get? | **~612 native** in 90d (webhook); **2,360** if including Zoho-imported “Meta Leads” | Meta Lead Center ≈ native count; CRM “Meta Leads” row includes legacy import |
| Cost per lead (CPL)?                 | **₹332** = ₹7,83,832 ÷ 2,360                                                        | Meta reports this; **CRM does not show CPL**                                 |
| Cost per paying member (CAC)?        | **₹21,185** = ₹7,83,832 ÷ 37 paid                                                   | CRM **Source performance → CAC** only on Meta Leads row                      |
| Conversion to paid?                  | **1.6%** = 37 ÷ 2,360 (meta source)                                                 | CRM **CVR** column; Meta does not track CRM lifecycle                        |

**“Paid” in CRM** = `lifecycle_stage` in `newbie`, `member`, or `grace` — not “registered” and not Meta’s “results”.

---

## 2. Pipeline health

| Check                | Status                   | Evidence                                                                              |
| -------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| Ad spend sync cron   | **Green**                | `integration_sync_events` `ad_spend_sync` = `ok` daily; last run 2026-07-21 00:02 UTC |
| Spend data freshness | **Green**                | `meta_ad_spend.max(spend_date)` = **2026-07-21**; last updated same day               |
| Native Meta webhook  | **Green**                | 606 `native_meta` leads in July 2026; 599 `lead_created` events (30d)                 |
| Webhook errors       | **Green** (test only)    | 2 `lead_failed` — Graph API test IDs `444444444` (Lead Ads testing tool)              |
| Ad account           | **act_1204405088105936** | Single account in `meta_ad_spend` — confirm this matches Ads Manager                  |

**Spend sync last 10 runs:** all `ok`, ~₹6.0L–₹7.8L rolling 90d total per sync (window grows as days accumulate).

**Webhook volume (30d):** 1,759 `lead_duplicate`, 2,920 `lead_enriched` — idempotent re-delivery/enrichment working as designed.

---

## 3. Spend reconciliation (CRM side)

### Account total (90d)

| Metric      |                Value |
| ----------- | -------------------: |
| Rows        | 128 (campaign × day) |
| Campaigns   |                   12 |
| Total spend |     **₹7,83,831.58** |
| Currency    |                  INR |

### Per-campaign spend (90d)

| Campaign ID        | Campaign name                                     | Spend (₹) | Impressions | Clicks |
| ------------------ | ------------------------------------------------- | --------: | ----------: | -----: |
| 120247307651910453 | SBM_WEBINAR_WEB_ALL_AUD_19-06-26                  |  2,63,901 |     588,628 | 16,141 |
| 120248401049060453 | SBM_1&3_MONTHS_PROGRAM_SALES_RTG_05-07-26         |  1,32,701 |     400,404 |  4,068 |
| 120247667868660453 | SBM_WEBINAR_INST_ALL_AUD_23-06-26                 |  1,29,241 |     295,745 |  5,065 |
| 120248512150660453 | SBM_3_MONTHS_PROGRAM_SALES_RTG_08-07-26           |    85,350 |     101,903 |  1,660 |
| 120248401655440453 | SBM_3_MONTHS_PROGRAM_SALES_PRO_05-07-26           |    60,231 |      74,628 |  1,917 |
| 120246131515940453 | 14July_SBM_WeightLoss_Program_InstantForm_ABO     |    48,041 |     143,001 |  5,020 |
| 120247754894940453 | SBM_WEBINAR_WEB_RTG_23-06-26                      |    25,023 |      84,978 | 10,007 |
| 120247755385730453 | SBM_WEBINAR_INST_RTG_23-06-26                     |    24,073 |      61,235 |  1,511 |
| 120247604977770453 | SBM_WEBINARINSTANTFORM_FORM_ALL_AUD_22-06-26      |     7,383 |      22,269 |    301 |
| 120248467356340453 | SBM_REGISTER_PAGE_PROGRAM_SALES_RTG_05-07-26      |     5,037 |       5,021 |    130 |
| 120248845560530453 | SBM_3_MONTHS_PROGRAM_SALES_LAL_20-07-26           |     2,746 |       4,057 |     46 |
| 120247663719360453 | SBM_WEBINARINSTANTFORM_FORM_ALL_AUD_22-06-26- New |       104 |         288 |      1 |

### Meta Ads Manager comparison (your action)

1. Ads Manager → same ad account **act_1204405088105936**
2. Date range: **22 Apr 2026 – 21 Jul 2026** (match ad account timezone; note CRM spend uses **inclusive** end date on `spend_date`)
3. Export campaign-level spend; total should be within **~1–2%** of **₹7,83,832**
4. If delta is large: check wrong ad account in `META_AD_ACCOUNT_ID`, timezone boundary, or sync gap

**Internal note:** CRM lead window is `[since, until)` on `created_at` UTC; spend window is **inclusive** on `spend_date` — minor boundary skew possible on first/last day.

---

## 4. Lead volume reconciliation

### CRM “Meta Leads” row (90d): **2,360**

| Segment                          | Leads | Paid | Notes                                   |
| -------------------------------- | ----: | ---: | --------------------------------------- |
| `integration=csv_import`         | 1,748 |   29 | Zoho historical import (June 2026 bulk) |
| `integration=native_meta`        |   612 |    8 | Live Lead Ads webhook                   |
| Missing `meta_campaign_id`       |   971 |    — | Excluded from campaign table            |
| `csv_import` without campaign_id |   970 |    — | Zoho rows lack Meta campaign IDs        |

### By month

| Month   | Integration | Leads |
| ------- | ----------- | ----: |
| 2026-06 | csv_import  | 1,748 |
| 2026-06 | native_meta |     6 |
| 2026-07 | native_meta |   606 |

**Meta comparison:** In Ads Manager / Lead Center for the same 90d window, compare lead count to **~612** (native webhook era), not 2,360 — unless you intentionally include Zoho-imported CRM rows.

### Per-campaign leads (only 4 campaigns have IDs)

| Campaign ID        | UTM campaign (on leads)                       | Leads | Paid |
| ------------------ | --------------------------------------------- | ----: | ---: |
| 120247667868660453 | SBM_WEBINAR_INST_RTG_23-06-26                 |   696 |   12 |
| 120246131515940453 | 14July_SBM_WeightLoss_Program_InstantForm_ABO |   463 |    8 |
| 120247755385730453 | SBM_WEBINARINSTANTFORM_FORM_ALL_AUD_22-06-26  |   206 |    3 |
| 120247604977770453 | SBM_WEBINARINSTANTFORM_FORM_ALL_AUD_22-06-26  |    24 |    1 |

**Campaign name mismatch (historical):** For two campaign IDs, `utm_campaign` on imported leads does not match `campaign_name` in `meta_ad_spend` (swapped RTG vs ALL_AUD labels on legacy data). Joins use **numeric ID**, not name — spend↔lead joins are ID-correct but **names confuse humans**.

### Leads outside `source=meta`

| Source          | Leads with Meta-like UTMs | Paid |
| --------------- | ------------------------: | ---: |
| interest_form   |                        17 |    7 |
| trial_3m_signup |                         2 |    1 |

### Invisible to dashboard

| Bucket                                   | Count (90d) |
| ---------------------------------------- | ----------: |
| Leads with **no** `lead_attribution` row |         255 |

---

## 5. CPL & CAC reconciliation

### Derived metrics (90d, CRM data)

| Metric                   | Formula                      |                                Value |
| ------------------------ | ---------------------------- | -----------------------------------: |
| **CRM-implied CPL**      | ₹7,83,832 ÷ 2,360 leads      |                             **₹332** |
| **CRM CAC (source row)** | ₹7,83,832 ÷ 37 paid          | **₹21,185** (integer ₹21,184 in API) |
| **CRM CVR**              | 37 ÷ 2,360                   |                             **1.6%** |
| **Native-only CPL**      | ₹7,83,832 ÷ 612 native leads |                           **₹1,281** |
| **Native-only CAC**      | ₹7,83,832 ÷ 8 native paid    |                          **₹97,979** |

### Lifecycle funnel (`source=meta`, 90d)

| Stage      | Count |
| ---------- | ----: |
| engaged    | 1,521 |
| inquiry    |   775 |
| newbie     |    36 |
| registered |    27 |
| member     |     1 |

Most meta leads stall in **engaged/inquiry** — CAC denominator (paid) is intentionally small.

### Per-campaign CAC (where leads exist)

| Campaign                        | Spend (₹) | Leads | Paid | CPL (₹) | CAC (₹) |
| ------------------------------- | --------: | ----: | ---: | ------: | ------: |
| SBM_WEBINAR_INST_ALL_AUD (667…) |  1,29,241 |   696 |   12 |     186 |  10,770 |
| 14July InstantForm ABO          |    48,041 |   463 |    8 |     104 |   6,005 |
| SBM_WEBINAR_INST_RTG (755…)     |    24,073 |   206 |    3 |     117 |   8,024 |
| Webinar instant form (604…)     |     7,383 |    24 |    1 |     308 |   7,383 |

**8 campaigns** with **₹6,48,136** combined spend show **0** CRM-attributed meta leads — traffic may go to website/register flows (`interest_form`) or leads lack `meta_campaign_id`.

---

## 6. Attribution coverage & gaps

### Field completeness (`source=meta`, all-time)

| Field            | Populated | % of 4,898 |
| ---------------- | --------: | ---------: |
| total            |     4,898 |       100% |
| meta_campaign_id |     1,567 |        32% |
| meta_ad_id       |     1,567 |        32% |
| meta_adset_id    |     1,567 |        32% |
| meta_form_id     |     1,568 |        32% |

### Gap register

| ID  | Severity | Gap                                                               | Recommendation                                                                |
| --- | -------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| G1  | **P0**   | CRM shows **CAC** but not **CPL**; marketing compares to Meta CPL | Add CPL column; label “CAC = cost per paying member”                          |
| G2  | **P0**   | Source CAC uses **total account spend** ÷ meta paid only          | Document clearly; consider CPL at source level                                |
| G3  | **P1**   | 971 meta leads (90d) lack `meta_campaign_id`                      | Backfill from Zoho/raw_payload where possible; show “Unattributed” bucket     |
| G4  | **P1**   | Zoho `csv_import` mixed with `native_meta` in one row             | Split UI row or filter “Native Meta” vs “Imported”                            |
| G5  | **P1**   | Interest-form Meta UTMs (17 leads) excluded from Meta row         | Unified “Meta-acquired” view or attribution rules                             |
| G6  | **P1**   | 8 campaigns with spend, 0 CRM meta leads                          | Investigate landing-page vs Lead Ad forms; link `interest_form` UTMs to spend |
| G7  | **P2**   | No adset-level spend/CAC                                          | Roadmap item                                                                  |
| G8  | **P2**   | Impressions/clicks synced but not in UI                           | Expose for quality diagnosis                                                  |
| G9  | **P2**   | No ROAS (revenue not joined to ad spend)                          | Future analytics                                                              |
| G10 | **P2**   | `FAKE-DATA-AUDIT.md` still says CAC is always `—`                 | Updated in this audit                                                         |
| G11 | **P2**   | 255 leads without any attribution row                             | Audit manual lead creation paths                                              |

---

## 7. API / UI verification

Dashboard loads **source performance** server-side with default `days=90` ([`page.tsx`](<../src/app/(crm)/page.tsx>)). SQL mirror matches API contract:

| Source        | Leads | Paid |  CVR | CAC (₹) |
| ------------- | ----: | ---: | ---: | ------: |
| Meta Leads    | 2,360 |   37 | 1.6% |  21,184 |
| Interest Form | 1,198 |  112 | 9.3% |       — |

Campaign performance table fetches client-side with `days=90` default ([`meta-campaign-performance-table.tsx`](../src/components/crm/meta-campaign-performance-table.tsx)) — shows 12 spend campaigns union 4 lead campaigns.

**No frontend bug identified** — discrepancies are definitional and data-coverage, not rendering.

---

## 8. Recommended next steps

1. **Share this doc with marketing** — especially §1 definitions before the next budget review.
2. **Meta export check** — confirm account total ≈ ₹7.83L for 90d (§3).
3. **Compare Meta lead count to 612** (native) for July-forward reporting.
4. **Product fixes (prioritized):** G1 CPL column → G3 unattributed bucket → G4 native vs import split.
5. **Optional:** Backfill `meta_campaign_id` on Zoho-imported meta leads from `raw_payload` if campaign data exists.

---

## Appendix: all sources (90d)

| Source          | Leads | Paid |   CVR |
| --------------- | ----: | ---: | ----: |
| meta            | 2,360 |   37 |  1.6% |
| interest_form   | 1,198 |  112 |  9.3% |
| old_students    |   665 |  132 | 19.8% |
| referral        |    44 |   11 | 25.0% |
| cr_handle       |    11 |    5 | 45.5% |
| trial_3m_signup |     2 |    1 | 50.0% |
