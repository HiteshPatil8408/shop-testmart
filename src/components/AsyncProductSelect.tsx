import { useEffect, useId, useRef, useState } from 'react';
import { api } from '../lib/api';

export interface ProductOption {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  pricePaise: number;
  image: string;
}

export function AsyncProductSelect({
  selected,
  onChange,
  maximum = 3,
}: {
  selected: ProductOption[];
  onChange: (items: ProductOption[]) => void;
  maximum?: number;
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [retry, setRetry] = useState(0);
  const request = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (query.trim().length < 2 || selected.length >= maximum) {
      setOptions([]);
      setOpen(false);
      return;
    }
    const current = ++request.current;
    const timer = window.setTimeout(
      async () => {
        setLoading(true);
        setError('');
        setOpen(true);
        try {
          const result = await api<ProductOption[]>(
            `/search/suggestions?q=${encodeURIComponent(query.trim())}`,
          );
          if (current === request.current) {
            setOptions(result.filter((item) => !selected.some((value) => value.id === item.id)));
            setActive(-1);
          }
        } catch (reason) {
          if (current === request.current)
            setError(reason instanceof Error ? reason.message : 'Unable to search products.');
        } finally {
          if (current === request.current) setLoading(false);
        }
      },
      retry ? 0 : 250,
    );
    return () => window.clearTimeout(timer);
  }, [maximum, query, retry, selected]);

  const choose = (option: ProductOption) => {
    if (selected.some((item) => item.id === option.id) || selected.length >= maximum) return;
    onChange([...selected, option]);
    setQuery('');
    setOpen(false);
    setOptions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="async-select">
      <label htmlFor={`${listId}-input`}>Products to return</label>
      <p id={`${listId}-help`}>
        Search by product or manufacturer. Select up to {maximum} products.
      </p>
      {selected.length > 0 && (
        <div className="async-select__chips" aria-label="Selected products">
          {selected.map((item) => (
            <span key={item.id}>
              {item.name}
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                onClick={() => {
                  onChange(selected.filter((value) => value.id !== item.id));
                  inputRef.current?.focus();
                }}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              onChange([]);
              inputRef.current?.focus();
            }}
          >
            Clear all
          </button>
        </div>
      )}
      <div className="async-select__control">
        <input
          ref={inputRef}
          id={`${listId}-input`}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={`${listId}-list`}
          aria-expanded={open}
          aria-activedescendant={active >= 0 ? `${listId}-option-${active}` : undefined}
          aria-describedby={`${listId}-help ${listId}-status`}
          autoComplete="off"
          placeholder={selected.length >= maximum ? 'Maximum selection reached' : 'Search products'}
          value={query}
          disabled={selected.length >= maximum}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setActive((value) => Math.min(value + 1, options.length - 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((value) => Math.max(value - 1, 0));
            }
            if (event.key === 'Enter' && active >= 0 && options[active]) {
              event.preventDefault();
              choose(options[active]);
            }
            if (event.key === 'Escape') setOpen(false);
            if (event.key === 'Backspace' && !query && selected.length) {
              onChange(selected.slice(0, -1));
            }
          }}
        />
        {loading && <span className="spinner" aria-hidden="true" />}
        {open && (
          <div
            className="async-select__list"
            id={`${listId}-list`}
            role="listbox"
            aria-multiselectable="true"
          >
            {error ? (
              <div className="async-select__message" role="alert">
                <span>{error}</span>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Retry search
                </button>
              </div>
            ) : loading ? (
              <p className="async-select__message">Searching products…</p>
            ) : options.length ? (
              options.map((option, index) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  id={`${listId}-option-${index}`}
                  className={active === index ? 'is-active' : ''}
                  key={option.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                >
                  <img src={option.image} alt="" />
                  <span>
                    <strong>{option.name}</strong>
                    <small>{option.categoryName}</small>
                  </span>
                </button>
              ))
            ) : (
              <p className="async-select__message">No products match “{query}”.</p>
            )}
          </div>
        )}
      </div>
      <p className="sr-only" id={`${listId}-status`} role="status" aria-live="polite">
        {loading
          ? 'Loading product options.'
          : `${options.length} options available. ${selected.length} of ${maximum} selected.`}
      </p>
    </div>
  );
}
