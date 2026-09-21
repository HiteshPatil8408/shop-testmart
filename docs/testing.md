# Testing guide

## Test layers

- Vitest unit tests cover money and cart totals, tax/shipping, quantity and password validation,
  catalogue filters, query serialization, and API error mapping.
- Playwright API tests exercise the running Hono/D1 application: registration, duplicates, login,
  sessions, catalogue filters, cart merging and updates, stock checks, checkout preview, idempotent
  order creation, authorization, contact validation, and QA reset.
- Playwright browser tests cover the 18 requested storefront/account/checkout scenarios.
- Axe smoke tests scan the homepage, catalogue, product detail, contact, and login pages against
  WCAG A/AA rule tags.

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
