import { formatMoney } from '../../shared/lib/money';
import type { CartTotals } from '../../shared/types';

export function PriceSummary({ totals, action }: { totals: CartTotals; action?: React.ReactNode }) {
  return (
    <aside className="price-summary" data-testid="price-summary" aria-label="Price summary">
      <h2>Price summary</h2>
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMoney(totals.subtotalPaise)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{totals.shippingPaise ? formatMoney(totals.shippingPaise) : 'Free'}</dd>
        </div>
        <div>
          <dt>Tax (18%)</dt>
          <dd>{formatMoney(totals.taxPaise)}</dd>
        </div>
        <div className="price-summary__total">
          <dt>Total</dt>
          <dd>{formatMoney(totals.totalPaise)}</dd>
        </div>
      </dl>
      {action}
      <p className="fine-print">Totals are calculated in integer paise. Payment is simulated.</p>
    </aside>
  );
}
