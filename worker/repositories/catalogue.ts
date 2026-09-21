import type { D1Result } from '@cloudflare/workers-types';
import type { Product } from '../../shared/types';

type ProductRow = Record<string, any>;

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    manufacturer: row.manufacturer,
    categoryId: row.category_id,
    category: row.category_slug,
    categoryName: row.category_name,
    shortDescription: row.short_description,
    description: row.description,
    pricePaise: row.price_paise,
    originalPricePaise: row.original_price_paise,
    rating: row.rating,
    reviewCount: row.review_count,
    stock: row.stock_quantity,
    featured: Boolean(row.featured),
    popular: Boolean(row.popular),
    keywords: String(row.keywords).split(' ').filter(Boolean),
    images: [],
    variants: [],
    specifications: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function hydrateProducts(db: D1Database, rows: ProductRow[]): Promise<Product[]> {
  if (!rows.length) return [];
  const products = rows.map(mapProduct);
  const placeholders = rows.map(() => '?').join(',');
  const ids = rows.map((row) => row.id);
  const [images, variants, variantImages, specifications] = (await db.batch([
    db
      .prepare(
        `SELECT product_id, url FROM product_images WHERE product_id IN (${placeholders}) ORDER BY sort_order`,
      )
      .bind(...ids),
    db
      .prepare(
        `SELECT id, product_id, colour, colour_hex, stock_quantity FROM product_variants WHERE product_id IN (${placeholders}) ORDER BY colour`,
      )
      .bind(...ids),
    db
      .prepare(
        `SELECT vi.variant_id, vi.url FROM variant_images vi
         JOIN product_variants pv ON pv.id = vi.variant_id
         WHERE pv.product_id IN (${placeholders}) ORDER BY vi.sort_order`,
      )
      .bind(...ids),
    db
      .prepare(
        `SELECT product_id, name, value FROM product_specifications WHERE product_id IN (${placeholders}) ORDER BY sort_order`,
      )
      .bind(...ids),
  ])) as D1Result<any>[];
  const productMap = new Map(products.map((product) => [product.id, product]));
  images.results.forEach((row) => productMap.get(row.product_id)?.images.push(row.url));
  const variantMap = new Map<string, Product['variants'][number]>();
  variants.results.forEach((row) => {
    const variant = {
      id: row.id,
      colour: row.colour,
      colourHex: row.colour_hex,
      stock: row.stock_quantity,
      images: [],
    };
    productMap.get(row.product_id)?.variants.push(variant);
    variantMap.set(row.id, variant);
  });
  variantImages.results.forEach((row) => variantMap.get(row.variant_id)?.images.push(row.url));
  products.forEach((product) => {
    const defaultImages = product.variants[0]?.images;
    if (defaultImages?.length) product.images = [...defaultImages];
  });
  specifications.results.forEach((row) =>
    productMap.get(row.product_id)?.specifications.push({ name: row.name, value: row.value }),
  );
  return products;
}

const productSelect = `SELECT p.*, c.slug AS category_slug, c.name AS category_name
  FROM products p JOIN categories c ON c.id = p.category_id`;

export async function getProductBySlug(db: D1Database, slug: string) {
  const row = await db.prepare(`${productSelect} WHERE p.slug = ?`).bind(slug).first<ProductRow>();
  return row ? (await hydrateProducts(db, [row]))[0] : null;
}

export async function getProductsByIds(db: D1Database, ids: string[]) {
  if (!ids.length) return [];
  const rows = await db
    .prepare(`${productSelect} WHERE p.id IN (${ids.map(() => '?').join(',')})`)
    .bind(...ids)
    .all<ProductRow>();
  return hydrateProducts(db, rows.results);
}

export interface CatalogueQuery {
  q?: string;
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  colours?: string[];
  inStock?: boolean;
  minRating?: number;
  specification?: string;
  featured?: boolean;
  popular?: boolean;
  page: number;
  pageSize: number;
}

export async function queryProducts(db: D1Database, query: CatalogueQuery) {
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (query.q) {
    conditions.push(
      `(lower(p.name) LIKE ? OR lower(p.manufacturer) LIKE ? OR lower(p.short_description) LIKE ? OR lower(c.name) LIKE ? OR lower(p.keywords) LIKE ?)`,
    );
    const search = `%${query.q.toLowerCase()}%`;
    bindings.push(search, search, search, search, search);
  }
  if (query.category) {
    conditions.push('c.slug = ?');
    bindings.push(query.category);
  }
  if (query.minPrice !== undefined) {
    conditions.push('p.price_paise >= ?');
    bindings.push(query.minPrice);
  }
  if (query.maxPrice !== undefined) {
    conditions.push('p.price_paise <= ?');
    bindings.push(query.maxPrice);
  }
  if (query.inStock) conditions.push('p.stock_quantity > 0');
  if (query.minRating) {
    conditions.push('p.rating >= ?');
    bindings.push(query.minRating);
  }
  if (query.specification) {
    conditions.push(
      'EXISTS (SELECT 1 FROM product_specifications ps WHERE ps.product_id = p.id AND lower(ps.value) LIKE ?)',
    );
    bindings.push(`%${query.specification.toLowerCase()}%`);
  }
  if (query.featured) conditions.push('p.featured = 1');
  if (query.popular) conditions.push('p.popular = 1');
  if (query.colours?.length) {
    conditions.push(
      `EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND lower(v.colour) IN (${query.colours.map(() => '?').join(',')}))`,
    );
    bindings.push(...query.colours.map((colour) => colour.toLowerCase()));
  }
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const sort: Record<string, string> = {
    newest: 'p.created_at DESC, p.slug',
    price_asc: 'p.price_paise ASC, p.slug',
    price_desc: 'p.price_paise DESC, p.slug',
    rating: 'p.rating DESC, p.review_count DESC, p.slug',
    relevance: query.q
      ? 'CASE WHEN lower(p.name) LIKE ? THEN 0 ELSE 1 END, p.popular DESC, p.slug'
      : 'p.popular DESC, p.slug',
  };
  const order = sort[query.sort ?? 'relevance'] ?? sort.relevance;
  const offset = (query.page - 1) * query.pageSize;
  const resultBindings = [...bindings];
  if ((query.sort ?? 'relevance') === 'relevance' && query.q)
    resultBindings.push(`%${query.q.toLowerCase()}%`);
  resultBindings.push(query.pageSize, offset);
  const [rows, count] = await Promise.all([
    db
      .prepare(`${productSelect}${where} ORDER BY ${order} LIMIT ? OFFSET ?`)
      .bind(...resultBindings)
      .all<ProductRow>(),
    db
      .prepare(
        `SELECT count(*) AS total FROM products p JOIN categories c ON c.id = p.category_id${where}`,
      )
      .bind(...bindings)
      .first<{ total: number }>(),
  ]);
  return { products: await hydrateProducts(db, rows.results), total: count?.total ?? 0 };
}
