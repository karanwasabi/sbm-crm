# Meta metrics — which number to trust?

One-page guide for marketing. Full audit: [`meta-cac-audit-report.md`](./meta-cac-audit-report.md).

**Audit window used:** last 90 days (as of 2026-07-21).

---

## Quick answers

| You want to know…            | Trust **Meta Ads Manager**         | Trust **CRM dashboard**                                                                           |
| ---------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| How much we spent            | Yes                                | Yes (should match ~₹7.84L for 90d)                                                                |
| How many Lead Ad form fills  | Yes                                | Use **native webhook** count (~612 in 90d), not CRM “Meta Leads” row (2,360 includes Zoho import) |
| Cost per lead (CPL)          | Yes                                | Yes — **Meta** row (spend ÷ Meta leads, excluding old students)                                   |
| Cost per paying member (CAC) | No                                 | Yes — **Meta** row only. Old students are excluded. New + Renewal (incl. recurring) lower CAC.    |
| Meta pixel “Purchase” events | Yes (~133 in sales campaigns, 90d) | Compare to **Meta** New + Renewal, not Old students (Meta)                                        |

---

## Meta row (source performance)

The **Meta** row is Meta-influenced people who are **not** old students. Purchases split into **New** vs **Renewal**. Recurring subscription charges stay in those columns (classified by the parent checkout product) and **lower CAC**. Spend, CPL, and CAC live only on this row.

**Old students (Meta)** is a separate row: same Meta influence signals, but `lead_attribution.source = 'old_students'` (first purchase was before these campaigns). Visible so we can see who from that cohort is buying again. **No CAC** — they do not sit in the Meta denominator.

**Old students** is everyone else in that source who is not Meta-influenced.

Lead ads volume (native vs Zoho import) is available in Lead Intake → Integrations, not duplicated on this dashboard.

---

## Definitions

**Old student** — CRM attribution source `old_students`. These members bought long before the current Meta campaigns.

**New** — paid checkout with `checkout_product` other than `renewal` (`standard`, `trial_1m`, `trial_3m_prepaid`), plus later recurring charges on that checkout.

**Renewal** — paid checkout with `checkout_product = renewal`, plus later recurring charges on that checkout. Renewals from people Meta actually acquired stay on the **Meta** row and lower CAC.

**Lead (Meta)** — Someone submitted a Meta Lead Ad form. Meta counts these in Ads Manager.

**Lead (CRM “Meta Leads” row)** — Anyone with `source=meta` in CRM, including **1,748 Zoho-imported** historical rows from June 2026. For apples-to-apples with Meta, filter mentally to **native webhook** leads (~612 in 90d). The dashboard **Meta** row uses Meta-influenced, not `source=meta`.

**CPL (cost per lead)** — Ad spend ÷ Meta leads (excluding old students). Shown on the Meta row and campaign table.

**CAC (in CRM)** — Ad spend ÷ Meta **New + Renewal** purchases in the window (checkouts + recurring charges, **excluding old students**). This is **not** cost per lead.

**Campaign / ad tables** — New and Renewal are non–old-student Meta-influenced purchases. **Old students** is Meta-influenced old-student purchases on that campaign/ad (not in CAC).

---

## Why numbers disagree

1. **Comparing Meta CPL to CRM CAC** — different denominators (leads vs paying members).
2. **CRM “Meta Leads” includes Zoho import** — inflates lead count vs Meta for recent periods.
3. **Website/register campaigns** — spend on campaigns that drive site signups may show under **Interest Form**, not Meta Leads.
4. **Date boundaries** — CRM leads use UTC `created_at`; Meta uses ad account timezone.

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
