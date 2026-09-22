import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SITE_METADATA } from '../../shared/config';
import { formatMoney } from '../../shared/lib/money';
import type { Product } from '../../shared/types';
import { useCart } from '../app/CartContext';
import { useToast } from '../app/ToastContext';
import { EmptyState, ErrorState } from '../components/Feedback';
import { ProductCard } from '../components/ProductCard';
import { Rating } from '../components/Rating';
import { ReviewSection } from '../components/ReviewSection';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../lib/api';

export function ProductPage() {
  const { slug = '' } = useParams();
  const result = useAsync(
    () => api<{ product: Product; related: Product[] }>(`/products/${slug}`),
    [slug],
  );
  const product = result.data?.product;
  const [image, setImage] = useState(0);
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [infoTab, setInfoTab] = useState<'description' | 'specifications'>('description');
  const { add } = useCart();
  const toast = useToast();
  useDocumentTitle(product?.name ?? 'Product', {
    canonicalPath: `/products/${slug}`,
    description: product?.shortDescription ?? SITE_METADATA.description,
    image: product?.images[0],
    noIndex: !result.loading && (!product || Boolean(result.error)),
  });
  useEffect(() => {
    setImage(0);
    setVariantId(product?.variants[0]?.id ?? '');
    setQuantity(1);
  }, [product]);
  if (result.loading)
    return (
      <div className="page-loader" role="status">
        <span className="spinner" /> Loading product…
      </div>
    );
  if (result.error)
    return (
      <div className="page container">
        <ErrorState message={result.error.message} onRetry={result.reload} />
      </div>
    );
  if (!product)
    return (
      <div className="page container">
        <EmptyState
          title="Product not found"
          message="It may have moved or no longer be available."
          action={
            <Link className="button button--primary" to="/products">
              Browse products
            </Link>
          }
        />
      </div>
    );
  const variant = product.variants.find((item) => item.id === variantId);
  const displayImages = variant?.images.length ? variant.images : product.images;
  const max = Math.min(20, variant?.stock ?? 0);
  const discount = product.originalPricePaise
    ? Math.round((1 - product.pricePaise / product.originalPricePaise) * 100)
    : 0;
  return (
    <div className="page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to={`/category/${product.category}`}>{product.categoryName}</Link>
          </li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>
      <div className="product-detail">
        <div className="gallery">
          <div className="gallery__main">
            <img
              src={displayImages[image]}
              alt={`${product.name} in ${variant?.colour ?? 'selected colour'}, view ${image + 1}`}
              width="800"
              height="600"
            />
          </div>
          <div className="gallery__thumbnails" role="tablist" aria-label="Product images">
            {displayImages.map((source, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={image === index}
                onClick={() => setImage(index)}
                key={source}
              >
                <img src={source} alt={`View ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>
        <section className="product-info">
          <p className="eyebrow">{product.manufacturer}</p>
          <h1>{product.name}</h1>
          <Rating value={product.rating} count={product.reviewCount} />
          <p className="product-info__lead">{product.shortDescription}</p>
          <div className="product-price">
            <strong>{formatMoney(product.pricePaise)}</strong>
            {product.originalPricePaise && (
              <>
                <del>{formatMoney(product.originalPricePaise)}</del>
                <span className="badge badge--warm">Save {discount}%</span>
              </>
            )}
          </div>
          <p className={product.stock ? 'stock stock--in' : 'stock stock--out'}>
            {product.stock ? `${product.stock} in stock` : 'Out of stock'}
          </p>
          <fieldset className="swatches">
            <legend>
              Colour: <strong>{variant?.colour ?? 'Select one'}</strong>
            </legend>
            <div>
              {product.variants.map((item) => (
                <label key={item.id} title={item.colour}>
                  <input
                    type="radio"
                    name="colour"
                    value={item.id}
                    checked={variantId === item.id}
                    onChange={() => {
                      setVariantId(item.id);
                      setImage(0);
                      setQuantity(1);
                    }}
                    disabled={!item.stock}
                  />
                  <span style={{ '--swatch': item.colourHex } as React.CSSProperties} />
                  <em>{item.colour}</em>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="purchase-row">
            <div className="stepper">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                −
              </button>
              <label>
                <span className="sr-only">Quantity</span>
                <input
                  type="number"
                  min="1"
                  max={max}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Math.max(1, Math.min(max, Number(event.target.value) || 1)))
                  }
                />
              </label>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={quantity >= max}
                onClick={() => setQuantity((value) => Math.min(max, value + 1))}
              >
                +
              </button>
            </div>
            <button
              className="button button--primary purchase-button"
              type="button"
              disabled={!variant || !variant.stock || adding}
              onClick={async () => {
                if (!variant) return;
                setAdding(true);
                try {
                  await add(product.id, variant.id, quantity);
                  toast(`${product.name} added to your cart.`, 'success');
                } catch (reason) {
                  toast(
                    reason instanceof Error ? reason.message : 'Could not add the product.',
                    'error',
                  );
                } finally {
                  setAdding(false);
                }
              }}
            >
              {adding ? 'Adding…' : 'Add to cart'}
            </button>
          </div>
          <details className="accordion" open>
            <summary>Delivery information</summary>
            <p>
              Standard delivery is free above ₹5,000. Express and demo pickup options are available
              during checkout.
            </p>
          </details>
        </section>
      </div>
      <section className="product-tabs">
        <div role="tablist" aria-label="Product information">
          <button
            type="button"
            role="tab"
            id="description-tab"
            aria-controls="description-panel"
            aria-selected={infoTab === 'description'}
            onClick={() => setInfoTab('description')}
          >
            Description
          </button>
          <button
            type="button"
            role="tab"
            id="specifications-tab"
            aria-controls="specifications-panel"
            aria-selected={infoTab === 'specifications'}
            onClick={() => setInfoTab('specifications')}
          >
            Specifications
          </button>
        </div>
        {infoTab === 'description' ? (
          <div
            className="product-copy"
            role="tabpanel"
            id="description-panel"
            aria-labelledby="description-tab"
          >
            <div>
              <h2>Made for useful days</h2>
              <p>{product.description}</p>
            </div>
          </div>
        ) : (
          <div>
            <div
              className="product-copy"
              role="tabpanel"
              id="specifications-panel"
              aria-labelledby="specifications-tab"
            >
              <table>
                <caption>Technical specifications</caption>
                <tbody>
                  {product.specifications.map((spec) => (
                    <tr key={spec.name}>
                      <th scope="row">{spec.name}</th>
                      <td>{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
      <ReviewSection productId={product.id} />
      {!!result.data?.related.length && (
        <section className="section related">
          <div className="section-heading">
            <h2>Related products</h2>
          </div>
          <div className="product-grid">
            {result.data.related.map((item) => (
              <ProductCard product={item} key={item.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
