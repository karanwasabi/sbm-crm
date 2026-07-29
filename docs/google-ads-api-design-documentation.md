# Google Ads API — Tool Design Documentation

**Company:** Slow Burn Method  
**Document version:** 1.0  
**Date:** July 2026  
**Contact:** [INSERT API CONTACT EMAIL]  
**Website:** https://slowburnmethod.in

---

## Instructions for Gemini (copy everything below this line into Gemini)

Create a formal Google Docs design document for a Google Ads API developer token application. Use the structure and headings from Google’s sample design documentation template. Format with clear headings, short paragraphs, and one simple architecture diagram described in text (boxes and arrows). Keep tone professional and factual. Do not invent features beyond what is described below. Export-ready for PDF upload to Google Ads API Center.

---

## 1. Company overview

| Field                               | Detail                           |
| ----------------------------------- | -------------------------------- |
| **Legal / brand name**              | Slow Burn Method                 |
| **Primary website**                 | https://slowburnmethod.in        |
| **Product website (member portal)** | https://portal.slowburnmethod.in |
| **Lead intake forms**               | https://forms.slowburnmethod.in  |
| **Country of operation**            | India                            |
| **Currency**                        | Indian Rupee (INR)               |
| **Google Ads Manager account**      | Slow Burn Method MCC             |

Slow Burn Method is a direct-to-consumer health and fitness coaching business. We sell structured coaching programs (e.g. “Take Control”) through a combination of paid digital marketing, website landing pages, intake forms, and a member registration portal. Payments are processed through Razorpay.

---

## 2. Business model

1. **Acquisition:** We run paid campaigns on Google Ads (primarily Search and Performance Max) to drive traffic to our website and lead capture surfaces.
2. **Lead capture:** Prospects submit interest via public intake forms or register on our member portal. Lead records are stored in our internal CRM database (PostgreSQL).
3. **Conversion:** Sales and operations staff nurture leads through our CRM. Prospects enroll in cohort-based programs and pay via Razorpay checkout.
4. **Retention:** Members receive coaching through our mobile app and coach dashboard for the duration of their program.

We already operate a similar integration with Meta (Facebook/Instagram Lead Ads webhook + Conversions API). The Google Ads integration follows the same pattern: capture click identifiers at intake, store attribution in our CRM, and upload offline conversion events when business milestones occur.

---

## 3. Tool description

### 3.1 Name and purpose

**Tool name:** Slow Burn Method CRM — Google Ads Integration  
**Type:** Internal business application (not a public SaaS product)

The tool connects our proprietary CRM to Google Ads for:

- **Attribution:** Storing Google click identifiers (`gclid`, and where applicable `gbraid` / `wbraid`) when a user arrives from an ad.
- **Offline conversion upload:** Sending conversion events back to Google Ads when CRM milestones occur (lead created, registration completed, purchase completed).
- **Reporting:** Pulling campaign-level spend and performance metrics into our CRM dashboard for cost-per-lead (CPL) and customer-acquisition-cost (CAC) analysis.

### 3.2 What the tool does NOT do

The tool is **read-only for campaigns** and does **not**:

- Create or manage Google Ads accounts
- Create, edit, pause, or delete campaigns, ad groups, ads, or keywords
- Modify budgets, bids, or targeting
- Provide keyword planning or recommendation services to third parties
- Use App Conversion Tracking and Remarketing API
- Resell API access or offer the tool to external clients

---

## 4. Intended audience and access

| Audience                                  | Access                                             |
| ----------------------------------------- | -------------------------------------------------- |
| **Internal marketing / operations staff** | Yes — via password-protected CRM admin portal      |
| **General public**                        | No                                                 |
| **External clients or agencies**          | No                                                 |
| **Third-party tools using our token**     | No — token is used only by our own backend service |

Authentication to the CRM uses staff login (Supabase Auth). Google Ads API credentials (developer token, OAuth refresh token) are stored server-side only in our production backend environment. They are never exposed to browsers or mobile apps.

---

## 5. Supported campaign types

The integration supports campaign types that generate click identifiers compatible with offline conversion upload:

- **Search**
- **Performance Max**
- **Display** (if used)

The tool does not implement campaign-type-specific management logic. It uploads conversions using `gclid` regardless of campaign type and reads account-level campaign reporting via the Google Ads API.

---

## 6. System architecture

### 6.1 High-level data flow

```
[User clicks Google Ad]
        |
        v
[Landing page / forms / portal]  -- captures gclid in first-party cookie
        |
        v
[CRM Backend API]  -- stores lead + gclid in PostgreSQL (lead_attribution)
        |
        +-- On lead created -----> UploadClickConversions (SBM Lead)
        |
        +-- On registration -----> UploadClickConversions (SBM Registration)
        |
        +-- On Razorpay payment -> UploadClickConversions (SBM Purchase + value)
        |
        +-- Daily cron job ------> GoogleAdsService.Search (campaign spend)
        |
        v
[CRM Dashboard]  -- displays Google CPL/CAC alongside other channels
```

### 6.2 Components

| Component        | Technology                         | Role                                                    |
| ---------------- | ---------------------------------- | ------------------------------------------------------- |
| CRM Admin Portal | Next.js (internal)                 | Staff UI for leads, cohorts, reporting                  |
| Backend API      | Go (sbm-backend)                   | Lead ingest, attribution, conversion upload, spend sync |
| Database         | PostgreSQL (Supabase)              | Leads, `lead_attribution`, `google_ad_spend`, audit log |
| Intake forms     | Next.js (forms.slowburnmethod.in)  | Public lead forms; passes click IDs to API              |
| Member portal    | Next.js (portal.slowburnmethod.in) | Registration and checkout; passes click IDs             |
| Payments         | Razorpay webhooks                  | Triggers purchase conversion upload                     |

### 6.3 Google Ads account structure

- **Manager account (MCC):** Slow Burn Method MCC — holds developer token and API Center access.
- **Client account:** Production Google Ads account where campaigns run and conversions are attributed.
- API calls use `login-customer-id` (MCC) and target the linked client customer ID.

---

## 7. Google Ads API services used

### 7.1 Conversion upload (write)

**Service:** `ConversionUploadService`  
**Method:** `UploadClickConversions`

| CRM event                                         | Google conversion action | When fired                                                                                 |
| ------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| Lead created in CRM                               | SBM Lead                 | First-time lead ingest with valid `gclid`                                                  |
| User completes registration / checkout enrollment | SBM Registration         | Successful registration milestone (aligned with existing Meta CAPI `CompleteRegistration`) |
| Razorpay payment confirmed                        | SBM Purchase             | Paid checkout; includes conversion value in INR                                            |

**Identifiers sent:**

- Primary: `gclid` (from stored attribution at click time)
- Fallback (when `gclid` absent but Google source known): Enhanced Conversions for Leads using hashed email and phone

**Idempotency:** Each upload uses a unique `event_id` (e.g. `purchase:{checkout_session_id}`). Duplicate uploads are prevented via an internal audit table (`integration_sync_events`).

### 7.2 Reporting (read-only)

**Service:** `GoogleAdsService`  
**Methods:** `Search` or `SearchStream`

**Purpose:** Daily sync of per-campaign spend (last 90 days, rolling window) into table `google_ad_spend` for CRM dashboard CPL/CAC.

**Typical query fields:** `campaign.id`, `campaign.name`, `metrics.cost_micros`, `metrics.impressions`, `metrics.clicks`, `segments.date`

### 7.3 Services explicitly NOT used

- CampaignService, AdGroupService, AdService, KeywordService (no ad management)
- CustomerService (no account creation)
- KeywordPlanIdeaService, KeywordPlanService (no keyword planning)
- UserListService / Remarketing (no audience sync in v1)
- App conversion APIs

---

## 8. Authentication and security

| Item                | Implementation                                                                        |
| ------------------- | ------------------------------------------------------------------------------------- |
| **Developer token** | Stored in server environment variables; sent in `developer-token` header              |
| **OAuth 2.0**       | Web application credentials; long-lived refresh token stored server-side only         |
| **Transport**       | HTTPS only; production API at https://api.slowburnmethod.in                           |
| **Access control**  | CRM admin routes require authenticated staff JWT                                      |
| **Audit**           | All ingestion and conversion upload outcomes logged to `integration_sync_events`      |
| **PII in uploads**  | Email/phone hashed per Google Enhanced Conversions requirements when used as fallback |
| **Token sharing**   | Developer token is not shared with third-party vendors                                |

---

## 9. API usage volume (estimated)

| Operation                            | Frequency                                        | Estimated daily volume  |
| ------------------------------------ | ------------------------------------------------ | ----------------------- |
| UploadClickConversions               | Event-driven (per lead / registration / payment) | &lt; 500 operations/day |
| GoogleAdsService.Search (spend sync) | Once per day (cron)                              | &lt; 50 operations/day  |

Total estimated volume is well below Google Ads API **Basic Access** limits (15,000 operations/day). We do not require Standard Access at launch.

---

## 10. Conversion actions (configured in Google Ads UI)

The following conversion actions are created manually in the Google Ads client account before API upload:

1. **SBM Lead** — lead form submission / CRM lead created
2. **SBM Registration** — member registration completed
3. **SBM Purchase** — successful program payment (value in INR)

Auto-tagging is enabled on the client account so landing URLs include `gclid`.

---

## 11. CRM dashboard (internal UI)

Staff access the integration through our existing CRM:

- **Settings → Integrations:** Google Ads connection status (token configured, last sync time)
- **Dashboard:** Google campaign performance table (spend, leads, purchases, CPL, CAC) — parallel to existing Meta campaign table
- **Lead detail:** Attribution fields including `gclid` and UTM parameters

The CRM is not publicly accessible. Screenshots can be provided upon request during token review.

---

## 12. Development and deployment

| Item                          | Detail                                                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Language**                  | Go 1.22+                                                                                                                    |
| **Google Ads client library** | Official `google-ads-go`                                                                                                    |
| **Hosting**                   | Railway (production backend + scheduled cron jobs)                                                                          |
| **Environments**              | Production only for live API calls; staging does not call Google Ads API                                                    |
| **Testing**                   | Test developer token used against Google Ads test accounts during development; production token after Basic Access approval |

---

## 13. Compliance statement

- This tool is built and operated solely for Slow Burn Method’s internal marketing attribution and reporting.
- We comply with Google Ads API Terms and Conditions and Permissible Use policies.
- We request **Basic Access** with permissible use: **Reporting** and offline conversion upload (**Other**).
- We do not scrape the Google Ads UI or circumvent API policies.

---

## 14. Document approval

| Role           | Name          | Signature / Date |
| -------------- | ------------- | ---------------- |
| API contact    | [INSERT NAME] |                  |
| Technical lead | [INSERT NAME] |                  |

---

_End of design documentation._
