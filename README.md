# SBM CRM

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication (Supabase)

Copy `.env.example` to `.env.local` and set your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from Supabase Dashboard → Project Settings → API. Email/password auth must be enabled under Authentication → Providers.

### Manual test checklist

1. Visit `/` while logged out → redirects to `/login`
2. Submit invalid credentials → error shown below password field, inputs turn red
3. Submit valid credentials → redirects to `/`, session cookie set
4. Visit `/login` while authenticated → redirects to `/`

## Scripts

- `pnpm dev` — start the development server
- `pnpm build` — create a production build
- `pnpm start` — run the production server
- `pnpm lint` — run ESLint
- `pnpm format` — format the project with Prettier
- `pnpm format:check` — verify formatting without writing changes

## Auth-gated batch reports

CRM now includes a protected Reports section at `/reports` for serving static HTML report snapshots.

### Add/update a report snapshot

1. Generate the report in `sbm-better` (example output: `reports/batch-summary-*.html`).
2. Copy the HTML file into `sbm-crm/reports/`.
3. Register the file in `sbm-crm/reports/manifest.json` with:
   - `id` (URL-safe unique key)
   - `title`
   - `fileName`
   - `generatedOn`
   - optional `batchLabel`, `dateRangeLabel`

Once added, the report appears in CRM `/reports` and opens in a new tab at `/reports/{id}`.
Access is gated by CRM auth + CRM product entitlement.

## Git hooks

Husky runs the following hooks:

- **pre-commit** — `pnpm format:check` (commit fails if any file is not formatted)
- **pre-push** — `pnpm build` (push fails if the production build fails)
- **commit-msg** — validates the commit message with Commitlint

## Commit messages

Commits are validated by [Commitlint](https://commitlint.js.org/) via a Husky `commit-msg` hook.

Format:

```
<type>: <subject>
```

- **type** — one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **subject** — lowercase, imperative mood, no trailing period, no scope

Examples:

```
feat: add commitlint
fix: handle empty form submission
chore: update dependencies
```

Not allowed:

```
feat(scope): add commitlint   # no scope
Feat: add commitlint           # type must be lowercase
feat: Add commitlint           # subject must be lowercase
feat: add commitlint.          # no trailing period
```
