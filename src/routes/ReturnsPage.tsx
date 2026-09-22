import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AsyncProductSelect, type ProductOption } from '../components/AsyncProductSelect';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FileUpload } from '../components/FileUpload';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function ReturnsPage() {
  useDocumentTitle('Returns and support attachments', { noIndex: true });
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [reason, setReason] = useState('damaged');
  const [notes, setNotes] = useState('');
  const [dirty, setDirty] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!products.length) return;
    setSubmitted(true);
    setDirty(false);
  };

  if (submitted)
    return (
      <div className="page container narrow-content">
        <div className="state-card" role="status">
          <span className="state-card__icon" aria-hidden="true">
            ✓
          </span>
          <h1>Return request simulated</h1>
          <p>No files left this browser and no real return was created.</p>
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              setSubmitted(false);
              setProducts([]);
              setNotes('');
            }}
          >
            Start another return
          </button>
        </div>
      </div>
    );

  return (
    <div className="page container returns-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">Safe browser-only workflow</p>
          <h1>Start a return request</h1>
          <p>
            Practise async selection, validation, file progress, cancellation, failure and retry.
          </p>
        </div>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => (dirty ? setShowWarning(true) : navigate('/orders'))}
        >
          Back to orders
        </button>
      </div>
      <div className="demo-notice" role="note">
        Attach only fictional test files. Files remain in memory in this browser and are never sent
        to a third party.
      </div>
      <form className="return-form" onSubmit={submit} onChange={() => setDirty(true)}>
        <section className="return-card">
          <h2>Return details</h2>
          <AsyncProductSelect
            selected={products}
            onChange={(items) => {
              setProducts(items);
              setDirty(true);
            }}
          />
          {!products.length && (
            <p className="field-hint">Select at least one product before submitting.</p>
          )}
          <label>
            Reason for return
            <select value={reason} onChange={(event) => setReason(event.target.value)}>
              <option value="damaged">Arrived damaged</option>
              <option value="different">Different from description</option>
              <option value="missing">Missing parts</option>
              <option value="other">Other demo reason</option>
            </select>
          </label>
          <label>
            Additional notes
            <textarea
              value={notes}
              maxLength={500}
              rows={5}
              onChange={(event) => setNotes(event.target.value)}
            />
            <small>{notes.length}/500 characters</small>
          </label>
        </section>
        <FileUpload onDirty={() => setDirty(true)} />
        <button className="button button--primary" type="submit" disabled={!products.length}>
          Submit demo return
        </button>
      </form>
      <ConfirmDialog
        open={showWarning}
        title="Discard this return request?"
        onClose={() => setShowWarning(false)}
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        destructive
        successMessage="Draft discarded."
        onConfirm={async () => {
          setDirty(false);
          navigate('/orders');
        }}
      >
        <p>Your selected products, notes, and attachment progress will be lost.</p>
      </ConfirmDialog>
    </div>
  );
}
