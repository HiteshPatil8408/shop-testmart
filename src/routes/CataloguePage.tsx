import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Product } from '../../shared/types';
import { EmptyState, ErrorState, LoadingGrid } from '../components/Feedback';
import { Pagination } from '../components/Pagination';
import { ProductCard } from '../components/ProductCard';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { apiEnvelope } from '../lib/api';

interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
}

const categoryNames: Record<string, string> = {
  laptops: 'Laptops',
  tablets: 'Tablets',
  headphones: 'Headphones',
  speakers: 'Speakers',
  mice: 'Mice',
};

export function CataloguePage() {
  const { category } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const activeCategory = category ?? params.get('category') ?? '';
  const query = params.get('q') ?? '';
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ page: 1, pageSize: 12, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mobileFilters, setMobileFilters] = useState(false);
  const pageTitle = query
    ? `Search: ${query}`
    : activeCategory
      ? categoryNames[activeCategory]
      : 'All products';
  useDocumentTitle(pageTitle, {
    canonicalPath: category ? `/category/${category}` : '/products',
    description: activeCategory
      ? `Practise ecommerce UI testing with the ${categoryNames[activeCategory]?.toLowerCase() ?? activeCategory} catalogue, filters, sorting, product details and cart flows.`
      : 'Explore deterministic products for practising ecommerce search, filters, sorting, product details and cart automation.',
    noIndex: Boolean(query),
  });
  const update = (name: string, value?: string, append = false) => {
    const next = new URLSearchParams(params);
    if (!append) next.delete(name);
    if (value) {
      if (append) next.append(name, value);
      else next.set(name, value);
    }
    if (name !== 'page') next.delete('page');
    navigate(`${location.pathname}?${next.toString()}`);
  };
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiParams = new URLSearchParams(params);
      if (category) apiParams.set('category', category);
      const body = await apiEnvelope<Product[]>(`/products?${apiParams}`);
      setProducts(body.data);
      setMeta(body.meta.pagination as PageMeta);
    } catch (reason) {
      setError(reason instanceof Error ? reason : new Error('Unable to load products.'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => void fetchProducts(), [location.search, category]); // eslint-disable-line react-hooks/exhaustive-deps
  const colours = params.getAll('colour');
  const filters = (
    <div className="filters__body">
      <div className="filter-heading">
        <h2>Filters</h2>
        <button type="button" onClick={() => navigate(location.pathname)}>
          Clear all
        </button>
      </div>
      {!category && (
        <label>
          Category
          <select
            value={activeCategory}
            onChange={(event) => update('category', event.target.value)}
          >
            <option value="">All categories</option>
            {Object.entries(categoryNames).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      <fieldset>
        <legend>Price range</legend>
        <label>
          Minimum price
          <input
            type="number"
            min="0"
            step="500"
            value={params.get('minPrice') ?? ''}
            onChange={(event) => update('minPrice', event.target.value)}
          />
        </label>
        <label>
          Maximum price
          <input
            type="range"
            min="1000"
            max="150000"
            step="1000"
            value={params.get('maxPrice') ?? '150000'}
            onChange={(event) => update('maxPrice', event.target.value)}
          />
          <span>Up to ₹{Number(params.get('maxPrice') ?? 150000).toLocaleString('en-IN')}</span>
        </label>
      </fieldset>
      <fieldset>
        <legend>Colour</legend>
        {['Deep Navy', 'Sunset Coral', 'Graphite', 'Warm Silver'].map((colour) => (
          <label className="check-row" key={colour}>
            <input
              type="checkbox"
              checked={colours.includes(colour)}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                next.delete('colour');
                const selected = event.target.checked
                  ? [...colours, colour]
                  : colours.filter((item) => item !== colour);
                selected.forEach((item) => next.append('colour', item));
                next.delete('page');
                navigate(`${location.pathname}?${next}`);
              }}
            />
            {colour}
          </label>
        ))}
      </fieldset>
      <label className="check-row">
        <input
          type="checkbox"
          checked={params.get('inStock') === '1'}
          onChange={(event) => update('inStock', event.target.checked ? '1' : '')}
        />{' '}
        In stock only
      </label>
      <fieldset>
        <legend>Minimum rating</legend>
        {[4, 3].map((rating) => (
          <label className="radio-row" key={rating}>
            <input
              type="radio"
              name="rating"
              checked={params.get('rating') === String(rating)}
              onChange={() => update('rating', String(rating))}
            />{' '}
            {rating}+ stars
          </label>
        ))}
      </fieldset>
      {activeCategory && (
        <label>
          {categoryNames[activeCategory]} specification
          <select
            value={params.get('spec') ?? ''}
            onChange={(event) => update('spec', event.target.value)}
          >
            <option value="">Any specification</option>
            <option
              value={
                activeCategory === 'laptops'
                  ? '16 GB'
                  : activeCategory === 'tablets'
                    ? 'touch display'
                    : activeCategory === 'headphones'
                      ? '32 hours'
                      : activeCategory === 'speakers'
                        ? 'Bluetooth'
                        : 'precision sensor'
              }
            >
              Recommended specification
            </option>
          </select>
        </label>
      )}
    </div>
  );
  const activeChips = [...params.entries()].filter(
    ([key, value]) => value && !['sort', 'view', 'page', 'q'].includes(key),
  );
  return (
    <div className="page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li aria-current="page">
            {query
              ? 'Search results'
              : activeCategory
                ? categoryNames[activeCategory]
                : 'All products'}
          </li>
        </ol>
      </nav>
      <div className="page-title">
        <div>
          <p className="eyebrow">Curated technology</p>
          <h1>
            {query
              ? `Results for “${query}”`
              : activeCategory
                ? categoryNames[activeCategory]
                : 'All products'}
          </h1>
          <p>{loading ? 'Finding products…' : `${meta.total} products`}</p>
        </div>
        <button
          className="button button--secondary mobile-filter-button"
          type="button"
          onClick={() => setMobileFilters(true)}
        >
          Filters
        </button>
      </div>
      <div className="catalogue-layout">
        <aside className="filters" aria-label="Product filters">
          {filters}
        </aside>
        <section className="results" aria-label="Product results">
          <div className="results-toolbar">
            <div className="active-filters">
              {activeChips.map(([key, value], index) => (
                <button
                  type="button"
                  key={`${key}-${value}-${index}`}
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    if (key === 'colour') {
                      const keep = next.getAll(key).filter((item) => item !== value);
                      next.delete(key);
                      keep.forEach((item) => next.append(key, item));
                    } else {
                      next.delete(key);
                    }
                    navigate(`${location.pathname}?${next}`);
                  }}
                >
                  {key}: {value} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
            <div className="toolbar-controls">
              <label>
                Sort
                <select
                  value={params.get('sort') ?? 'relevance'}
                  onChange={(event) => update('sort', event.target.value)}
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="rating">Rating</option>
                </select>
              </label>
              <div className="view-toggle" aria-label="View">
                <button
                  type="button"
                  aria-pressed={(params.get('view') ?? 'grid') === 'grid'}
                  onClick={() => update('view', '')}
                >
                  Grid
                </button>
                <button
                  type="button"
                  aria-pressed={params.get('view') === 'list'}
                  onClick={() => update('view', 'list')}
                >
                  List
                </button>
              </div>
            </div>
          </div>
          {loading ? (
            <LoadingGrid />
          ) : error ? (
            <ErrorState message={error.message} onRetry={() => void fetchProducts()} />
          ) : !products.length ? (
            <EmptyState
              title="No products found"
              message="Try removing a filter or searching with a broader term."
              action={
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => navigate(location.pathname)}
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <>
              <div
                className={`product-grid product-grid--${params.get('view') === 'list' ? 'list' : 'grid'}`}
                data-testid="product-grid"
              >
                {products.map((product) => (
                  <ProductCard
                    product={product}
                    view={params.get('view') === 'list' ? 'list' : 'grid'}
                    key={product.id}
                  />
                ))}
              </div>
              <Pagination
                page={meta.page}
                pages={meta.pages}
                onPage={(page) => update('page', String(page))}
              />
            </>
          )}
        </section>
      </div>
      {mobileFilters && (
        <div className="drawer-backdrop" onMouseDown={() => setMobileFilters(false)}>
          <aside
            className="filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Product filters"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="icon-button filter-drawer__close"
              autoFocus
              type="button"
              aria-label="Close filters"
              onClick={() => setMobileFilters(false)}
            >
              ×
            </button>
            {filters}
            <button
              className="button button--primary button--full"
              type="button"
              onClick={() => setMobileFilters(false)}
            >
              Show {meta.total} products
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
