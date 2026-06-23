# CRM fake / mock data audit

> **TEMPORARY** — delete or archive after we have decided what to wire to real APIs.  
> Permanent integration plans live in [`meta-integrations-roadmap.md`](./meta-integrations-roadmap.md).

Last updated: 2026-06-23

---

## Active mocks (still imported by live views)

### Dashboard (`/`)

| Element                               | File                                     | Notes                                       |
| ------------------------------------- | ---------------------------------------- | ------------------------------------------- |
| KPI: Inquiry → Paid                   | `lib/mock/dashboard.ts` → `MOCK_KPIS[1]` | Fully fake                                  |
| KPI: Active members                   | `MOCK_KPIS[2]`                           | Fully fake                                  |
| KPI: Revenue (₹L)                     | `MOCK_KPIS[3]`                           | Fully fake                                  |
| KPI: Renewals at risk                 | `MOCK_KPIS[4]`                           | Fully fake                                  |
| KPI: New leads (7d) — **value**       | Real (`metaLeads7d`)                     | Only Meta-attributed leads, not all sources |
| KPI: New leads (7d) — sub/trend/spark | `MOCK_KPIS[0]`                           | Fake trend (`+15%`) and sparkline           |
| Funnel chart                          | `MOCK_FUNNEL`                            | Fully fake                                  |
| Comms health chart                    | `MOCK_COMMS_HEALTH`                      | Fully fake                                  |
| Revenue bar chart                     | `MOCK_REVENUE`                           | Fully fake                                  |
| Geography donut                       | `MOCK_GEO`                               | Fully fake                                  |
| Source performance table              | **Real API**                             | Empty until CSV import; CAC always `—`      |
| “Last 30 days” button                 | `source-performance-table.tsx`           | Decorative — no filter                      |
| “Export” / “View” buttons             | `source-performance-table.tsx`           | Not wired                                   |

### Communications (`/communications`)

| Element            | File                                        | Notes              |
| ------------------ | ------------------------------------------- | ------------------ |
| Rule builder rules | `lib/mock/communications.ts` → `MOCK_RULES` | Entire page mocked |
| Message templates  | `MOCK_TEMPLATES`                            | Entire page mocked |
| Campaign sequences | `MOCK_SEQUENCES`                            | Entire page mocked |

### Settings (`/settings`)

| Element                          | Location            | Notes                                         |
| -------------------------------- | ------------------- | --------------------------------------------- |
| Razorpay integration card status | `settings-view.tsx` | Hardcoded `status="connected"` — not verified |
| API key value                    | `settings-view.tsx` | Not shown (correct); only placeholder copy    |

---

## Hardcoded / non-functional UI (not from mock files)

| Screen        | Element                   | Issue                                     |
| ------------- | ------------------------- | ----------------------------------------- |
| Lead Database | “0 selected”              | Always 0 — selection not implemented      |
| Lead Database | “Message segment” button  | `disabled`                                |
| Lead Database | “Lookalike export (Meta)” | `disabled` — needs Marketing API          |
| Lead Intake   | Inbound log empty state   | No empty-state message when list is empty |
| Dashboard     | All KPI sparklines        | Static arrays from mock                   |

---

## Dead mock files (not imported — safe to delete later)

| File                      | Contents                                                          |
| ------------------------- | ----------------------------------------------------------------- |
| `lib/mock/lead-intake.ts` | `MOCK_INTEGRATIONS`, `MOCK_INBOUND_LOG`                           |
| `lib/mock/settings.ts`    | `MOCK_SETTINGS_INTEGRATIONS`, `MOCK_API_KEYS`, `MOCK_WEBHOOK_URL` |
| `lib/mock/customers.ts`   | `MOCK_CUSTOMERS`, `MOCK_TIMELINE`, `MOCK_PROGRAM_HISTORY`         |
| `lib/mock/staff.ts`       | `MOCK_STAFF`                                                      |
| `lib/mock/dashboard.ts`   | `MOCK_SOURCE_ROWS` (unused; table uses API)                       |

---

## Real data (for contrast)

| Screen                              | Source                                            |
| ----------------------------------- | ------------------------------------------------- |
| Lead Database list + summary        | `listLeads`, `getLeadSummary`                     |
| Lead Intake manual form             | `createManualLead` action                         |
| Lead Intake Meta card + inbound     | `getMetaIntegrationStatus`, `getMetaInboundLeads` |
| Customer 360                        | `getLead`, `getMemberEnrollments`                 |
| Customer 360 attribution card       | When `lead_attribution` row exists                |
| Settings webhook URL                | `PUBLIC_API_URL` on backend                       |
| Settings team tab                   | `listStaff`                                       |
| Programs, promos, renewals, cohorts | Real APIs (out of scope for this audit)           |
| Dashboard source performance        | `getSourcePerformance`                            |
| Dashboard Meta lead KPI number      | `getMetaIntegrationStatus`                        |

---

## Suggested prioritisation (for discussion — not decided)

1. **Dashboard KPIs** — wire from leads/enrollments/renewals aggregates (high visibility)
2. **Funnel chart** — lifecycle stage counts from `getLeadSummary` or dedicated query
3. **Razorpay card** — derive from env or health check
4. **Renewals at risk KPI** — likely already have renewal API
5. **Revenue / geo charts** — need billing/analytics endpoints
6. **Communications page** — large scope; likely last
7. **CAC column** — needs Meta Ads spend (native app section of roadmap)
8. **Delete dead mock files** — cleanup once dashboard is wired
