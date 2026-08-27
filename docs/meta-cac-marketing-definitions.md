# Meta metrics — which number to trust?

One-page guide for marketing. Full audit: [`meta-cac-audit-report.md`](./meta-cac-audit-report.md).

**Audit window used:** last 90 days (as of 2026-07-21).

---

## Quick answers

| You want to know…            | Trust **Meta Ads Manager** | Trust **CRM dashboard**                                                                            |
| ---------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| How much we spent            | Yes                        | Yes (should match ~₹7.84L for 90d)                                                                 |
| How many Lead Ad form fills  | Yes                        | Use **native webhook** count (~612 in 90d), not CRM “Meta Leads” row (2,360 includes Zoho import)  |
| Cost per lead (CPL)          | Yes                        | Yes — **Meta** row (spend ÷ Meta leads, excluding old students)                                    |
| Cost per paying member (CAC) | No                         | Yes — **Meta** row only. Old students excluded. **New acquisitions only** (renewals are separate). |
| Meta pixel / CAPI Purchase   | New enrollments only       | Renewals are **not** sent as Meta Purchase (CAPI or browser pixel)                                 |

---

## Meta row (source performance)

The **Meta** row is Meta-influenced people who are **not** old students. **Purchases** and **CAC** use **new acquisitions only** (`standard`, `trial_1m`, `trial_3m_prepaid`, plus recurring charges on those checkouts). Renewals no longer sit in this denominator and do not lower CAC.

**Old students (Meta)** is a separate informational row: same Meta influence signals, but `lead_attribution.source = 'old_students'`. **No CAC**.

**Meta-influenced renewals** are reported in their own table (counts + revenue, **no spend / CAC**).

**Meta acquisition by plan** compares **1-month trial** vs **3-month trial** new Meta acquisitions with attributed spend share, CAC, ROAS, and contribution after ads.

**Old students** (non–Meta-influenced) remain a separate source row.

Lead ads volume (native vs Zoho import) is available in Lead Intake → Integrations, not duplicated on this dashboard.

---

## Definitions

**Old student** — CRM attribution source `old_students`. These members bought long before the current Meta campaigns.

**New / Purchases (Meta CAC)** — paid checkout with `checkout_product` other than `renewal` (`standard`, `trial_1m`, `trial_3m_prepaid`), plus later recurring charges on that checkout. Excludes old students.

**Renewal** — paid checkout with `checkout_product = renewal` (alumni, trial extend, returnee, etc.), plus later recurring charges on that checkout. Counted in the **Renewals** table only for Meta economics — **not** sent to Meta as Purchase, **not** in Meta CAC.

**Lead (Meta)** — Someone submitted a Meta Lead Ad form. Meta counts these in Ads Manager.

**Lead (CRM “Meta Leads” row)** — Anyone with `source=meta` in CRM, including **1,748 Zoho-imported** historical rows from June 2026. For apples-to-apples with Meta, filter mentally to **native webhook** leads (~612 in 90d). The dashboard **Meta** row uses Meta-influenced, not `source=meta`.

**CPL (cost per lead)** — Ad spend ÷ Meta leads (excluding old students). Shown on the Meta row and campaign table.

**CAC (in CRM)** — Ad spend ÷ Meta **new** purchases in the window (checkouts + recurring charges, **excluding old students and renewals**). This is **not** cost per lead.

**ROAS** — Revenue ÷ attributed ad spend (acquisition-by-plan table).

**Contribution after ads** — Revenue − attributed ad spend. Ads only; not full P&L.

**Attributed spend (by plan)** — Same Meta sales-campaign spend as the Meta row, allocated to 1m / 3m **proportional to purchase count**. This is CRM-attributed spend share, not a Meta campaign-level split by plan.

**Campaign / ad tables** — Purchases are non–old-student Meta-influenced **new** acquisitions. **Old students** column is Meta-influenced old-student purchases on that campaign/ad (not in CAC). Renewals are not shown here.

---

## Why numbers disagree

1. **Comparing Meta CPL to CRM CAC** — different denominators (leads vs paying members).
2. **CRM “Meta Leads” includes Zoho import** — inflates lead count vs Meta for recent periods.
3. **Website/register campaigns** — spend on campaigns that drive site signups may show under **Interest Form**, not Meta Leads.
4. **Date boundaries** — CRM leads use UTC `created_at`; Meta uses ad account timezone.
5. **Renewals in Meta Ads Manager** — historical renewals may still appear in Meta if they were sent before the CAPI/pixel gate; going forward they should not.

---

## What to do in Ads Manager (validation)

1. Account: **act_1204405088105936**
2. Dates: **22 Apr – 21 Jul 2026** (adjust timezone to match account)
3. Compare total spend to **₹7,83,832**
4. Compare lead count to **~612** (post–native-webhook era), not 2,360

---

## Planned CRM improvements (from audit)

1. Split **Native Meta** vs **Imported** in source table
2. Keep **Unattributed** campaign bucket for leads missing `meta_campaign_id`
