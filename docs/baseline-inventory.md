# TestMart baseline inventory

Recorded on 2026-09-22 before the comprehensive practice-platform upgrade.

## Quality baseline

- `npm run format:check`: pass
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm test`: 7 files and 22 tests pass
- `npm run build`: pass (Worker and browser bundles)
- Only observed warning: Node's transitive `punycode` deprecation warning during Vitest/build

## Existing architecture

- React 19 + React Router SPA, with a `HashRouter` browser-local preview build.
- Hono API Worker under `/api/v1`, with consistent `data/meta` and `error/meta` envelopes.
- Cloudflare D1 schema managed by ordered SQL migrations and deterministic seed/reset scripts.
- Signed opaque, HTTP-only session cookies and a separate HTTP-only guest-cart cookie.
- Zod validation shared by the Worker; prices and calculations use integer paise.
- Plain CSS design system with responsive breakpoints, focus styles, reduced-motion support, loading
  skeletons, alerts, empty states, and toasts.

## Existing user journeys

- Home promotions, accessible carousel controls, category discovery, offers, popular products.
- Debounced search combobox with keyboard suggestions.
- Catalogue category routes, query search, server filters/sort/pagination, grid/list views, URL state,
  basic active chips, and an immediate-apply mobile filter drawer.
- Product gallery, colour variants, stock-aware quantity, information tabs, related products.
- Guest and authenticated carts, cart merge at authentication, mini-cart, quantity/variant updates,
  clear confirmation, and server totals.
- Registration, login/logout, security-question password recovery, protected-route return, profile,
  saved addresses, and non-demo password/security changes.
- Seven-step simulated checkout, server preview, idempotent order creation, payment decline, order
  confirmation/history/detail, and safe demo payment methods.
- Dependent-field contact form, OpenAPI JSON/browser view, and SPA direct-route fallback.
- Session-scoped QA controls for latency, forced HTTP status, empty search, low stock, payment
  decline, session expiry, offline mode, simulation clear, and current-account/cart reset.

## Existing data and contracts

- Five categories, 30 products, 60 colour variants, and 120 local variant images.
- One public demo user and one deterministic address; no seeded orders or reviews.
- Core route/product identifiers and existing API response shapes are stable and must be preserved.
- D1 migrations `0001` through `0005` cover commerce, variant images, and account recovery.

## Existing automated coverage

- Unit coverage for money, query serialization, local product filters, schemas, crypto, API errors,
  and SEO metadata.
- Playwright API coverage for auth, password/security, account/address lifecycle, catalogue, images,
  cart, checkout/idempotency, authorization, contact, and QA reset.
- Browser coverage for home/navigation, menus, search keyboard flow, filters, product/gallery/cart,
  registration, auth, contact, protected routes, direct refresh, checkout/decline, orders, mobile
  navigation, and Axe smoke scans.

## Confirmed upgrade gaps

- No admin data grid or status Kanban; no review persistence; no return/file-upload workflow.
- Checkout has no calendar or time-slot selection.
- Dialog use is inconsistent (address deletion still uses native confirm; cart-item removal has none),
  and there is no async confirmation state or unsaved-form warning.
- Catalogue needs staged mobile apply/cancel, price-range validation, applied count, announcements,
  saved preset, and stronger no-result recovery.
- Order detail has no live tracking stream or cancellation workflow.
- QA Lab has only the original seven simulations and there is no dedicated UI Lab.
