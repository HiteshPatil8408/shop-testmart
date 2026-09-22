ALTER TABLE orders ADD COLUMN delivery_date TEXT;
ALTER TABLE orders ADD COLUMN delivery_time_slot TEXT;
ALTER TABLE orders ADD COLUMN cancelled_at TEXT;

CREATE TABLE product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 4 AND 80),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 20 AND 1000),
  seeded INTEGER NOT NULL DEFAULT 0 CHECK (seeded IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_product_reviews_product_created
  ON product_reviews(product_id, created_at DESC);
CREATE UNIQUE INDEX idx_product_reviews_user_product
  ON product_reviews(user_id, product_id)
  WHERE user_id IS NOT NULL;

CREATE TABLE review_helpful_votes (
  review_id TEXT NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id, user_id)
);

CREATE TABLE admin_demo_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'pending', 'refunded')),
  total_paise INTEGER NOT NULL CHECK (total_paise >= 0),
  item_count INTEGER NOT NULL CHECK (item_count BETWEEN 1 AND 20),
  order_date TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('web', 'mobile', 'support')),
  priority TEXT NOT NULL CHECK (priority IN ('normal', 'priority')),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_admin_demo_orders_date ON admin_demo_orders(order_date DESC);
CREATE INDEX idx_admin_demo_orders_status ON admin_demo_orders(status);
