# TestMart

TestMart is a full-stack ecommerce practice application for QA engineers learning Playwright,
API automation, accessibility testing, and realistic failure handling. It is an original product,
not a visual or content copy of another store.

> **Demo application — do not enter real personal or payment information.** Payments are fully
> simulated. No card number, CVV, or real financial transaction is sent to a payment provider.

The product name and shared business constants are centralized in
[`shared/config.ts`](shared/config.ts).

## UI overview

The interface uses near-white surfaces, navy typography, a teal action colour, warm promotional
accents, visible focus states, and responsive layouts from 360 px through 1440 px. Core surfaces
include:

- accessible hero carousel, category discovery, offers, popular products, benefits, and contact CTA
- debounced custom search combobox with keyboard navigation and URL-preserved results
- filterable/sortable/paginated catalogue in grid and list modes
- product gallery, variants, quantity boundaries, specifications, delivery details, and related items
- guest/authenticated cart, mini-cart, variant editing, totals, and confirmation dialog
- registration, login/logout, email-code password recovery, profile, saved addresses, orders, and
  protected routes
- seven-step checkout with server totals, documented test methods, declines, and confirmation
- contact persistence, in-app OpenAPI reference, and a session-scoped QA laboratory

All product illustrations are original local SVG assets in `public/images`; tests do not depend on
third-party image availability.

## Architecture

```text
Browser (React 19 + Router + Context)
          │ same origin /api/v1
          ▼
Cloudflare Worker (Hono + Zod + Web Crypto)
          │ parameterized SQL / atomic D1 batches
          ▼
Cloudflare D1 (SQLite)
```

Vite and `@cloudflare/vite-plugin` build the React client and Worker together. Cloudflare Assets
serves compiled files; `not_found_handling: "single-page-application"` preserves direct refreshes
on nested routes. API calls, static assets, sessions, and the SPA share one origin.

Passwords use PBKDF2-SHA-256 with a unique 16-byte salt and 210,000 iterations. Signed opaque
session IDs are stored in HTTP-only, SameSite=Lax cookies; production cookies are Secure. The
Worker validates input server-side, parameterizes SQL, rejects cross-origin mutations, limits body
size and sensitive endpoint bursts, emits security headers, and never logs passwords, cookies, or
payment values.

## Technology

- React 19, TypeScript strict mode, Vite, React Router, native fetch, plain CSS
- Hono Worker, Cloudflare D1, Web Crypto, Zod
- Vitest, React Testing Library, Playwright, `@axe-core/playwright`
- ESLint, Prettier, GitHub Actions, Wrangler

## Repository map

```text
src/                    React application, feature routes, components, contexts, tests
worker/                 Hono routes, middleware, repositories, crypto and OpenAPI
shared/                 Config, schemas, money/query/filter utilities, shared types
migrations/             Versioned D1 schema
seed/                   Deterministic seed and local reset SQL
public/images/           Local original catalogue illustrations
tests/api/               Playwright HTTP contract/integration tests
tests/e2e/               Desktop, mobile, keyboard and checkout browser tests
tests/accessibility/     Axe WCAG smoke tests
docs/                    Database and testing guides
.github/workflows/       CI, Cloudflare deploy, optional Pages preview
```

## Prerequisites

- Node.js 24 or newer
- npm 10 or newer
- a Cloudflare account only for remote D1/deployment

## Local setup

```bash
npm install
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Open <http://127.0.0.1:5173>. Local development uses a documented fallback signing secret; do not
use that fallback in deployment.

Copy `.env.example` to `.dev.vars` and set a private local secret if desired:

```text
SESSION_SECRET=a-long-random-development-value
APP_ENV=development
```

Registration requires a security question and answer. The normalized answer is stored only as a
salted one-way hash and is used for password recovery. A successful recovery is limited to once
per rolling 24 hours and revokes every existing session. The public demo account is excluded from
both password recovery and signed-in password changes. Signed-in non-demo users can still change
their password or replace their recovery question by confirming the current password. This also
lets accounts created before the security-question migration enrol recovery details.

## Demo account and payments

Public demo account (contains no personal information):

```text
Email: tester@testmart.demo
Password: Test@12345
```

Test cards:

```text
Approved: 4111 1111 1111 1111
Declined: 4000 0000 0000 0002
Expiry:   any future month and year
CVV:      not requested
```

The database persists only payment type, fictional brand, last four digits, simulated transaction
reference, and status. Cash on delivery and demo wallet are also simulations.

## Commands

| Command                           | Purpose                                               |
| --------------------------------- | ----------------------------------------------------- |
| `npm run dev`                     | Run React and the local Worker/D1 environment         |
| `npm run build`                   | Build the production Worker and client                |
| `npm run build:pages`             | Build isolated browser-local GitHub Pages preview     |
| `npm run preview`                 | Preview a build                                       |
| `npm run lint`                    | Run ESLint with zero warnings                         |
| `npm run format` / `format:check` | Write/check Prettier formatting                       |
| `npm run typecheck`               | Run strict TypeScript checking                        |
| `npm test`                        | Run Vitest unit tests                                 |
| `npm run test:coverage`           | Generate unit coverage                                |
| `npm run test:api`                | Run live Worker/D1 API tests                          |
| `npm run test:e2e`                | Run API, Chromium, mobile, and accessibility projects |
| `npm run db:migrate:local`        | Apply local D1 migrations                             |
| `npm run db:seed:local`           | Load deterministic products and demo user             |
| `npm run db:reset:local`          | Clear and reseed local D1 data                        |
| `npm run db:migrate:remote`       | Apply migrations to remote D1                         |
| `npm run db:seed:remote`          | Seed remote D1 intentionally                          |
| `npm run deploy`                  | Build and deploy with Wrangler                        |

See [database design](docs/database.md) and the [testing guide](docs/testing.md).

## API

Versioned JSON routes live under `/api/v1`; the OpenAPI 3.1 document is available at
`/api/openapi.json`, with a browsable page at `/api-docs`.

Success responses use:

```json
{ "data": {}, "meta": { "requestId": "..." } }
```

Errors use:

```json
{
  "error": { "code": "OUT_OF_STOCK", "message": "The requested quantity is unavailable." },
  "meta": { "requestId": "..." }
}
```

Order creation requires an `Idempotency-Key` header. Prices and stock are always re-read and
totals recalculated by the Worker; browser prices are never trusted.

## QA laboratory

QA Lab is automatically available locally or can be enabled with `?qa=1`. It supports 0/500/1500/
3000 ms latency, one-shot 400/401/403/404/409/429/500 responses, empty search, payment decline,
offline UI, and a current-session reset. Client simulation settings are held in `sessionStorage`;
the normal experience is deterministic when the panel is disabled.

Prefer roles, names, labels, and visible text in Playwright. Stable test IDs exist only for the cart
badge, product grid, price summary, toast area, loading overlay, order number, and QA controls.

## Cloudflare D1 and deployment

1. Authenticate the CLI: `npx wrangler login`.
2. Create D1: `npx wrangler d1 create testmart`.
3. Replace the placeholder `database_id` in `wrangler.jsonc` with the returned UUID.
4. Create a strong signing secret:
   `npx wrangler secret put SESSION_SECRET`.
5. Keep the committed `APP_ENV=production` value; local HTTP is detected so local cookies remain usable.
6. Run `npm run db:migrate:remote` and, for a new demo only, `npm run db:seed:remote`.
7. Run `npm run deploy`.

No remote deployment is performed by this repository alone. The placeholder D1 UUID is suitable
for local development only.

### GitHub Actions secrets

Create a `production` environment under **Repository settings → Environments**. Restrict it to the
`main` branch and optionally require approval. Add these environment secrets:

- `CLOUDFLARE_API_TOKEN`: a scoped token allowed to edit Workers and D1
- `CLOUDFLARE_ACCOUNT_ID`: the target Cloudflare account ID
- `SESSION_SECRET`: at least 32 random characters used to sign authenticated sessions

Generate the session secret locally with `openssl rand -hex 32`, then paste the result directly into
the GitHub environment secret. Do not put it in a committed file.

The main-branch workflow validates all three secrets, runs the complete CI command, applies pending
remote D1 migrations, and deploys `shop` with `SESSION_SECRET` from an ephemeral file inside the
GitHub-hosted runner. That file is deleted even if deployment fails. A production smoke test then
verifies the homepage, API contract, session creation, and logout. Never commit any secret value.

## Optional GitHub Pages preview

GitHub Pages cannot run Workers or D1. The manual `GitHub Pages Preview` workflow therefore builds
with `.env.pages`, a `/TestMart/` Vite base, and `HashRouter`. It uses the same 30 committed catalogue
records; auth, cart, addresses, checkout, orders, and contact are visibly labelled browser-local
simulations stored in `localStorage`. Security-question recovery is also simulated locally. It does
not weaken or replace the Cloudflare architecture.

If the GitHub repository is not named `TestMart`, update the Pages base in `vite.config.ts`. Enable
Pages with **GitHub Actions** as its source, then manually run the Pages workflow.

## Environment values

| Name                    | Required         | Notes                                                      |
| ----------------------- | ---------------- | ---------------------------------------------------------- |
| `SESSION_SECRET`        | production       | At least 32 random characters; store with Wrangler secrets |
| `APP_ENV`               | recommended      | Use `production` to enforce Secure session cookies         |
| `VITE_STATIC_PREVIEW`   | Pages build only | Set by `.env.pages`; never use for Cloudflare deployment   |
| `CLOUDFLARE_API_TOKEN`  | CI deploy        | GitHub secret, not a Worker variable                       |
| `CLOUDFLARE_ACCOUNT_ID` | CI deploy        | GitHub secret, not a Worker variable                       |

## Troubleshooting

- **D1 says a table is missing:** run `npm run db:migrate:local`, then seed.
- **Seed reports unique conflicts:** use `npm run db:reset:local` for a clean local dataset.
- **Password recovery is rejected:** confirm the same question and answer used at registration.
  Recovery is limited to once every 24 hours and is never available for the public demo account.
- **Playwright browser is missing:** run `npx playwright install chromium`.
- **A nested route returns 404 remotely:** confirm `assets.not_found_handling` remains
  `single-page-application` and deployment used the Worker build.
- **Remote commands target the placeholder UUID:** create D1 and update `wrangler.jsonc` first.
- **Latest packages reject an older Node runtime:** use Node 24, matching CI.

## Intentional demo limitations

- No real payment provider, CVV, tax jurisdiction service, fulfilment, inventory integration, or
  transactional email integration exists.
- In-memory rate limits are isolate-local; a production commerce system should use a distributed
  limiter.
- Product illustrations are purpose-built SVG scenes, not merchandise photography.
- QA controls are intended for a public practice environment, not a real shop.
- GitHub Pages mode is a labelled browser-local approximation; Cloudflare Worker + D1 is the
  required production-style architecture.
