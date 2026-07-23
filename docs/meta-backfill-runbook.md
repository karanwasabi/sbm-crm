# Meta lead backfill runbook (production)

**Purpose:** Safely recover missing `native_meta` leads and enrich attribution (`meta_campaign_id`, UTM names) using the existing `backfill-meta-leads` CLI.

**Principles**

- **Never** hand-edit `lead_attribution` in SQL for Meta fields.
- **Always** dry-run first; compare counts to [`meta-backfill-verification.sql`](./meta-backfill-verification.sql) snapshots.
- Re-running backfill is **idempotent** for leads already keyed by `leadgen_id`; email matches **enrich** existing rows (no duplicate create).
- `UpdateLeadAttributionEnrich` only **fills blank** `meta_*` ID fields; it does **not** overwrite wrong existing IDs.
- UTM **name** fields can upgrade (numeric id → human-readable name).

**What backfill can fix (90d window)**

| Gap                                                   | Backfill effect                            |
| ----------------------------------------------------- | ------------------------------------------ |
| ~229 Meta Lead Center emails missing `native_meta`    | Create new leads or enrich by email match  |
| 970 `csv_import` meta rows missing `meta_campaign_id` | Fill blanks when Graph returns campaign id |
| 1 `native_meta` row missing `meta_campaign_id`        | Fill blank                                 |
| Wrong `meta_campaign_id` already set                  | **Not fixed** — requires manual review     |

**What backfill cannot fix**

- Leads older than Meta’s ~90-day retention
- Pixel-web campaigns (`WEB_ALL_AUD`, `WEB_RTG`) — not Lead Ads webhook leads
- Lovable webinar pages (`session.*`, `livesession.*`) — no CRM integration today
- **970 Zoho `csv_import` rows** tagged `meta-leads-cv-jul-2026` with **no `native_meta` identity** — emails exist in Zoho but **not** in Meta Lead Center export; Graph cannot match them. Use **cohort repair** (Step 3b) instead.

---

## Step 3b — Zoho cohort attribution repair (970 unattributed)

For the June 2026 Zoho bulk (`Meta Leads CV Jul 2026`), assign the verified campaign id from enriched native leads and `meta_ad_spend`:

| Manual tag               | Campaign ID          | Campaign name                                   |
| ------------------------ | -------------------- | ----------------------------------------------- |
| `meta-leads-cv-jul-2026` | `120246131515940453` | `14July_SBM_WeightLoss_Program_InstantForm_ABO` |

**Dry run:**

```bash
cd code/sbm-backend
DATABASE_URL='<prod-write-url>' \
  go run ./cmd/repair-zoho-meta-cohort --dry-run
```

Expect **~968** rows for `meta-leads-cv-jul-2026`.

**Apply:**

```bash
DATABASE_URL='<prod-write-url>' \
  go run ./cmd/repair-zoho-meta-cohort --apply --allow-production
```

Only fills **blank** `meta_campaign_id`; stamps `raw_payload.repair` for audit. Re-run is idempotent (0 rows on second apply).

**Still unattributed after repair (~3 leads):**

- 2 × `meta-leads-jan-26` — ambiguous across two webinar campaigns; manual review
- 1 × `native_meta` member — re-run Graph backfill or enrich from Ads Manager

---

## Pre-flight

1. Confirm webhook healthy: CRM → Lead Intake → Integrations; `integration_sync_events` has recent `native_meta` `ok` rows.
2. Save **before** snapshot:

```bash
set -a && source ~/.config/sbm/audit.env && set +a
psql "$SBM_AUDIT_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f code/sbm-crm/docs/meta-backfill-verification.sql \
  | tee /tmp/meta-backfill-before.txt
```

3. Have production env ready (not audit URL): `DATABASE_URL`, `META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID`, `LEAD_INTEGRATION_ACTOR_ID`.

---

## Step 1 — Dry run (no writes)

```bash
cd code/sbm-backend
DATABASE_URL='<prod-write-url>' \
META_PAGE_ACCESS_TOKEN='...' \
META_PAGE_ID='722096250977236' \
  go run ./cmd/backfill-meta-leads --dry-run --since-days 90
```

Record: `forms_scanned`, `leads_scanned`, `would_create`, `would_enrich`, `skipped`, `failed`.

**Acceptance:** `failed` should be 0 or explainable (missing email/name). `would_create` ≈ gap vs Lead Center export (~229) is a sanity check, not exact match.

---

## Step 2 — Apply (production)

```bash
DATABASE_URL='<prod-write-url>' \
META_PAGE_ACCESS_TOKEN='...' \
META_PAGE_ID='722096250977236' \
  go run ./cmd/backfill-meta-leads --apply --allow-production --since-days 90
```

Optional: run one form at a time with `--form <form_id>` if you want smaller blast radius.

---

## Step 3 — Post-verify

```bash
set -a && source ~/.config/sbm/audit.env && set +a
psql "$SBM_AUDIT_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f code/sbm-crm/docs/meta-backfill-verification.sql \
  | tee /tmp/meta-backfill-after.txt
```

**Expect improvements**

- `native_meta` lead count increases (toward ~612 + missing emails)
- `has_campaign_id` increases for rows that were blank
- `distinct_campaign_ids` may increase (toward spend table coverage)
- `duplicate leadgen external_id` query still returns **0 rows**

**Red flags — stop and investigate**

- Duplicate emails with **new** second lead rows (should enrich, not create)
- `failed` count large in backfill output
- Sudden drop in total lead count (should never happen)

---

## Step 4 — Ad spend sync (optional, idempotent)

```bash
DATABASE_URL='<prod-write-url>' \
META_PAGE_ACCESS_TOKEN='...' \
META_AD_ACCOUNT_ID='act_1204405088105936' \
  go run ./cmd/sync-meta-ad-spend --since-days 90
```

Refreshes `meta_ad_spend` only; does not change leads.

---

## Rollback

There is **no automatic rollback**. Backfill creates/enriches leads via the normal ingest pipeline. If a bad run occurs:

1. Identify affected `lead_id`s from `integration_sync_events` where `event_type = 'backfill'` and `occurred_at` in the run window.
2. Review each lead in CRM before any manual delete — prefer leaving enriched data over deletion.

Do **not** delete `csv_import` rows wholesale; many are valid historical Zoho imports.

---

## Related code improvements (no backfill risk)

- Source Performance: CPL column + split Meta Native vs Imported
- Campaign Performance: Unattributed bucket for leads missing `meta_campaign_id`
- Forms duplicate submit: refresh `lead_attribution` UTMs; history in `lead_contact_events`

See [`meta_utm_handoff_corrected_1e3dec88.plan.md`](../../../../.cursor/plans/meta_utm_handoff_corrected_1e3dec88.plan.md).
