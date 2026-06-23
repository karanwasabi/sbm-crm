# Meta lead integrations — future setup

Reference doc for when additional Meta access becomes available. The CRM UI is built for **manual CSV import** and a **generic webhook endpoint** until these steps are done.

**Current state (no automation):**

- Import leads: CRM → Lead Database → **Import CSV (Meta)** (export from Meta Leads Center)
- Webhook endpoint: `POST {PUBLIC_API_URL}/webhooks/leads` (see CRM → Settings → Webhooks)
- Backend env: `LEAD_INGESTION_API_KEY`, `LEAD_INTEGRATION_ACTOR_ID`, `PUBLIC_API_URL`
- Optional: `META_CAPI_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` (production only) for server-side conversion events

---

## A. Automated webhook via LeadSync (third-party)

Use when you have **Full control** of the Meta business portfolio, or the business owner can complete the OAuth connection on your behalf.

### Prerequisites

- [ ] Business owner has **Full control** of the “Slow Burn Method” portfolio (or completes LeadSync OAuth themselves)
- [ ] LeadSync **Business** plan (~$19/mo; upgrade if >1,500 leads/mo)
- [ ] Production backend deployed with webhook env vars set

### Backend / infra

- [ ] `LEAD_INGESTION_API_KEY` — strong random secret
- [ ] `LEAD_INTEGRATION_ACTOR_ID` — UUID of a staff user (attribution actor for ingested leads)
- [ ] `PUBLIC_API_URL` — production API base URL (shown in CRM Settings)
- [ ] `META_CAPI_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` on **production** backend (optional but recommended for `Lead` events on ingest)

### LeadSync configuration

- [ ] Sign up / subscribe at LeadSync
- [ ] Connect Meta business portfolio + Page with lead forms
- [ ] Set destination to **Webhook**
- [ ] URL: `{PUBLIC_API_URL}/webhooks/leads`
- [ ] Auth: `Authorization: Bearer {LEAD_INGESTION_API_KEY}` (or `X-Webhook-Secret` / `X-Api-Key` header)
- [ ] Map LeadSync fields to our payload shape (`email`, `first_name`, `phone`, `source`, `external_id`, UTM fields, etc.)
- [ ] Send `integration: "leadsync"` in payload (backend accepts this value)

### Verification

- [ ] Submit a test lead from a Meta form
- [ ] CRM → Lead Intake → **Recent inbound** shows the lead
- [ ] CRM → Lead Database includes the lead with attribution
- [ ] `integration_sync_events` table has `ok` rows (Supabase)
- [ ] Meta Events Manager → Test events shows **Lead** (if CAPI configured)
- [ ] Spot-check duplicate handling (re-send same `external_id` → skipped)

### CRM / code follow-ups (optional)

- [ ] Update integration status UI to reflect live automated ingestion (today `connected` is always `false` in API)
- [ ] Reduce or stop periodic CSV imports once webhook is stable

### If portfolio access is still blocked

- [ ] Business owner completes LeadSync connection in their account
- [ ] Owner shares webhook URL + API key from CRM Settings (no need to grant you Full control)

---

## B. Native Meta app (first-party integration)

Use when you want direct Meta API access: real-time lead webhooks, Marketing API, lookalike audiences, ad spend for CAC, and no third-party subscription.

### Prerequisites

- [ ] **Full control** of Meta business portfolio (business admin)
- [ ] Meta Developer account
- [ ] App Review approval for required permissions

### Meta Developer App

- [ ] Create app at [developers.facebook.com](https://developers.facebook.com) (Business type)
- [ ] Link app to “Slow Burn Method” business portfolio
- [ ] Add **Facebook Login for Business** or system user flow as appropriate
- [ ] Request permissions (typical for lead ads):
  - `leads_retrieval`
  - `pages_manage_metadata` / `pages_read_engagement`
  - `pages_show_list`
  - `ads_read` (for spend / CAC)
- [ ] Complete **App Review** with screencast + test instructions
- [ ] Create long-lived **Page** or **System User** access token with lead access

### Backend work

- [ ] Subscribe Page to `leadgen` webhooks → your endpoint (or dedicated `/webhooks/meta`)
- [ ] Verify webhook signature (`X-Hub-Signature-256`)
- [ ] On `leadgen` notification: fetch lead via Graph API `/{leadgen_id}`
- [ ] Ingest via existing `ingestExternalLead()` with `integration: "native_meta"`
- [ ] Store `meta_form_id`, `meta_ad_id`, campaign IDs from Graph response
- [ ] Env vars: `META_APP_ID`, `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN` (or system user token), webhook verify token

### CRM / product work

- [ ] Enable **Lookalike export (Meta)** on Lead Database (currently disabled; needs Marketing API)
- [ ] Wire **CAC** in source performance from Meta Ads spend API (today always `—`)
- [ ] Show native integration status in Settings (replace generic “webhook only” card)
- [ ] Optional: OAuth connect flow in CRM Settings for token refresh

### CAPI / Pixel

- [ ] Continue using dataset `2147725022394519` (SBM Website)
- [ ] Generate or use app-scoped CAPI token if Events Manager manual token is insufficient
- [ ] Production only: `NEXT_PUBLIC_META_PIXEL_ID` on user portal

### Migration from LeadSync (if applicable)

- [ ] Run both in parallel briefly; compare lead counts
- [ ] Switch Meta lead source to native webhook
- [ ] Cancel LeadSync subscription
- [ ] Historical `lead_attribution.integration = 'leadsync'` rows remain valid

### Verification

- [ ] Test lead form submission → appears in CRM within seconds
- [ ] Lookalike export produces audience file / Custom Audience
- [ ] CAC column populated for Meta row in dashboard source performance
- [ ] App Review demo flows documented for re-submission

---

## Environment summary

| Variable                    | CSV-only today   | LeadSync         | Native app                                |
| --------------------------- | ---------------- | ---------------- | ----------------------------------------- |
| `LEAD_INGESTION_API_KEY`    | Optional         | Required         | Required (or separate Meta verify secret) |
| `LEAD_INTEGRATION_ACTOR_ID` | Required for CSV | Required         | Required                                  |
| `PUBLIC_API_URL`            | Required         | Required         | Required                                  |
| `META_CAPI_PIXEL_ID`        | Prod optional    | Prod recommended | Prod recommended                          |
| `META_CAPI_ACCESS_TOKEN`    | Prod optional    | Prod recommended | Prod recommended                          |
| `NEXT_PUBLIC_META_PIXEL_ID` | Prod optional    | Prod optional    | Prod optional                             |
| Meta app secrets            | —                | —                | Required                                  |
