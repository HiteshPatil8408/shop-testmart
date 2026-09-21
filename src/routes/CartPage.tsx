import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useCart } from '../app/CartContext';
import { useToast } from '../app/ToastContext';
import { EmptyState } from '../components/Feedback';
import { Modal } from '../components/Modal';
import { PriceSummary } from '../components/PriceSummary';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function CartPage() {
  useDocumentTitle('Your cart');
  const { cart, loading, update, remove, clear } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);
  if (loading)
    return (
      <div className="page-loader" role="status">
        <span className="spinner" /> Loading your cart…
      </div>
    );
  if (!cart?.items.length)
    return (
      <div className="page container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li aria-current="page">Cart</li>
          </ol>
        </nav>
        <EmptyState
          title="Your cart is empty"
          message="Explore the catalogue and add a product in your favourite colour."
          action={
            <Link className="button button--primary" to="/products">
              Continue shopping
            </Link>
          }
        />
      </div>
    );
  return (
    <div className="page container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li aria-current="page">Cart</li>
        </ol>
      </nav>
      <div className="page-title">
        <div>
          <p className="eyebrow">Ready when you are</p>
          <h1>Your cart</h1>
          <p>
            {cart.items.length} {cart.items.length === 1 ? 'line' : 'lines'} in this cart
          </p>
        </div>
        <button
          className="button button--text-danger"
          type="button"
          onClick={() => setConfirmClear(true)}
        >
          Clear cart
        </button>
      </div>
      <div className="cart-layout">
        <section className="cart-lines" aria-label="Cart items">
          {cart.items.map((item) => (
            <article className="cart-line" key={item.id}>
              <Link to={`/products/${item.product.slug}`}>
                <img
                  src={item.variant.images[0] ?? item.product.images[0]}
                  alt={`${item.product.name} in ${item.variant.colour}`}
                />
              </Link>
              <div className="cart-line__details">
                <p className="eyebrow">{item.product.manufacturer}</p>
                <h2>
                  <Link to={`/products/${item.product.slug}`}>{item.product.name}</Link>
                </h2>
                <label>
                  Colour
                  <select
                    value={item.variantId}
                    onChange={async (event) => {
                      try {
                        await update(item.id, { variantId: event.target.value });
                        toast('Colour updated.', 'success');
                      } catch (reason) {
                        toast(
                          reason instanceof Error ? reason.message : 'Unable to update.',
                          'error',
                        );
                      }
                    }}
                  >
                    {item.product.variants.map((variant) => (
                      <option value={variant.id} disabled={!variant.stock} key={variant.id}>
                        {variant.colour}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="cart-line__actions">
                <strong>
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  }).format((item.product.pricePaise * item.quantity) / 100)}
                </strong>
                <div className="stepper">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.product.name} quantity`}
                    disabled={item.quantity <= 1}
                    onClick={() => void update(item.id, { quantity: item.quantity - 1 })}
                  >
                    −
                  </button>
                  <label>
                    <span className="sr-only">Quantity for {item.product.name}</span>
                    <input
                      type="number"
                      min="1"
                      max={Math.min(20, item.variant.stock)}
                      value={item.quantity}
                      onChange={(event) =>
                        void update(item.id, {
                          quantity: Math.max(1, Number(event.target.value) || 1),
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    aria-label={`Increase ${item.product.name} quantity`}
                    disabled={item.quantity >= Math.min(20, item.variant.stock)}
                    onClick={() => void update(item.id, { quantity: item.quantity + 1 })}
                  >
                    +
                  </button>
                </div>
                <button
                  className="link-button"
                  type="button"
                  onClick={() =>
                    void remove(item.id).then(() => toast(`${item.product.name} removed.`, 'info'))
                  }
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </section>
        <PriceSummary
          totals={cart.totals}
          action={
            <button
              className="button button--primary button--full"
              type="button"
              onClick={() => navigate(user ? '/checkout' : '/login?returnTo=/checkout')}
            >
              Proceed to checkout
            </button>
          }
        />
      </div>
      <Link className="back-link" to="/products">
        ← Continue shopping
      </Link>
      <Modal
        open={confirmClear}
        title="Clear your cart?"
        onClose={() => setConfirmClear(false)}
        actions={
          <>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => setConfirmClear(false)}
            >
              Keep items
            </button>
            <button
              className="button button--danger"
              type="button"
              onClick={() =>
                void clear().then(() => {
                  setConfirmClear(false);
                  toast('Cart cleared.', 'info');
                })
              }
            >
              Clear cart
            </button>
          </>
        }
      >
        <p>This removes every item from this cart. You can add them again later.</p>
      </Modal>
    </div>
  );
}
