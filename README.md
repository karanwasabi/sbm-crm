# SBM CRM

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `pnpm dev` — start the development server
- `pnpm build` — create a production build
- `pnpm start` — run the production server
- `pnpm lint` — run ESLint
- `pnpm format` — format the project with Prettier
- `pnpm format:check` — verify formatting without writing changes

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
