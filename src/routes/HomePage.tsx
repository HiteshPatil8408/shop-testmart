import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../shared/config';
import type { Category, Product } from '../../shared/types';
import { ProductCard } from '../components/ProductCard';
import { ErrorState, LoadingGrid } from '../components/Feedback';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../lib/api';

const slides = [
  {
    eyebrow: 'Fresh tools for focused work',
    title: 'Build your best setups',
    body: 'Automate search, product, cart and checkout flows with stable data and realistic UI states.',
    image: '/images/laptop-teal.svg',
    href: '/products?featured=1',
    cta: 'Shop featured',
  },
  {
    eyebrow: 'Small sound. Big lift.',
    title: 'Audio that moves with you',
    body: 'Comfortable headphones and confident speakers for commutes, calls and weekends.',
    image: '/images/headphones-coral.svg',
    href: '/category/headphones',
    cta: 'Explore audio',
  },
  {
    eyebrow: 'Practice a complete checkout',
    title: 'Safe by design',
    body: `Use documented test details. ${APP_CONFIG.name} never initiates a real financial transaction.`,
    image: '/images/tablet-teal.svg',
    href: '/products',
    cta: 'Browse the catalogue',
  },
];

export function HomePage() {
  useDocumentTitle(undefined, { canonicalPath: '/' });
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const catalogue = useAsync(async () => {
    const [categories, popular, offers] = await Promise.all([
      api<Category[]>('/categories'),
      api<Product[]>('/products?popular=1&pageSize=4'),
      api<Product[]>('/products?sort=price_asc&pageSize=4'),
    ]);
    return { categories, popular, offers };
  }, []);
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setSlide((value) => (value + 1) % slides.length), 7000);
    return () => window.clearInterval(timer);
  }, [paused]);
  const current = slides[slide];
  return (
    <>
      <section
        className="hero"
        aria-roledescription="carousel"
        aria-label="Featured promotions"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="container hero__content">
          <div className="hero__copy" aria-live="polite">
            <p className="eyebrow">{current.eyebrow}</p>
            <h1>UI testing environment for QA automation</h1>
            <h2 className="hero__slide-title">{current.title}</h2>
            <p>{current.body}</p>
            <Link className="button button--primary" to={current.href}>
              {current.cta}
            </Link>
          </div>
          <img src={current.image} alt="" width="800" height="600" />
        </div>
        <div className="hero__controls">
          <button
            className="icon-button"
            type="button"
            aria-label="Previous promotion"
            onClick={() => setSlide((slide - 1 + slides.length) % slides.length)}
          >
            ←
          </button>
          <div>
            {slides.map((item, index) => (
              <button
                type="button"
                key={item.title}
                aria-label={`Show promotion ${index + 1}`}
                aria-current={index === slide}
                onClick={() => setSlide(index)}
              />
            ))}
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Next promotion"
            onClick={() => setSlide((slide + 1) % slides.length)}
          >
            →
          </button>
        </div>
      </section>
      <section
        className="section container testing-environment"
        id="testing-environment"
        aria-labelledby="testing-environment-title"
      >
        <div className="testing-environment__copy">
          <p className="eyebrow">Free automation playground</p>
          <h2 id="testing-environment-title">
            Practice realistic UI, API and accessibility testing
          </h2>
          <p>
            TestMart is a public ecommerce UI testing environment built for repeatable automation.
            Exercise registration, login, search, filters, responsive navigation, cart updates,
            checkout, validation and error handling without using real customer or payment data.
          </p>
          <p>
            Use it with Playwright, Cypress, Selenium or your preferred testing framework. Stable
            products and documented test credentials make local experiments and CI pipelines easier
            to reproduce.
          </p>
          <div className="testing-environment__actions">
            <Link className="button button--primary" to="/api-docs">
              Explore the test API
            </Link>
            <Link className="button button--secondary" to="/products">
              Start a UI test flow
            </Link>
          </div>
        </div>
        <ul className="testing-environment__features" aria-label="Test automation capabilities">
          <li>
            <strong>Deterministic test data</strong>
            <span>Predictable catalogue, pricing, stock and demo-account behaviour.</span>
          </li>
          <li>
            <strong>Complete user journeys</strong>
            <span>Authentication, search, cart, checkout, orders and contact forms.</span>
          </li>
          <li>
            <strong>API and UI together</strong>
            <span>Same-origin REST endpoints with OpenAPI documentation.</span>
          </li>
          <li>
            <strong>Safe failure testing</strong>
            <span>Simulated declines, latency, validation errors and server failures.</span>
          </li>
        </ul>
      </section>
      <section className="section container" aria-labelledby="categories-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Find your fit</p>
            <h2 id="categories-title">Shop by category</h2>
          </div>
          <Link to="/products">View everything →</Link>
        </div>
        {catalogue.error ? (
          <ErrorState message={catalogue.error.message} onRetry={catalogue.reload} />
        ) : (
          <div className="category-grid">
            {catalogue.data?.categories.map((category) => (
              <Link className="category-card" to={`/category/${category.slug}`} key={category.id}>
                <img src={category.image} alt="" width="360" height="260" />
                <span>
                  <strong>{category.name}</strong>
                  <small>{category.productCount} products</small>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="offer-band">
        <div className="container offer-band__inner">
          <div>
            <p className="eyebrow">Special offer</p>
            <h2>Thoughtful technology, friendlier prices</h2>
            <p>
              Selected products include clear reference pricing—ideal for practicing assertions
              around discounts and totals.
            </p>
            <Link className="button button--light" to="/products?sort=price_asc">
              See current offers
            </Link>
          </div>
          <div className="offer-band__stat">
            <strong>18%</strong>
            <span>tax calculated transparently at checkout</span>
          </div>
        </div>
      </section>
      <section className="section container" aria-labelledby="popular-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Community favourites</p>
            <h2 id="popular-title">Popular right now</h2>
          </div>
        </div>
        {catalogue.loading ? (
          <LoadingGrid count={4} />
        ) : (
          <div className="product-grid" data-testid="product-grid">
            {catalogue.data?.popular.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        )}
      </section>
      <section className="section benefits">
        <div className="container benefit-grid">
          <article>
            <span aria-hidden="true">◎</span>
            <h2>Deterministic data</h2>
            <p>Stable products and predictable ordering keep automated tests repeatable.</p>
          </article>
          <article>
            <span aria-hidden="true">♿</span>
            <h2>Accessible foundations</h2>
            <p>
              Semantic controls, visible focus and keyboard-first flows support inclusive practice.
            </p>
          </article>
          <article>
            <span aria-hidden="true">⌁</span>
            <h2>Same-origin API</h2>
            <p>Exercise UI and REST testing together through a realistic Cloudflare Worker.</p>
          </article>
          <article>
            <span aria-hidden="true">⚗</span>
            <h2>QA laboratory</h2>
            <p>Simulate latency, errors, empty results and payment declines on demand.</p>
          </article>
        </div>
      </section>
      <section className="section container contact-cta">
        <div>
          <p className="eyebrow">Need a testable form?</p>
          <h2>Send a demo support message</h2>
          <p>
            Category-dependent products, validation, pending state and persisted success are all
            included.
          </p>
        </div>
        <Link className="button button--primary" to="/contact">
          Open contact form
        </Link>
      </section>
    </>
  );
}
