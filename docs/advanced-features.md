# Advanced automation features

This guide indexes TestMart's advanced, deterministic practice surfaces. The original architecture
remains React/Router/Context on the client and Hono/D1 on the same-origin Worker; no runtime
dependency was added.

## Routes

| Route                  | Access                      | Practice surface                                                                           |
| ---------------------- | --------------------------- | ------------------------------------------------------------------------------------------ |
| `/admin/orders`        | Signed in                   | Server-filtered data grid, responsive cards, bulk actions, CSV and status Kanban           |
| `/returns`             | Signed in                   | Async product multi-select, browser-memory files, upload failure/retry and unsaved warning |
| `/ui-lab`              | Public                      | Isolated advanced browser and component interactions                                       |
| `/products/:slug`      | Public; mutations signed in | Review summary/list/filter/sort plus own-review CRUD/helpful voting                        |
| `/checkout`            | Signed in with cart         | Keyboard calendar, deterministic availability and time slots                               |
| `/orders/:orderNumber` | Order owner                 | Buffered/idempotent tracking stream and cancellable-order dialog                           |

Protected practice routes redirect to login with `returnTo`. Direct navigation and refresh continue
to use Cloudflare Assets' SPA fallback. `/admin/orders` and `/returns` are `noindex`; `/ui-lab` is in
the generated sitemap.

## APIs and data

- `GET|POST /api/v1/products/:productId/reviews`
- `PATCH|DELETE /api/v1/reviews/:id`; `POST /api/v1/reviews/:id/helpful`
- `GET /api/v1/admin/orders` and `/admin/orders/export`
- `PATCH /api/v1/admin/orders/:id`; `POST /api/v1/admin/orders/bulk-status`
- `GET /api/v1/orders/:orderNumber/tracking`; `POST /api/v1/orders/:orderNumber/cancel`

Admin list filtering, sorting and pagination are server-backed. Status mutations return validated,
safe simulated responses; the UI persists optimistic results only in the current browser session.
Tracking deliberately returns one duplicate and one out-of-order event so the client can demonstrate
de-duplication and sequence buffering. Order delivery date/time fields are optional for backward API
compatibility, but when supplied must be a complete, available pair.

Migration `0006_advanced_practice.sql` adds nullable delivery/cancellation fields, review/vote
tables, and the isolated admin fixture table. The seed contains 24 admin rows and five public reviews.
`POST /api/v1/qa/reset` removes the signed-in user's orders, cart, reviews and votes while retaining
the seed baseline.

## Dialog and accessibility decisions

`Modal` uses the native top-layer `<dialog>` for background inertness and focus containment. It
supports explicit initial focus, Escape/backdrop policy, busy locking and trigger focus return.
`ConfirmDialog` adds pending, failure/retry and success phases. Cart removal/clear, address deletion,
order cancellation, review deletion and unsaved returns use this system.

Controls expose native roles and labels, live regions announce async results, calendar cells support
arrow/Home/End/Page Up/Page Down navigation, and drag-and-drop has a labelled status selector as its
keyboard/touch alternative. Reduced-motion CSS disables non-essential movement. The table switches
to labelled order cards on narrow screens; filter changes are staged in the mobile drawer.

## QA laboratory

QA Lab settings affect only the current `sessionStorage` context. Existing latency, forced HTTP
status, empty search, low stock, payment decline, session expiry and offline controls remain. Added
scenarios are:

- upload failure and slow upload
- review submission failure and duplicate submission
- server validation response
- delayed order events and connection loss/retry
- optimistic-update rejection/rollback
- empty table and 240-row large dataset
- expired cart, changed price and changed stock
- delivery slot becoming unavailable
- one-time or persistent failure duration

`Clear simulations` restores normal behavior. `Reset demo data` also calls the scoped server reset.

## UI Laboratory index

Each `/ui-lab` card names its intended test skill and has an example reset. Sections include tooltip,
popover, nested menu, tabs, accordion, toast, reusable/native dialogs, contenteditable, clipboard,
downloads/CSV, print, context menu, keyboard shortcut, simulated permission prompt, infinite loading,
virtualized rows, same-origin iframe, open/closed Shadow DOM, delayed/enabled content, optimistic undo,
skeleton, empty and retry states.

## Safe limitations

- Files and previews remain in browser memory and disappear on navigation; nothing is uploaded.
- Tracking uses a deterministic interval over an authenticated event fixture, not a real courier or
  long-lived WebSocket.
- Admin updates are intentionally session-scoped simulations and never modify real order history.
- Native alert/confirm/prompt and closed Shadow DOM examples exist only in UI Lab.
- The optional static GitHub Pages preview remains browser-local; its CSV contains the currently
  loaded admin rows. Worker/D1 deployment exports every filtered row.
- Demo IDs, addresses, reviews, payments and customer names are fictional. No real notification,
  permission, payment, fulfilment or external upload service is contacted.
