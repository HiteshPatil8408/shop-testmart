import { Link } from 'react-router-dom';
import { formatMoney } from '../../shared/lib/money';
import type { OrderSummary } from '../../shared/types';
import { EmptyState, ErrorState } from '../components/Feedback';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../lib/api';

export function OrdersPage() {
  useDocumentTitle('Order history');
  const result = useAsync(() => api<OrderSummary[]>('/orders'), []);
  return (
    <div className="page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/account">Account</Link>
          </li>
          <li aria-current="page">Order history</li>
        </ol>
      </nav>
      <div className="page-title">
        <div>
          <p className="eyebrow">Your account</p>
          <h1>Order history</h1>
          <p>Every order here is a safe simulation.</p>
        </div>
      </div>
      {result.loading ? (
        <div className="page-loader">
          <span className="spinner" /> Loading orders…
        </div>
      ) : result.error ? (
        <ErrorState message={result.error.message} onRetry={result.reload} />
      ) : !result.data?.length ? (
        <EmptyState
          title="No orders yet"
          message="Complete a simulated checkout and it will appear here."
          action={
            <Link className="button button--primary" to="/products">
              Start shopping
            </Link>
          }
        />
      ) : (
        <div className="orders-list">
          {result.data.map((order) => (
            <article className="order-card" key={order.orderNumber}>
              <div className="order-card__header">
                <div>
                  <span>Order</span>
                  <strong>{order.orderNumber}</strong>
                </div>
                <div>
                  <span>Placed</span>
                  <strong>
                    {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(
                      new Date(order.createdAt),
                    )}
                  </strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{formatMoney(order.totalPaise)}</strong>
                </div>
                <span className="badge">{order.status}</span>
              </div>
              <div className="order-card__body">
                <div className="order-thumbnails">
                  {order.items.slice(0, 3).map((item) => (
                    <img
                      key={item.id}
                      src={item.image}
                      alt={`${item.productName} in ${item.variantColour}`}
                    />
                  ))}
                </div>
                <p>
                  {order.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}
                </p>
                <Link className="button button--secondary" to={`/orders/${order.orderNumber}`}>
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
