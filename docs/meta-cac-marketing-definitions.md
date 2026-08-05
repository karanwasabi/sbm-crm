# Meta metrics — which number to trust?

One-page guide for marketing. Full audit: [`meta-cac-audit-report.md`](./meta-cac-audit-report.md).

**Audit window used:** last 90 days (as of 2026-07-21).

---

## Quick answers

| You want to know…            | Trust **Meta Ads Manager**         | Trust **CRM dashboard**                                                                           |
| ---------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| How much we spent            | Yes                                | Yes (should match ~₹7.84L for 90d)                                                                |
| How many Lead Ad form fills  | Yes                                | Use **native webhook** count (~612 in 90d), not CRM “Meta Leads” row (2,360 includes Zoho import) |
| Cost per lead (CPL)          | Yes                                | **Not shown** — compute: spend ÷ leads ≈ **₹332** (all meta rows)                                 |
| Cost per paying member (CAC) | No                                 | Yes — **Meta** row (influenced conversions)                                                       |
| Meta pixel “Purchase” events | Yes (~133 in sales campaigns, 90d) | Compare to **Meta** row purchases column                                                          |

---

## Meta row (source performance)

Single row for paid social. Counts paying members who enrolled in the window and have a Meta influence signal (lead ads, campaign id, Meta UTMs on the lead or portal signup, or a stored **Meta click id** `fbclid`).

Lead ads volume (native vs Zoho import) is available in Lead Intake → Integrations, not duplicated on this dashboard.

---

## Definitions

**Lead (Meta)** — Someone submitted a Meta Lead Ad form. Meta counts these in Ads Manager.

**Lead (CRM “Meta Leads” row)** — Anyone with `source=meta` in CRM, including **1,748 Zoho-imported** historical rows from June 2026. For apples-to-apples with Meta, filter mentally to **native webhook** leads (~612 in 90d).

**CPL (cost per lead)** — Ad spend ÷ number of leads. Meta shows this. CRM does **not** have a CPL column today.

**CAC (in CRM)** — Ad spend ÷ **paid members** (`newbie` + `member` + `grace`). This is **not** cost per lead. With 37 paid from 2,360 meta leads, CAC is ~₹21k while CPL is ~₹332.

**Paid (CRM)** — Paying programme member (`newbie` / `member` / `grace`). Use **Meta purchases** row to compare to Meta pixel Purchases.

**Meta Leads (Native/Imported)** — Lead-ad volume only (`source=meta`); purchase column uses enrollment date.

**Campaign table (CRM)** — Meta-influenced leads/purchases per `meta_campaign_id` (any source with a campaign id).

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

1. Show **CPL** alongside CAC with clear labels
2. Split **Native Meta** vs **Imported** in source table
3. **Unattributed** campaign bucket for leads missing `meta_campaign_id`
