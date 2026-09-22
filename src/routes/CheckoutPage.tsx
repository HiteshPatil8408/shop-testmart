import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DEMO_SAFETY_NOTICE } from '../../shared/config';
import type { Address, CartItem, CartTotals } from '../../shared/types';
import { useAuth } from '../app/AuthContext';
import { useCart } from '../app/CartContext';
import { useToast } from '../app/ToastContext';
import { PriceSummary } from '../components/PriceSummary';
import { DeliveryScheduler, firstAvailableDeliveryDate } from '../components/DeliveryScheduler';
import { useQa } from '../app/QaContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api, ApiError, jsonBody } from '../lib/api';

const steps = [
  'Cart review',
  'Sign in',
  'Address',
  'Delivery',
  'Payment',
  'Review',
  'Confirmation',
];
type Delivery = 'standard' | 'express' | 'pickup';
type PaymentType = 'card' | 'cod' | 'wallet';

const emptyAddress: Omit<Address, 'id'> = {
  label: 'Home',
  firstName: '',
  lastName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  isDefault: true,
};

export function CheckoutPage() {
  useDocumentTitle('Checkout');
  const { user } = useAuth();
  const { cart, loading: cartLoading, refresh } = useCart();
  const toast = useToast();
  const qa = useQa();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(emptyAddress);
  const [delivery, setDelivery] = useState<Delivery>('standard');
  const [deliveryDate, setDeliveryDate] = useState(
    () => sessionStorage.getItem('tm_checkout_date') || firstAvailableDeliveryDate(),
  );
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState(
    () => sessionStorage.getItem('tm_checkout_slot') || '09:00-12:00',
  );
  const [paymentType, setPaymentType] = useState<PaymentType>('card');
  const [cardholderName, setCardholderName] = useState('Demo Tester');
  const [cardNumber, setCardNumber] = useState('4111111111111111');
  const [expiryMonth, setExpiryMonth] = useState(12);
  const [expiryYear, setExpiryYear] = useState(new Date().getFullYear() + 2);
  const [totals, setTotals] = useState<CartTotals | null>(cart?.totals ?? null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [confirmedItems, setConfirmedItems] = useState<CartItem[]>([]);
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  useEffect(() => {
    void api<Address[]>('/addresses')
      .then((items) => {
        const selected = items.find((item) => item.isDefault) ?? items[0];
        if (selected) setAddress(selected);
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!cartLoading && cart && !cart.items.length && step < 7)
      navigate('/cart', { replace: true });
  }, [cart, cartLoading, navigate, step]);
  useEffect(() => {
    if (cart && !totals) setTotals(cart.totals);
  }, [cart, totals]);
  useEffect(() => {
    sessionStorage.setItem('tm_checkout_date', deliveryDate);
    sessionStorage.setItem('tm_checkout_slot', deliveryTimeSlot);
  }, [deliveryDate, deliveryTimeSlot]);
  const preview = async (nextDelivery = delivery) => {
    const result = await api<{ totals: CartTotals }>('/checkout/preview', {
      method: 'POST',
      body: jsonBody({ deliveryMethod: nextDelivery }),
    });
    setTotals(result.totals);
  };
  const next = async () => {
    setError('');
    if (step === 4 && (!deliveryDate || !deliveryTimeSlot)) {
      setError('Choose an available delivery date and time slot.');
      return;
    }
    if (step === 4 && qa.dateSlotUnavailable && deliveryTimeSlot === '12:00-15:00') {
      setError('That delivery slot just became unavailable. Choose another time.');
      return;
    }
    if (step === 4 || step === 5) {
      try {
        await preview();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to calculate totals.');
        return;
      }
    }
    setStep((value) => Math.min(7, value + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const submitAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void next();
  };
  const placeOrder = async () => {
    setPending(true);
    setError('');
    try {
      const payment =
        paymentType === 'card'
          ? {
              type: 'card',
              cardholderName,
              cardNumber: cardNumber.replaceAll(' ', ''),
              expiryMonth,
              expiryYear,
            }
          : { type: paymentType };
      const result = await api<{ orderNumber: string }>('/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: jsonBody({
          address,
          deliveryMethod: delivery,
          deliveryDate,
          deliveryTimeSlot,
          payment,
        }),
      });
      setConfirmedItems(cart?.items ?? []);
      setOrderNumber(result.orderNumber);
      setStep(7);
      await refresh();
      toast('Your simulated order is confirmed.', 'success');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to create the order.');
    } finally {
      setPending(false);
    }
  };
  if (cartLoading || !cart || !totals)
    return (
      <div className="page-loader" role="status">
        <span className="spinner" /> Preparing checkout…
      </div>
    );
  return (
    <div className="page container checkout-page">
      <div className="demo-notice" role="note">
        ⚠ <strong>{DEMO_SAFETY_NOTICE}</strong>
      </div>
      <ol className="checkout-progress" aria-label="Checkout progress">
        {steps.map((label, index) => (
          <li
            key={label}
            className={step > index + 1 ? 'is-complete' : step === index + 1 ? 'is-current' : ''}
            aria-current={step === index + 1 ? 'step' : undefined}
          >
            <span>{step > index + 1 ? '✓' : index + 1}</span>
            <small>{label}</small>
          </li>
        ))}
      </ol>
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      <div className="checkout-layout">
        <section className="checkout-card">
          {step === 1 && (
            <>
              <p className="eyebrow">Step 1 of 7</p>
              <h1>Review your cart</h1>
              <div className="checkout-items">
                {cart.items.map((item) => (
                  <article key={item.id}>
                    <img
                      src={item.variant.images[0] ?? item.product.images[0]}
                      alt={`${item.product.name} in ${item.variant.colour}`}
                    />
                    <div>
                      <strong>{item.product.name}</strong>
                      <span>
                        {item.variant.colour} · Quantity {item.quantity}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
              <div className="checkout-actions">
                <Link className="button button--secondary" to="/cart">
                  Edit cart
                </Link>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => void next()}
                >
                  Continue
                </button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <p className="eyebrow">Step 2 of 7</p>
              <h1>Authentication check</h1>
              <div className="identity-card">
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>
                    Signed in as {user?.firstName} {user?.lastName}
                  </strong>
                  <p>{user?.email}</p>
                </div>
              </div>
              <p>Your order will appear in this account’s order history.</p>
              <div className="checkout-actions">
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => void next()}
                >
                  Continue
                </button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <p className="eyebrow">Step 3 of 7</p>
              <h1>Delivery address</h1>
              <form className="form-grid" onSubmit={submitAddress}>
                <label>
                  First name
                  <input
                    required
                    value={address.firstName}
                    onChange={(event) => setAddress({ ...address, firstName: event.target.value })}
                  />
                </label>
                <label>
                  Last name
                  <input
                    required
                    value={address.lastName}
                    onChange={(event) => setAddress({ ...address, lastName: event.target.value })}
                  />
                </label>
                <label className="form-grid__wide">
                  Street address
                  <input
                    required
                    minLength={5}
                    value={address.street}
                    onChange={(event) => setAddress({ ...address, street: event.target.value })}
                  />
                </label>
                <label>
                  City
                  <input
                    required
                    value={address.city}
                    onChange={(event) => setAddress({ ...address, city: event.target.value })}
                  />
                </label>
                <label>
                  State
                  <input
                    required
                    value={address.state}
                    onChange={(event) => setAddress({ ...address, state: event.target.value })}
                  />
                </label>
                <label>
                  Postal code
                  <input
                    required
                    value={address.postalCode}
                    onChange={(event) => setAddress({ ...address, postalCode: event.target.value })}
                  />
                </label>
                <label>
                  Country
                  <select
                    value={address.country}
                    onChange={(event) => setAddress({ ...address, country: event.target.value })}
                  >
                    <option>India</option>
                    <option>Singapore</option>
                    <option>United Kingdom</option>
                  </select>
                </label>
                <label>
                  Phone
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(event) => setAddress({ ...address, phone: event.target.value })}
                  />
                </label>
                <div className="checkout-actions form-grid__wide">
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </button>
                  <button className="button button--primary" type="submit">
                    Use this address
                  </button>
                </div>
              </form>
            </>
          )}
          {step === 4 && (
            <>
              <p className="eyebrow">Step 4 of 7</p>
              <h1>Delivery method</h1>
              <div className="choice-cards">
                {(
                  [
                    ['standard', 'Standard delivery', '3–5 demo business days'],
                    ['express', 'Express delivery', '1–2 demo business days'],
                    ['pickup', 'Store pickup', 'Ready next demo day'],
                  ] as const
                ).map(([value, title, description]) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name="delivery"
                      checked={delivery === value}
                      onChange={() => {
                        setDelivery(value);
                        void preview(value).catch((reason) =>
                          setError(
                            reason instanceof Error
                              ? reason.message
                              : 'Unable to calculate totals.',
                          ),
                        );
                      }}
                    />
                    <span>
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </span>
                  </label>
                ))}
              </div>
              <DeliveryScheduler
                date={deliveryDate}
                timeSlot={deliveryTimeSlot}
                onDateChange={setDeliveryDate}
                onTimeSlotChange={setDeliveryTimeSlot}
                simulatedUnavailableSlot={qa.dateSlotUnavailable}
              />
              <div className="checkout-actions">
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setStep(3)}
                >
                  Back
                </button>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => void next()}
                >
                  Continue
                </button>
              </div>
            </>
          )}
          {step === 5 && (
            <>
              <p className="eyebrow">Step 5 of 7</p>
              <h1>Simulated payment</h1>
              <div className="payment-tabs" role="tablist" aria-label="Payment method">
                {(
                  [
                    ['card', 'Test card'],
                    ['cod', 'Cash on delivery'],
                    ['wallet', 'Demo wallet'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentType === value}
                    onClick={() => setPaymentType(value)}
                    key={value}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {paymentType === 'card' && (
                <div className="payment-form">
                  <div className="test-card-note">
                    <strong>Documented test values</strong>
                    <span>Success: 4111 1111 1111 1111</span>
                    <span>Decline: 4000 0000 0000 0002</span>
                    <span>Use any future expiry. No CVV is required.</span>
                  </div>
                  <label>
                    Cardholder name
                    <input
                      value={cardholderName}
                      onChange={(event) => setCardholderName(event.target.value)}
                    />
                  </label>
                  <label>
                    Test card number
                    <input
                      inputMode="numeric"
                      value={cardNumber}
                      maxLength={19}
                      onChange={(event) =>
                        setCardNumber(event.target.value.replace(/[^0-9 ]/g, ''))
                      }
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Expiry month
                      <select
                        value={expiryMonth}
                        onChange={(event) => setExpiryMonth(Number(event.target.value))}
                      >
                        {Array.from({ length: 12 }, (_, index) => (
                          <option key={index + 1}>{index + 1}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Expiry year
                      <select
                        value={expiryYear}
                        onChange={(event) => setExpiryYear(Number(event.target.value))}
                      >
                        {Array.from({ length: 8 }, (_, index) => (
                          <option key={index}>{new Date().getFullYear() + index}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}
              {paymentType === 'cod' && (
                <div className="identity-card">
                  <span>₹</span>
                  <div>
                    <strong>Cash on delivery simulation</strong>
                    <p>No cash will be collected. Payment remains pending in the order record.</p>
                  </div>
                </div>
              )}
              {paymentType === 'wallet' && (
                <div className="identity-card">
                  <span>◈</span>
                  <div>
                    <strong>Demo wallet</strong>
                    <p>A fictional wallet approval will be recorded instantly.</p>
                  </div>
                </div>
              )}
              <div className="checkout-actions">
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setStep(4)}
                >
                  Back
                </button>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => void next()}
                >
                  Review order
                </button>
              </div>
            </>
          )}
          {step === 6 && (
            <>
              <p className="eyebrow">Step 6 of 7</p>
              <h1>Review and place order</h1>
              <div className="checkout-items">
                {cart.items.map((item) => (
                  <article key={item.id}>
                    <img
                      src={item.variant.images[0] ?? item.product.images[0]}
                      alt={`${item.product.name} in ${item.variant.colour}`}
                    />
                    <div>
                      <strong>{item.product.name}</strong>
                      <span>
                        {item.variant.colour} · Quantity {item.quantity}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
              <div className="review-grid">
                <article>
                  <h2>Delivery</h2>
                  <p>
                    {address.firstName} {address.lastName}
                    <br />
                    {address.street}
                    <br />
                    {address.city}, {address.state} {address.postalCode}
                    <br />
                    {address.country}
                  </p>
                </article>
                <article>
                  <h2>Method</h2>
                  <p>
                    {delivery}
                    <br />
                    {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(
                      new Date(`${deliveryDate}T12:00:00`),
                    )}
                    <br />
                    {deliveryTimeSlot}
                  </p>
                </article>
                <article>
                  <h2>Payment</h2>
                  <p>
                    {paymentType === 'card'
                      ? `Visa test ending ${cardNumber.replaceAll(' ', '').slice(-4)}`
                      : paymentType === 'cod'
                        ? 'Cash on delivery simulation'
                        : 'Demo wallet'}
                  </p>
                </article>
              </div>
              <div className="demo-notice">
                <strong>
                  By placing this order, you confirm this is a simulation and no real payment
                  occurs.
                </strong>
              </div>
              <div className="checkout-actions">
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setStep(5)}
                >
                  Back
                </button>
                <button
                  className="button button--primary"
                  type="button"
                  disabled={pending}
                  onClick={() => void placeOrder()}
                >
                  {pending ? 'Creating order…' : 'Place simulated order'}
                </button>
              </div>
            </>
          )}
          {step === 7 && (
            <div className="confirmation">
              <span className="confirmation__icon" aria-hidden="true">
                ✓
              </span>
              <p className="eyebrow">Step 7 of 7</p>
              <h1>Order confirmed</h1>
              <p>Your simulated order has been stored and is ready for UI and API assertions.</p>
              <div className="checkout-items">
                {confirmedItems.map((item) => (
                  <article key={item.id}>
                    <img
                      src={item.variant.images[0] ?? item.product.images[0]}
                      alt={`${item.product.name} in ${item.variant.colour}`}
                    />
                    <div>
                      <strong>{item.product.name}</strong>
                      <span>
                        {item.variant.colour} · Quantity {item.quantity}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
              <div className="order-number">
                <span>Order number</span>
                <strong data-testid="order-number">{orderNumber}</strong>
              </div>
              <div className="button-row">
                <Link className="button button--primary" to={`/orders/${orderNumber}`}>
                  View order
                </Link>
                <Link className="button button--secondary" to="/products">
                  Keep shopping
                </Link>
              </div>
            </div>
          )}
        </section>
        {step < 7 && <PriceSummary totals={totals} />}
      </div>
    </div>
  );
}
