# Database design

TestMart uses Cloudflare D1 (SQLite) with foreign keys enabled. The initial migration is
[`migrations/0001_initial.sql`](../migrations/0001_initial.sql); deterministic catalogue and demo
account data live in [`seed/seed.sql`](../seed/seed.sql).

## Main relationships

- `categories` → `products` → `product_images`, `product_variants`, and
  `product_specifications`
- `users` → `sessions`, `addresses`, `carts`, and `orders`
- users created through registration have a mandatory security-question identifier and salted,
  one-way answer hash; plaintext recovery answers are never persisted
- `last_password_reset_at` enforces one security-question password reset per rolling 24 hours
- guest carts are identified by an unguessable HTTP-only `tm_guest` cookie; authenticated users
  have one cart enforced by a partial unique index
- `orders` own immutable `order_items` snapshots so a later catalogue edit cannot rewrite order
  history
- `payments` retain only method, test-card brand/last four, simulated reference, and status
- `idempotency_keys` bind one request hash to one order for safe checkout retries
- `contact_messages` persist only explicitly submitted demo form content

All prices and totals are integer paise. Checkout reads current catalogue rows, validates variant
stock, recalculates totals server-side, and commits the order, payment, snapshots, stock updates,
cart clear, and idempotency record through one D1 batch transaction.

## Local lifecycle

```bash
npm run db:migrate:local
npm run db:seed:local
npm run db:reset:local
```

`db:reset:local` deletes application rows in foreign-key-safe order and reapplies the deterministic
seed. The in-app QA reset is narrower: it clears the current cart and restores stock for orders
owned by the current user.

## Remote lifecycle

Create the database, copy its UUID into `wrangler.jsonc`, then run:

```bash
npx wrangler d1 create testmart
npm run db:migrate:remote
npm run db:seed:remote
```

Back up production-like demo data before destructive maintenance. Never run `seed/reset.sql`
against a remote binding unless the entire remote demo dataset is intentionally being reset.
