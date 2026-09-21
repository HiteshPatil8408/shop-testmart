import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMoney } from '../../shared/lib/money';
import { api } from '../lib/api';

interface Suggestion {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  pricePaise: number;
  image: string;
}

export function SearchBox({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const navigate = useNavigate();
  const listId = useId();
  const request = useRef(0);
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const current = ++request.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const result = await api<Suggestion[]>(
          `/search/suggestions?q=${encodeURIComponent(query.trim())}`,
        );
        if (request.current === current) {
          setSuggestions(result);
          setOpen(true);
          setActive(-1);
        }
      } finally {
        if (request.current === current) setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  const submit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    onNavigate?.();
  };
  return (
    <form
      className="search-box"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label className="sr-only" htmlFor={`${listId}-input`}>
        Search products
      </label>
      <span className="search-box__icon" aria-hidden="true">
        ⌕
      </span>
      <input
        id={`${listId}-input`}
        type="search"
        value={query}
        placeholder="Search products"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => query.length >= 2 && setOpen(true)}
        onKeyDown={(event) => {
          if (!open) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((value) => Math.min(value + 1, suggestions.length));
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((value) => Math.max(value - 1, -1));
          }
          if (event.key === 'Escape') setOpen(false);
          if (event.key === 'Enter' && active >= 0 && active < suggestions.length) {
            event.preventDefault();
            navigate(`/products/${suggestions[active].slug}`);
            setOpen(false);
            onNavigate?.();
          }
        }}
      />
      {query && (
        <button
          type="button"
          className="search-box__clear"
          aria-label="Clear search"
          onClick={() => {
            setQuery('');
            setOpen(false);
          }}
        >
          ×
        </button>
      )}
      <button type="submit" className="search-box__submit">
        Search
      </button>
      {open && (
        <div className="suggestions" id={listId} role="listbox">
          {loading ? (
            <p className="suggestions__status" role="status">
              <span className="spinner" /> Finding products…
            </p>
          ) : suggestions.length ? (
            <>
              {suggestions.map((item, index) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={active === index}
                  id={`${listId}-${index}`}
                  className={active === index ? 'suggestion is-active' : 'suggestion'}
                  key={item.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    navigate(`/products/${item.slug}`);
                    setOpen(false);
                    onNavigate?.();
                  }}
                >
                  <img src={item.image} alt="" width="48" height="48" />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.categoryName}</small>
                  </span>
                  <span>{formatMoney(item.pricePaise)}</span>
                </button>
              ))}
              <button
                type="button"
                role="option"
                aria-selected={active === suggestions.length}
                id={`${listId}-${suggestions.length}`}
                className={
                  active === suggestions.length
                    ? 'suggestion suggestion--all is-active'
                    : 'suggestion suggestion--all'
                }
                onClick={submit}
              >
                View all results for “{query}”
              </button>
            </>
          ) : (
            <p className="suggestions__status">No matching products. Try another term.</p>
          )}
        </div>
      )}
    </form>
  );
}
