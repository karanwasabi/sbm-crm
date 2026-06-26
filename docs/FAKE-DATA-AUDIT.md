# CRM fake / mock data audit

> **TEMPORARY** — delete or archive when remaining mocks are wired or removed.  
> Permanent integration plans live in [`meta-integrations-roadmap.md`](./meta-integrations-roadmap.md).

Last updated: 2026-06-27

---

## Dashboard (`/`) — real data

| Element                  | Source                                             |
| ------------------------ | -------------------------------------------------- |
| All 5 KPI cards          | `GET /admin/analytics/dashboard`                   |
| New leads sparkline      | Same endpoint (`new_leads_sparkline`, last 7 days) |
| Lifecycle funnel         | `CountLeadsByStage` via dashboard endpoint         |
| Geography donut          | `CountLeadsByCity` via dashboard endpoint          |
| Weekly revenue chart     | Paid `checkout_sessions` + `subscription_charges`  |
| Source performance table | `GET /admin/analytics/source-performance`          |

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

Phase 1 complete.

## Communications — Phase 2 (automations)

| Element                           | Source                                               |
| --------------------------------- | ---------------------------------------------------- |
| Automations list + builder canvas | `GET/PATCH /admin/comms/automations` + React Flow UI |
| Activate / deactivate / archive   | `POST .../activate` · `deactivate` · `archive`       |
| Test mode (dry run)               | `POST /admin/comms/automations/:id/test`             |
| Enrollment viewer API             | `GET /admin/comms/automations/:id/enrollments`       |
| Execution engine + worker         | `cmd/automation-worker` polls due enrollments        |

**Production:** migrations applied; `sbm-automation-cron` with `SBM_CRON_JOB=automation-worker` (`*/5 * * * *`).

**Triggers:** `lead_created`, `stage_changed`, `checkout_started`. Condition nodes retry async facts for up to 7 days.

## Communications — Phase 1.5 (delivery tracking)

| Element                                          | Source                                        |
| ------------------------------------------------ | --------------------------------------------- |
| Performance tab KPIs + template table            | `GET /admin/comms/analytics`                  |
| Resend webhook event storage                     | `POST /webhooks/resend` → `email_send_events` |
| Customer 360 timeline (delivered/opened/clicked) | `ListEmailSendEventsByLead` on lead detail    |
| Recent send log API                              | `GET /admin/comms/sends`                      |

**Production:** `RESEND_WEBHOOK_SECRET` + webhook registered in Resend dashboard.

---

## Active mocks (still imported by live views)

| Element | Location | Notes |
| ------- | -------- | ----- |
| —       | —        | None  |

---

## Hardcoded / non-functional UI (not from mock files)

| Screen        | Element                   | Issue                                 |
| ------------- | ------------------------- | ------------------------------------- |
| Lead Database | “0 selected”              | Always 0 — bulk selection not built   |
| Lead Database | “Message segment” button  | `disabled` — bulk send deferred / TBD |
| Lead Database | “Lookalike export (Meta)” | `disabled` — needs Marketing API      |
| Lead Database | “More filters”            | `disabled` in filter bar              |

---

## Dead code removed

- `lib/mock/dashboard.ts` — deleted (dashboard wired to API)
- `lib/mock/lead-intake.ts` — deleted
- `lib/mock/settings.ts` — deleted
- `lib/mock/customers.ts` — deleted
- `lib/mock/staff.ts` — deleted
- `lib/mock/communications.ts` — deleted (communications Phase 1 wired)

**Orphan components (unused, low priority cleanup):**

- `components/ui/search-input.tsx` — global search never wired
- `components/crm/attendance-table.tsx` — attendance feature not started

---

## Real data elsewhere (unchanged)

| Screen                              | Source                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| Lead Database list + summary        | `listLeads`, `getLeadSummary`                                                         |
| Lead Intake manual form             | `createManualLead` action                                                             |
| Lead Intake Meta card + inbound     | `getMetaIntegrationStatus`, `getMetaInboundLeads`                                     |
| Customer 360                        | `getLead`, `getMemberEnrollments`, `sendLeadEmail`                                    |
| Customer 360 attribution card       | When `lead_attribution` row exists                                                    |
| Settings integrations               | `getMetaIntegrationStatus`, `getRazorpayIntegrationStatus` (status cards only)        |
| Settings webhook URL                | Not shown in CRM UI — ops use `PUBLIC_API_URL` + `/webhooks/leads` (see meta roadmap) |
| Settings team tab                   | `listStaff`                                                                           |
| Programs, promos, renewals, cohorts | Real APIs                                                                             |

---

## Remaining prioritisation

1. **Meta integration** — LeadSync webhook or native app ([`meta-integrations-roadmap.md`](./meta-integrations-roadmap.md))
2. **CAC column + lookalike export** — Meta Ads / Marketing API
3. **Lead Database “More filters”** — additional filter dimensions
4. **Lead Database search + pagination** — server-side `q`/page on `listLeads`
5. **Program calendar** — `GET /admin/programs/calendar` has no CRM page yet
6. **Customer 360 member stats** (CLV / programs / logging %) — UI exists; backend lead detail does not expose fields
7. **Bulk segment send** — deferred; may not ship
