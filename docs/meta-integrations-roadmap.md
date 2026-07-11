# Meta lead integrations

Native Meta Lead Ads is the **live** intake path: Meta sends a `leadgen` webhook, the
backend verifies the signature, fetches the lead from the Graph API, and ingests it via
`ingestExternalLead` with `integration: "native_meta"`.

**Current state (live):**

- Real-time intake: Meta Lead Ads → `POST {PUBLIC_API_URL}/webhooks/meta/leadgen` → CRM
- CRM view: Lead Intake → Integrations (status card + Recent inbound)
- Backend env (production only): `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `META_PAGE_ACCESS_TOKEN`
- Actor/attribution: `LEAD_INTEGRATION_ACTOR_ID`, `PUBLIC_API_URL`
- Optional: `META_CAPI_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` (production only) for server-side `Lead` conversion events

**Generic webhook (secondary):** `POST {PUBLIC_API_URL}/webhooks/leads` remains available for
Zapier/Make/manual sources (API-key auth via `LEAD_INGESTION_API_KEY`, default `integration: "webhook"`).

**Abandoned:** LeadSync (third-party bridge) and Meta CSV import are no longer used. Historical
`lead_attribution.integration = 'leadsync'` / `'meta_csv'` rows remain valid for reads; do not
reconfigure those paths.

---

## A. Native Meta app (live integration)

### Prerequisites (done)

- [x] Full control of the "Slow Burn Method" business portfolio (business admin)
- [x] Meta Developer App "SBM CRM Sync" linked to the portfolio
- [x] Business verification complete
- [x] App Review for lead permissions + app in **Live** mode

### Meta Developer App

- App: **SBM CRM Sync** (`2357689274760951`), Business type, linked to Slow Burn Method
- Permissions approved via App Review:
  - `leads_retrieval`
  - `pages_manage_metadata` / `pages_read_engagement`
  - `pages_show_list`
  - `pages_manage_ads` (lead-ads context fields)
- Long-lived **Page / System User** access token with lead access → `META_PAGE_ACCESS_TOKEN`

### Backend (implemented)

- `GET /webhooks/meta/leadgen` — hub challenge verify (`hub.mode` / `hub.verify_token` / `hub.challenge`)
- `POST /webhooks/meta/leadgen` — HMAC verify `X-Hub-Signature-256`, parse `entry[].changes[]` where `field == "leadgen"`, fetch each `leadgen_id` via Graph, ingest
- Graph fetch: `GET /{leadgen_id}?fields=created_time,id,ad_id,form_id,field_data,campaign_id,platform`; then `GET /{ad_id}?fields=name,campaign{id,name},adset{id,name}` for human-readable ad / campaign / ad-set names (non-fatal on failure)
- Ingest: `integration: "native_meta"`, `source: "meta"`, `external_id = leadgen_id` (idempotent), `native-meta` system tag, CAPI `Lead` on first create
- Attribution mapping (names preferred, numeric ids kept in `meta_*` columns):
  - `utm_campaign` = campaign name (falls back to campaign id) — shown as "Campaign" / "UTM campaign"
  - `utm_content` = ad name (falls back to ad id)
  - `utm_term` = ad-set name (falls back to ad-set id)
  - `meta_platform` = facebook / instagram; `meta_campaign_id` / `meta_ad_id` / `meta_adset_id` = numeric ids
  - Enrich upgrades the name fields on re-sync (a re-run backfill upgrades leads first stored with numeric ids to names); numeric-id fields only fill blanks
- Production-only gates; non-production returns `503`
- Meta webhook paths skipped by the automation outbox drain middleware

### Meta dashboard / Page setup

- Webhooks → object **Page**, field **`leadgen`** only
- Callback URL: `{PUBLIC_API_URL}/webhooks/meta/leadgen` (production: `https://api.slowburnmethod.in/webhooks/meta/leadgen`)
- Verify token = `META_WEBHOOK_VERIFY_TOKEN`
- Install on the Page (app subscription alone is not enough):

```bash
curl -X POST "https://graph.facebook.com/v25.0/{PAGE_ID}/subscribed_apps?subscribed_fields=leadgen&access_token={META_PAGE_ACCESS_TOKEN}"
```

- Leads access: Business Settings → Integrations → **Leads access** → CRMs → assign **SBM CRM Sync** to the Page

### Verification

- [x] Lead Ads Testing Tool → Create lead → Track status shows **Success** for the app
- [x] Railway shows `POST /webhooks/meta/leadgen` → `200`
- [x] CRM → Lead Intake → Integrations → Recent inbound shows the lead (`meta · paid`)
- [x] `integration_sync_events` has `native_meta` `ok` rows
- [ ] Confirm a real (live) ad lead populates campaign/ad attribution
- [ ] Meta Events Manager → Test events shows **Lead** (if CAPI configured)

### Cutover from Zoho

- Run Zoho + native in parallel briefly; compare lead counts
- Once native is confirmed on real ad leads, retire Zoho for lead intake
- Zoho Social remains in the Page's Leads access CRM list until intentionally removed

---

## B. Historical backfill (CLI)

Real-time intake is handled by the webhook. To pull leads that predate the webhook
going live (or to catch anything missed), use the one-off backfill command
`cmd/backfill-meta-leads`. It enumerates the Page's lead forms, pages through
`GET /{form-id}/leads` via the Graph API, and runs each lead through the same
`ingestExternalLead` pipeline — so new leads are created and existing leads are
enriched idempotently (re-running is safe).

**Hard limit:** Meta permanently deletes lead data after ~90 days, so the backfill
can only recover the last ~90 days. Older leads must come from the Zoho export path
(`cmd/import-zoho-leads`).

Requires `META_PAGE_ID` (plus the existing `META_*` env) and `DATABASE_URL`.

```bash
# dry run (counts only, no writes)
DATABASE_URL=... META_PAGE_ACCESS_TOKEN=... META_PAGE_ID=722096250977236 \
  go run ./cmd/backfill-meta-leads --dry-run

# apply to production
DATABASE_URL=<prod> META_PAGE_ACCESS_TOKEN=... META_PAGE_ID=722096250977236 \
  go run ./cmd/backfill-meta-leads --apply --allow-production
```

Flags: `--dry-run` / `--apply` (mutually exclusive), `--allow-production`,
`--since-days` (default and max 90), `--form <id>` (limit to one form).

---

## C. Out of scope (future)

- Marketing API Custom Audiences / Lookalike export
- CAC / ad spend dashboard (Meta Ads spend API, `ads_read`)
- Recurring scheduled catch-up job (webhooks currently cover real-time)
- OAuth connect flow in CRM Settings for token refresh

---

## Environment summary

| Variable                    | Native app (live)                              |
| --------------------------- | ---------------------------------------------- |
| `META_APP_ID`               | Required (production)                          |
| `META_APP_SECRET`           | Required (production)                          |
| `META_WEBHOOK_VERIFY_TOKEN` | Required (production; matches Meta app)        |
| `META_PAGE_ACCESS_TOKEN`    | Required (production; long-lived, lead access) |
| `META_PAGE_ID`              | Required for `cmd/backfill-meta-leads`         |
| `LEAD_INTEGRATION_ACTOR_ID` | Required (attribution actor)                   |
| `PUBLIC_API_URL`            | Required                                       |
| `LEAD_INGESTION_API_KEY`    | Required only for generic `/webhooks/leads`    |
| `META_CAPI_PIXEL_ID`        | Prod optional (recommended)                    |
| `META_CAPI_ACCESS_TOKEN`    | Prod optional (recommended)                    |
| `NEXT_PUBLIC_META_PIXEL_ID` | Prod optional                                  |

Staging: leave all Meta secrets unset; webhooks stay `503`.
