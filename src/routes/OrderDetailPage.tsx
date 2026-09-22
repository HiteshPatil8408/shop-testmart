import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatMoney } from '../../shared/lib/money';
import type { OrderSummary } from '../../shared/types';
import { ErrorState } from '../components/Feedback';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { OrderTracking } from '../components/OrderTracking';
import { useToast } from '../app/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../lib/api';

interface DetailedOrder extends OrderSummary {
  deliveryMethod: string;
  address: Record<string, string>;
  subtotalPaise: number;
  shippingPaise: number;
  taxPaise: number;
}

export function OrderDetailPage() {
  const { orderNumber = '' } = useParams();
  useDocumentTitle(`Order ${orderNumber}`);
  const result = useAsync(() => api<DetailedOrder>(`/orders/${orderNumber}`), [orderNumber]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const toast = useToast();
  if (result.loading)
    return (
      <div className="page-loader">
        <span className="spinner" /> Loading order…
      </div>
    );
  if (result.error || !result.data)
    return (
      <div className="page container">
        <ErrorState message={result.error?.message ?? 'Order not found.'} />
      </div>
    );
  const order = result.data;
  const displayedStatus = cancelled ? 'cancelled' : order.status;
  return (
    <div className="page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/account">Account</Link>
          </li>
          <li>
            <Link to="/orders">Orders</Link>
          </li>
          <li aria-current="page">{order.orderNumber}</li>
        </ol>
      </nav>
      <div className="page-title">
        <div>
          <p className="eyebrow">Order confirmed</p>
          <h1 data-testid="order-number">{order.orderNumber}</h1>
          <p>
            Placed{' '}
            {new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short' }).format(
              new Date(order.createdAt),
            )}
          </p>
        </div>
        <div className="button-row">
          <span className="badge badge--large">{displayedStatus}</span>
          {['confirmed', 'packed'].includes(displayedStatus) && (
            <button
              className="button button--danger"
              type="button"
              onClick={() => setCancelOpen(true)}
            >
              Cancel demo order
            </button>
          )}
          <Link className="button button--secondary" to="/returns">
            Start a return
          </Link>
        </div>
      </div>
      <div className="order-detail-grid">
        <section className="order-detail-items">
          <h2>Items</h2>
          {order.items.map((item) => (
            <article key={item.id}>
              <img src={item.image} alt={`${item.productName} in ${item.variantColour}`} />
              <div>
                <Link to={`/products/${item.productSlug}`}>
                  <strong>{item.productName}</strong>
                </Link>
                <span>
                  {item.variantColour} · Quantity {item.quantity}
                </span>
              </div>
              <strong>{formatMoney(item.unitPricePaise * item.quantity)}</strong>
            </article>
          ))}
        </section>
        <aside className="order-detail-meta">
          <h2>Delivery</h2>
          <p>
            {order.address.firstName} {order.address.lastName}
            <br />
            {order.address.street}
            <br />
            {order.address.city}, {order.address.state} {order.address.postalCode}
            <br />
            {order.address.country}
          </p>
          <p>
            <strong>Method:</strong> {order.deliveryMethod}
          </p>
          {order.deliveryDate && (
            <p>
              <strong>Scheduled:</strong>{' '}
              {new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(
                new Date(`${order.deliveryDate}T12:00:00`),
              )}
              {order.deliveryTimeSlot ? ` · ${order.deliveryTimeSlot}` : ''}
            </p>
          )}
          <h2>Payment</h2>
          <p>
            Status: <span className="badge">{order.paymentStatus}</span>
          </p>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(order.subtotalPaise)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{order.shippingPaise ? formatMoney(order.shippingPaise) : 'Free'}</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{formatMoney(order.taxPaise)}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatMoney(order.totalPaise)}</dd>
            </div>
          </dl>
        </aside>
      </div>
      {displayedStatus !== 'cancelled' && <OrderTracking orderNumber={order.orderNumber} />}
      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this demo order?"
        onClose={() => setCancelOpen(false)}
        confirmLabel="Cancel order"
        destructive
        successMessage="The demo order was cancelled."
        onConfirm={async () => {
          await api(`/orders/${order.orderNumber}/cancel`, { method: 'POST' });
          setCancelled(true);
          toast('Demo order cancelled.', 'info');
        }}
      >
        <p>The order status will change to cancelled. No real shipment or refund exists.</p>
      </ConfirmDialog>
    </div>
  );
}
