import { useState } from 'react';
import { useQa } from '../app/QaContext';
import { useCart } from '../app/CartContext';
import { useToast } from '../app/ToastContext';
import { api } from '../lib/api';

export function QaPanel() {
  const [open, setOpen] = useState(false);
  const qa = useQa();
  const { refresh } = useCart();
  const toast = useToast();
  return (
    <div className={open ? 'qa-panel is-open' : 'qa-panel'} data-testid="qa-controls">
      <button
        type="button"
        className="qa-panel__toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        QA Lab <span aria-hidden="true">⚗</span>
      </button>
      {open && (
        <div className="qa-panel__body">
          <div className="qa-panel__heading">
            <h2>QA laboratory</h2>
            <button type="button" aria-label="Close QA Lab" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <p>Simulations affect only this browser session.</p>
          <label>
            API latency
            <select
              value={qa.latency}
              onChange={(event) => qa.set({ latency: Number(event.target.value) as 0 })}
            >
              <option value="0">0 ms</option>
              <option value="500">500 ms</option>
              <option value="1500">1500 ms</option>
              <option value="3000">3000 ms</option>
            </select>
          </label>
          <label>
            Force next response
            <select
              value={qa.forceStatus ?? ''}
              onChange={(event) =>
                qa.set({ forceStatus: event.target.value ? Number(event.target.value) : null })
              }
            >
              <option value="">None</option>
              {[400, 401, 403, 404, 409, 429, 500].map((status) => (
                <option value={status} key={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={qa.emptySearch}
              onChange={(event) => qa.set({ emptySearch: event.target.checked })}
            />{' '}
            Empty search results
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={qa.lowStock}
              onChange={(event) => qa.set({ lowStock: event.target.checked })}
            />{' '}
            Low-stock catalogue state
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={qa.paymentDecline}
              onChange={(event) => qa.set({ paymentDecline: event.target.checked })}
            />{' '}
            Payment decline
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={qa.sessionExpiry}
              onChange={(event) => qa.set({ sessionExpiry: event.target.checked })}
            />{' '}
            Session expiry
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={qa.offline}
              onChange={(event) => qa.set({ offline: event.target.checked })}
            />{' '}
            Offline UI
          </label>
          <div className="button-row">
            <button className="button button--secondary" type="button" onClick={qa.reset}>
              Clear simulations
            </button>
            <button
              className="button button--danger"
              type="button"
              onClick={async () => {
                qa.reset();
                await api('/qa/reset', { method: 'POST' });
                await refresh();
                toast('Current demo data reset.', 'success');
              }}
            >
              Reset demo data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
