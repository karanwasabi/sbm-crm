# CRM fake / mock data audit

> **TEMPORARY** — delete or archive when remaining mocks are wired or removed.  
> Permanent integration plans live in [`meta-integrations-roadmap.md`](./meta-integrations-roadmap.md).

Last updated: 2026-06-27

---

## Dashboard (`/`) — real data

| Element                  | Source                                                |
| ------------------------ | ----------------------------------------------------- |
| All 5 KPI cards          | `GET /admin/analytics/dashboard`                      |
| New leads sparkline      | Same endpoint (`new_leads_sparkline`, last 7 days)    |
| Lifecycle funnel         | `CountLeadsByStage` via dashboard endpoint            |
| Geography donut          | `CountLeadsByCity` via dashboard endpoint             |
| Weekly revenue chart     | Paid `checkout_sessions` + `subscription_charges`     |
| Source performance table | `GET /admin/analytics/source-performance`             |
| Comms health panel       | **Removed** from dashboard (comms not integrated yet) |

**Still limited (not fake, but incomplete):**

| Element        | Notes                                                |
| -------------- | ---------------------------------------------------- |
| CAC column     | Always `—` until Meta Ads spend API                  |
| Conversion KPI | All-time; paid = registered+active+completed+renewal |
| Revenue chart  | No ad spend overlay (requires Meta Ads API)          |

---

## Communications (`/communications`) — Phase 1 real data

| Element                                | Source                                                           |
| -------------------------------------- | ---------------------------------------------------------------- |
| Email templates list + editor          | `GET/POST/PATCH /admin/comms/templates` + GrapesJS MJML designer |
| Template test send                     | `POST /admin/comms/templates/:id/send-test`                      |
| Marketing contact cap meter            | `GET /admin/comms/contacts/summary`                              |
| Customer 360 send email                | `POST /admin/comms/leads/:id/send`                               |
| Lead Database marketing filter + badge | `GET /admin/leads?marketing_contact_status=`                     |
| Customer 360 marketing contact card    | `marketing_contact_status` on lead detail                        |

**Phase 1 not yet wired:**

| Element | Notes            |
| ------- | ---------------- |
| —       | Phase 1 complete |

## Communications — Phase 2 (automations)

| Element                           | Source                                               |
| --------------------------------- | ---------------------------------------------------- |
| Automations list + builder canvas | `GET/PATCH /admin/comms/automations` + React Flow UI |
| Publish workflow                  | `POST /admin/comms/automations/:id/publish`          |
| Test mode (dry run)               | `POST /admin/comms/automations/:id/test`             |
| Enrollment viewer API             | `GET /admin/comms/automations/:id/enrollments`       |
| Execution engine + worker         | `cmd/automation-worker` polls due enrollments        |

**Deploy:** run migration `20260627120000_email_automations.sql`. Railway cron service: `SBM_CRON_JOB=automation-worker`, schedule `*/5 * * * *` (see `sbm-backend/.env.example`). Set `LEAD_INTEGRATION_ACTOR_ID` for stage events and automation sends.

**Triggers:** `lead_created` (ingest + manual intake), `stage_changed` (inquiry→engaged), `checkout_started`.

## Communications — Phase 1.5 (delivery tracking)

| Element                                          | Source                                        |
| ------------------------------------------------ | --------------------------------------------- |
| Performance tab KPIs + template table            | `GET /admin/comms/analytics`                  |
| Resend webhook event storage                     | `POST /webhooks/resend` → `email_send_events` |
| Customer 360 timeline (delivered/opened/clicked) | `ListEmailSendEventsByLead` on lead detail    |
| Recent send log API                              | `GET /admin/comms/sends`                      |

**Deploy:** run migration `20260626120000_email_send_events_webhook.sql`, set `RESEND_WEBHOOK_SECRET`, register webhook URL in Resend dashboard.

---

## Active mocks (still imported by live views)

| Element                          | Location            | Notes                                         |
| -------------------------------- | ------------------- | --------------------------------------------- |
| Razorpay integration card status | `settings-view.tsx` | Hardcoded `status="connected"` — not verified |

---

## Hardcoded / non-functional UI (not from mock files)

| Screen        | Element                   | Issue                                     |
| ------------- | ------------------------- | ----------------------------------------- |
| Lead Database | “0 selected”              | Always 0 — selection not implemented      |
| Lead Database | “Message segment” button  | `disabled`                                |
| Lead Database | “Lookalike export (Meta)” | `disabled` — needs Marketing API          |
| Lead Intake   | Inbound log empty state   | No empty-state message when list is empty |

---

## Dead code removed

- `lib/mock/dashboard.ts` — deleted (dashboard wired to API)
- `lib/mock/lead-intake.ts` — deleted
- `lib/mock/settings.ts` — deleted
- `lib/mock/customers.ts` — deleted
- `lib/mock/staff.ts` — deleted
- `lib/mock/communications.ts` — deleted (communications Phase 1 wired)

---

## Real data elsewhere (unchanged)

| Screen                              | Source                                             |
| ----------------------------------- | -------------------------------------------------- |
| Lead Database list + summary        | `listLeads`, `getLeadSummary`                      |
| Lead Intake manual form             | `createManualLead` action                          |
| Lead Intake Meta card + inbound     | `getMetaIntegrationStatus`, `getMetaInboundLeads`  |
| Customer 360                        | `getLead`, `getMemberEnrollments`, `sendLeadEmail` |
| Customer 360 attribution card       | When `lead_attribution` row exists                 |
| Settings webhook URL                | `PUBLIC_API_URL` on backend                        |
| Settings team tab                   | `listStaff`                                        |
| Programs, promos, renewals, cohorts | Real APIs                                          |

---

## Remaining prioritisation

1. **Communications Phase 3** — Bulk segment send from Lead Database
2. **Settings Razorpay card** — optional health check from backend
3. **CAC column** — Meta Ads spend (native Meta app roadmap)
4. **Automation worker cron** — Railway service with `SBM_CRON_JOB=automation-worker` (every 5 min)
