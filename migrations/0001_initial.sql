PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  marketing_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (marketing_opt_in IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_addresses_user_id ON addresses(user_id);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  price_paise INTEGER NOT NULL CHECK (price_paise >= 0),
  original_price_paise INTEGER CHECK (original_price_paise >= price_paise),
  rating REAL NOT NULL CHECK (rating BETWEEN 0 AND 5),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  popular INTEGER NOT NULL DEFAULT 0 CHECK (popular IN (0, 1)),
  keywords TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(price_paise);
CREATE INDEX idx_products_rating ON products(rating DESC);
CREATE INDEX idx_products_flags ON products(featured, popular);

CREATE TABLE product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, sort_order)
);

CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  colour TEXT NOT NULL,
  colour_hex TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
  UNIQUE(product_id, colour)
);
CREATE INDEX idx_variants_product ON product_variants(product_id);

CREATE TABLE product_specifications (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, name)
);

CREATE TABLE carts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  guest_token TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (user_id IS NOT NULL OR guest_token IS NOT NULL)
);
CREATE UNIQUE INDEX idx_carts_user ON carts(user_id) WHERE user_id IS NOT NULL;

CREATE TABLE cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  variant_id TEXT NOT NULL REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cart_id, product_id, variant_id)
);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  delivery_method TEXT NOT NULL,
  delivery_address_json TEXT NOT NULL,
  subtotal_paise INTEGER NOT NULL,
  shipping_paise INTEGER NOT NULL,
  tax_paise INTEGER NOT NULL,
  total_paise INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  variant_colour TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_paise INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL,
  card_brand TEXT,
  last_four TEXT,
  transaction_reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_messages (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  product_id TEXT REFERENCES products(id),
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE idempotency_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id),
  request_hash TEXT NOT NULL,
  response_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, id)
);

CREATE TABLE qa_states (
  id TEXT PRIMARY KEY,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  force_status INTEGER,
  empty_search INTEGER NOT NULL DEFAULT 0,
  low_stock INTEGER NOT NULL DEFAULT 0,
  payment_decline INTEGER NOT NULL DEFAULT 0,
  session_expired INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
