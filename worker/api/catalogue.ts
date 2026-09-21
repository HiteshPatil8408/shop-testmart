import { Hono } from 'hono';
import { getProductBySlug, queryProducts } from '../repositories/catalogue';
import { fail, ok } from '../lib/response';
import type { AppBindings } from '../types';

export const catalogue = new Hono<AppBindings>();

catalogue.get('/categories', async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT c.id, c.slug, c.name, c.description, c.image, count(p.id) AS product_count
     FROM categories c LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id ORDER BY c.sort_order`,
  ).all<any>();
  return ok(
    c,
    result.results.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      image: row.image,
      productCount: row.product_count,
    })),
  );
});

catalogue.get('/products', async (c) => {
  const page = Math.max(1, Number(c.req.query('page')) || 1);
  const pageSize = Math.min(24, Math.max(1, Number(c.req.query('pageSize')) || 12));
  const maxPriceRupees = Number(c.req.query('maxPrice'));
  const minPriceRupees = Number(c.req.query('minPrice'));
  const result = await queryProducts(c.env.DB, {
    q: c.req.query('q')?.trim(),
    category: c.req.query('category'),
    sort: c.req.query('sort'),
    minPrice: Number.isFinite(minPriceRupees) ? minPriceRupees * 100 : undefined,
    maxPrice: Number.isFinite(maxPriceRupees) ? maxPriceRupees * 100 : undefined,
    colours: c.req.queries('colour'),
    inStock: c.req.query('inStock') === '1',
    minRating: Number(c.req.query('rating')) || undefined,
    specification: c.req.query('spec'),
    featured: c.req.query('featured') === '1',
    popular: c.req.query('popular') === '1',
    page,
    pageSize,
  });
  if (c.req.header('X-QA-Low-Stock') === '1')
    result.products.forEach((product) => {
      product.stock = Math.min(1, product.stock);
      product.variants.forEach((variant) => (variant.stock = Math.min(1, variant.stock)));
    });
  return ok(c, result.products, {
    pagination: { page, pageSize, total: result.total, pages: Math.ceil(result.total / pageSize) },
  });
});

catalogue.get('/products/:slug', async (c) => {
  const product = await getProductBySlug(c.env.DB, c.req.param('slug'));
  if (!product) return fail(c, 404, 'PRODUCT_NOT_FOUND', 'That product could not be found.');
  if (c.req.header('X-QA-Low-Stock') === '1') {
    product.stock = Math.min(1, product.stock);
    product.variants.forEach((variant) => (variant.stock = Math.min(1, variant.stock)));
  }
  const related = await queryProducts(c.env.DB, {
    category: product.category,
    page: 1,
    pageSize: 5,
  });
  return ok(c, {
    product,
    related: related.products.filter((item) => item.id !== product.id).slice(0, 4),
  });
});

catalogue.get('/search/suggestions', async (c) => {
  const q = c.req.query('q')?.trim() ?? '';
  if (q.length < 2 || c.req.header('X-QA-Empty-Search') === '1') return ok(c, []);
  const result = await queryProducts(c.env.DB, { q, page: 1, pageSize: 6 });
  return ok(
    c,
    result.products.map(({ id, slug, name, categoryName, pricePaise, images }) => ({
      id,
      slug,
      name,
      categoryName,
      pricePaise,
      image: images[0],
    })),
  );
});
