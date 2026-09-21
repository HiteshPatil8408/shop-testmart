CREATE TABLE variant_images (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(variant_id, sort_order)
);

CREATE INDEX idx_variant_images_variant ON variant_images(variant_id);
