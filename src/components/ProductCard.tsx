import { Link } from 'react-router-dom';
import { formatMoney } from '../../shared/lib/money';
import type { Product } from '../../shared/types';
import { Rating } from './Rating';

export function ProductCard({
  product,
  view = 'grid',
}: {
  product: Product;
  view?: 'grid' | 'list';
}) {
  const discount = product.originalPricePaise
    ? Math.round(
        ((product.originalPricePaise - product.pricePaise) / product.originalPricePaise) * 100,
      )
    : 0;
  return (
    <article className={`product-card product-card--${view}`}>
      <Link
        className="product-card__image"
        to={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
      >
        <img
          src={product.images[0]}
          alt={`${product.name} product illustration`}
          width="400"
          height="300"
          loading="lazy"
        />
        {discount > 0 && <span className="badge badge--warm">{discount}% off</span>}
      </Link>
      <div className="product-card__body">
        <p className="eyebrow">
          {product.manufacturer} · {product.categoryName}
        </p>
        <h3>
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <Rating value={product.rating} count={product.reviewCount} />
        <p className="product-card__description">{product.shortDescription}</p>
        <div className="price-row">
          <strong>{formatMoney(product.pricePaise)}</strong>
          {product.originalPricePaise && <del>{formatMoney(product.originalPricePaise)}</del>}
        </div>
        <p className={product.stock ? 'stock stock--in' : 'stock stock--out'}>
          {product.stock ? 'In stock' : 'Out of stock'}
        </p>
      </div>
    </article>
  );
}
