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
  const simulations = [
    ['emptySearch', 'Empty search results'],
    ['lowStock', 'Low-stock catalogue state'],
    ['paymentDecline', 'Payment decline'],
    ['sessionExpiry', 'Session expiry'],
    ['offline', 'Offline UI'],
    ['uploadFailure', 'Upload failure'],
    ['slowUpload', 'Slow upload'],
    ['reviewSubmissionFailure', 'Review submission failure'],
    ['duplicateSubmission', 'Duplicate submission'],
    ['serverValidation', 'Server validation response'],
    ['orderEventDelay', 'Order event delay'],
    ['orderEventDisconnection', 'Order event disconnection'],
    ['optimisticUpdateRejection', 'Optimistic-update rejection'],
    ['emptyTable', 'Empty order table'],
    ['largeDataset', 'Large order dataset'],
    ['expiredCart', 'Expired cart'],
    ['priceChanged', 'Price changed after cart add'],
    ['stockChanged', 'Stock changed after cart add'],
    ['dateSlotUnavailable', 'Date slot becomes unavailable'],
  ] as const;
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
          <label>
            Failure duration
            <select
              value={qa.failureMode}
              onChange={(event) =>
                qa.set({ failureMode: event.target.value as 'once' | 'persistent' })
              }
            >
              <option value="once">One-time failure</option>
              <option value="persistent">Persistent failure</option>
            </select>
          </label>
          <details className="qa-panel__simulations" open>
            <summary>Scenario simulations</summary>
            {simulations.map(([key, label]) => (
              <label className="check-row" key={key}>
                <input
                  type="checkbox"
                  checked={qa[key]}
                  onChange={(event) => qa.set({ [key]: event.target.checked })}
                />{' '}
                {label}
              </label>
            ))}
          </details>
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
