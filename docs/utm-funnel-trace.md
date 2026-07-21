# UTM funnel trace: Meta ads → interest form

**Date:** 2026-07-21

## Hostnames in production

| Property              | Host                       | Role                                                                               |
| --------------------- | -------------------------- | ---------------------------------------------------------------------------------- |
| Marketing / WordPress | `slowburnmethod.in`        | Ad landing pages, Gravity Forms interest page                                      |
| CRM intake forms app  | `forms.slowburnmethod.in`  | `sbm-forms` → `POST /public/intake-forms/{slug}/submit` → `source = interest_form` |
| Member portal         | `portal.slowburnmethod.in` | Register / enroll (separate attribution path)                                      |

## What Meta ad URLs target (`SBM_UTM_LINKS.csv`)

Example:

```text
https://slowburnmethod.in/sbm-take-control/?utm_source=META&utm_medium=CPC&utm_campaign=SALES&utm_term=3-MONTHS&utm_content=HEALTH_AND_FITNESS_AD-1
```

User lands on **WordPress** with UTMs in the address bar.

## Where “Register” buttons actually go (live HTML, Jul 2026)

From `slowburnmethod.in/sbm-take-control/`:

| CTA                 | Destination                                        | UTMs forwarded?                     |
| ------------------- | -------------------------------------------------- | ----------------------------------- |
| Interest / register | `slowburnmethod.in/take-control-interest-form/`    | **No** — Gravity Forms on WordPress |
| Program signup      | `portal.slowburnmethod.in/register`                | **No**                              |
| Trial / enroll      | `portal.slowburnmethod.in/enroll`, `/enroll/trial` | **No**                              |

**None of these point at `forms.slowburnmethod.in`.**

The WordPress interest page uses **Gravity Forms** (`gravityforms.min.js`). Submissions stay in WordPress — they do **not** flow through `sbm-forms` or `lead_attribution` unless separately integrated (no integration found in backend).

## Where CRM `interest_form` leads actually come from

| Form slug  | Title                          | 90d leads |
| ---------- | ------------------------------ | --------: |
| `ogl0jtxp` | SBM- Priority List (archived)  |       871 |
| `df76vbo6` | Know more about SBM!           |       181 |
| `dhhcfcfj` | Register your interest for SBM |        27 |

Public URLs: `https://forms.slowburnmethod.in/{slug}`

After Jul 8 UTM capture deploy, **153 / 233** post-deploy submissions have `utm_source=GRO` (Instagram/Facebook comment/story links) — proof that **sbm-forms capture works when users land on `forms.slowburnmethod.in` with query params**.

**Zero** post-deploy submissions have Meta CPC `utm_content` (e.g. `HEALTH_AND_FITNESS_AD-1`).

## Why `utm_content` is missing (not just cookie domain)

1. **Wrong funnel** — Meta CPC ads → WordPress landing → Gravity Form or portal. Never hits `sbm-forms`.
2. **No UTM passthrough** — WordPress CTAs drop query string when user navigates.
3. **Host-only cookie** — Even if user later opened `forms.slowburnmethod.in`, cookie set on `slowburnmethod.in` would not be visible (fixed in code: `Domain=.slowburnmethod.in`).
4. **Historical `utm_content` on interest_form** — All 27 rows are import/backfill (Jun 29), not live form capture.

## Recommended fixes (priority order)

### P0 — Marketing / WordPress (biggest impact)

1. **Forward UTMs on every CTA** from `/sbm-take-control/` (and similar landers):

   ```javascript
   // Append current query string to internal links
   document
     .querySelectorAll('a[href*="take-control-interest-form"], a[href*="portal.slowburnmethod.in"]')
     .forEach((a) => {
       const url = new URL(a.href);
       const params = new URLSearchParams(window.location.search);
       params.forEach((v, k) => {
         if (k.startsWith('utm_')) url.searchParams.set(k, v);
       });
       a.href = url.toString();
     });
   ```

2. **Or** point Meta ad final URLs directly at CRM forms with UTMs:

   ```text
   https://forms.slowburnmethod.in/dhhcfcfj?utm_source=META&utm_medium=CPC&...
   ```

3. **Replace or bridge Gravity Forms** — Either webhook WordPress submissions into SBM backend with UTMs, or replace embed with link/iframe to `forms.slowburnmethod.in`.

### P1 — Code (this repo)

- **Cross-subdomain cookie** — `Domain=.slowburnmethod.in` on `sbm_utm_first_touch` in `sbm-forms` and `sbm-user-portal` (implemented).
- **Remove `interest_form` filter** on Ad Performance SQL (separate P0 from audit).
- **Portal enroll links** — When WordPress passes UTMs, portal already captures on `/register` and enroll pages.

### P2 — Ops

- Update `SBM_UTM_LINKS.csv` / Meta ad URLs to match the funnel you want measured (forms app vs portal vs Meta Lead Ads).
- CRM “Copy form link” could offer “with UTM template” for staff sharing.

## Verification checklist

After WordPress + cookie deploy:

1. Open `slowburnmethod.in/sbm-take-control/?utm_content=TEST_AD-1`
2. Click through to `forms.slowburnmethod.in/df76vbo6` (or fixed CTA with UTMs)
3. Submit form → lead in CRM should have `utm_content=TEST_AD-1` on `interest_form` attribution
