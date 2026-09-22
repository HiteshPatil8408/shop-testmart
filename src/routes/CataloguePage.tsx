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

const filterKeys = ['category', 'minPrice', 'maxPrice', 'colour', 'inStock', 'rating', 'spec'];

function FilterControls({
  category,
  params,
  onUpdate,
  onColours,
  onClear,
}: {
  category?: string;
  params: URLSearchParams;
  onUpdate: (name: string, value?: string) => void;
  onColours: (values: string[]) => void;
  onClear: () => void;
}) {
  const activeCategory = category ?? params.get('category') ?? '';
  const colours = params.getAll('colour');
  const minimum = Number(params.get('minPrice') || 0);
  const maximum = Number(params.get('maxPrice') || 150000);
  const invalidPrice = minimum < 0 || maximum < 1000 || minimum > maximum;
  return (
    <div className="filters__body">
      <div className="filter-heading">
        <h2>Filters</h2>
        <button type="button" onClick={onClear}>
          Clear all
        </button>
      </div>
      {!category && (
        <label>
          Category
          <select
            value={activeCategory}
            onChange={(event) => onUpdate('category', event.target.value)}
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
      <fieldset aria-describedby={invalidPrice ? 'price-filter-error' : undefined}>
        <legend>Price range</legend>
        <div className="price-filter-values">
          <label>
            Minimum price
            <input
              type="number"
              min="0"
              max="150000"
              step="500"
              value={params.get('minPrice') ?? ''}
              placeholder="₹0"
              aria-invalid={invalidPrice}
              onChange={(event) => onUpdate('minPrice', event.target.value)}
            />
          </label>
          <label>
            Maximum price
            <input
              type="number"
              min="1000"
              max="150000"
              step="500"
              value={params.get('maxPrice') ?? ''}
              placeholder="₹1,50,000"
              aria-invalid={invalidPrice}
              onChange={(event) => onUpdate('maxPrice', event.target.value)}
            />
          </label>
        </div>
        <div className="dual-range" aria-hidden="true">
          <span
            style={{
              left: `${(minimum / 150000) * 100}%`,
              right: `${100 - (maximum / 150000) * 100}%`,
            }}
          />
        </div>
        <small>
          ₹{minimum.toLocaleString('en-IN')} – ₹{maximum.toLocaleString('en-IN')}
        </small>
        {invalidPrice && (
          <span className="field-error" id="price-filter-error">
            Minimum price cannot exceed maximum price.
          </span>
        )}
      </fieldset>
      <fieldset>
        <legend>Colour</legend>
        {[
          'Deep Navy',
          'Warm Silver',
          'Lagoon Teal',
          'Sunset Coral',
          'Night Navy',
          'Harbour Blue',
          'Terracotta',
          'Graphite',
          'Mist Silver',
        ].map((colour) => (
          <label className="check-row" key={colour}>
            <input
              type="checkbox"
              checked={colours.includes(colour)}
              onChange={(event) =>
                onColours(
                  event.target.checked
                    ? [...colours, colour]
                    : colours.filter((item) => item !== colour),
                )
              }
            />
            {colour}
          </label>
        ))}
      </fieldset>
      <label className="check-row">
        <input
          type="checkbox"
          checked={params.get('inStock') === '1'}
          onChange={(event) => onUpdate('inStock', event.target.checked ? '1' : '')}
        />{' '}
        In stock only
      </label>
      <fieldset>
        <legend>Minimum rating</legend>
        {[4, 3].map((rating) => (
          <label className="radio-row" key={rating}>
            <input
              type="radio"
              name={`rating-${category ? 'category' : 'all'}`}
              checked={params.get('rating') === String(rating)}
              onChange={() => onUpdate('rating', String(rating))}
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
            onChange={(event) => onUpdate('spec', event.target.value)}
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
}

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
  const [mobileDraft, setMobileDraft] = useState<URLSearchParams | null>(null);
  const [savedPreset, setSavedPreset] = useState(
    () => localStorage.getItem('tm_filter_preset') ?? '',
  );
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
  const clearFilters = (source = params) => {
    const next = new URLSearchParams(source);
    filterKeys.forEach((key) => next.delete(key));
    next.delete('page');
    return next;
  };
  const draftUpdate = (name: string, value?: string) => {
    setMobileDraft((current) => {
      const next = new URLSearchParams(current ?? params);
      next.delete(name);
      if (value) next.set(name, value);
      next.delete('page');
      return next;
    });
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
          onClick={() => {
            setMobileDraft(new URLSearchParams(params));
            setMobileFilters(true);
          }}
        >
          Filters{activeChips.length ? ` (${activeChips.length})` : ''}
        </button>
      </div>
      <div className="catalogue-layout">
        <aside className="filters" aria-label="Product filters">
          <FilterControls
            category={category}
            params={params}
            onUpdate={update}
            onColours={(values) => {
              const next = new URLSearchParams(params);
              next.delete('colour');
              values.forEach((value) => next.append('colour', value));
              next.delete('page');
              navigate(`${location.pathname}?${next}`);
            }}
            onClear={() => navigate(`${location.pathname}?${clearFilters()}`)}
          />
          <div className="filter-presets">
            <button
              type="button"
              onClick={() => {
                const preset = [...params.entries()].filter(([key]) => filterKeys.includes(key));
                const value = new URLSearchParams(preset).toString();
                localStorage.setItem('tm_filter_preset', value);
                setSavedPreset(value);
              }}
            >
              Save filter preset
            </button>
            {savedPreset && (
              <button type="button" onClick={() => navigate(`${location.pathname}?${savedPreset}`)}>
                Apply saved preset
              </button>
            )}
          </div>
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
          <p className="sr-only" role="status" aria-live="polite">
            {loading ? 'Updating product results.' : `${meta.total} products found.`}
          </p>
          {loading ? (
            <LoadingGrid />
          ) : error ? (
            <ErrorState message={error.message} onRetry={() => void fetchProducts()} />
          ) : !products.length ? (
            <EmptyState
              title="No products found"
              message="Try removing a filter or searching with a broader term."
              action={
                <div className="button-row">
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => navigate(`${location.pathname}?${clearFilters()}`)}
                  >
                    Clear filters
                  </button>
                  <Link className="button button--primary" to="/products?sort=rating">
                    Browse top-rated products
                  </Link>
                </div>
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
            <FilterControls
              category={category}
              params={mobileDraft ?? params}
              onUpdate={draftUpdate}
              onColours={(values) =>
                setMobileDraft((current) => {
                  const next = new URLSearchParams(current ?? params);
                  next.delete('colour');
                  values.forEach((value) => next.append('colour', value));
                  next.delete('page');
                  return next;
                })
              }
              onClear={() => setMobileDraft(clearFilters(mobileDraft ?? params))}
            />
            <div className="filter-drawer__actions">
              <button
                className="button button--secondary"
                type="button"
                onClick={() => {
                  setMobileDraft(null);
                  setMobileFilters(false);
                }}
              >
                Cancel
              </button>
              <button
                className="button button--primary"
                type="button"
                disabled={
                  Number((mobileDraft ?? params).get('minPrice') || 0) >
                  Number((mobileDraft ?? params).get('maxPrice') || 150000)
                }
                onClick={() => {
                  navigate(`${location.pathname}?${mobileDraft ?? params}`);
                  setMobileFilters(false);
                }}
              >
                Apply filters
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
