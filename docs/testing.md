# Testing guide

## Test layers

- Vitest unit tests cover money and cart totals, tax/shipping, quantity and password validation,
  catalogue filters, query serialization, and API error mapping.
- Playwright API tests exercise the running Hono/D1 application: registration, sessions, catalogue,
  cart/stock, checkout/idempotency, delivery, reviews, admin grid operations, tracking, cancellation,
  authorization, contact validation, and QA reset.
- Playwright browser tests cover the storefront regressions plus reviews, upload/retry, async
  selection, filters/history, dialogs/focus, scheduling, data grid/board, tracking/reconnection, QA
  simulations, UI Lab, direct refreshes and unexpected console errors.
- Mobile tests cover navigation, staged filter drawer behavior, calendar/dialog fit, mobile order
  cards and horizontal overflow at 390 px.
- Axe smoke tests scan public routes plus UI Lab, returns, and admin orders against WCAG A/AA rule
  tags.

## Commands

```bash
npm test
npm run test:coverage
npm run test:api
npm run test:e2e
npm run test:e2e:ui
```

Apply and seed local D1 before API or browser tests. Playwright starts Vite on `127.0.0.1:5173`.
Tests intentionally use accessible roles and labels, except for the cart badge, order number,
product grid, QA controls, and loading overlay where stable `data-testid` hooks remove ambiguity.
Set `PLAYWRIGHT_BASE_URL` to an absolute deployed URL only when intentionally testing a remote
environment; local execution is the default.

In CI, screenshots, video, and traces are retained only for failures. The HTML report is uploaded
when the workflow fails.

## Test values

- Account: `tester@testmart.demo` / `Test@12345`
- Approved card: `4111 1111 1111 1111`
- Declined card: `4000 0000 0000 0002`
- Expiry: any future month/year
- CVV: not requested or stored

## Isolation and reset

The suite runs one Playwright worker because the public demo account and local D1 binding are shared.
Tests call `POST /api/v1/qa/reset` before stateful workflows and do not depend on execution order.
Upload files are generated in memory; no fixture is sent externally. Browser QA configuration and
simulated admin status overrides are scoped to `sessionStorage`, so every new browser context starts
clean. Use `npm run db:reset:local` if manual development has changed deterministic D1 data.
