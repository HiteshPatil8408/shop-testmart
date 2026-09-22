import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../../shared/config';
import { formatMoney } from '../../shared/lib/money';
import { useAuth } from '../app/AuthContext';
import { useCart } from '../app/CartContext';
import { SearchBox } from './SearchBox';

const nav = [
  ['Shop', '/products'],
  ['Laptops', '/category/laptops'],
  ['Tablets', '/category/tablets'],
  ['Audio', '/category/headphones'],
  ['Contact', '/contact'],
  ['UI Lab', '/ui-lab'],
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'account' | 'cart' | null>(null);
  const headerActionsRef = useRef<HTMLElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const cartTriggerRef = useRef<HTMLButtonElement>(null);
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  useEffect(() => {
    if (!openMenu) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!headerActionsRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const trigger = openMenu === 'account' ? accountTriggerRef.current : cartTriggerRef.current;
      setOpenMenu(null);
      trigger?.focus();
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openMenu]);

  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname, location.search]);

  const toggleMenu = (menu: 'account' | 'cart') => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  return (
    <header className="site-header">
      <div className="announcement">Safe QA practice store · Payments are always simulated</div>
      <div className="header-main container">
        <button
          className="mobile-menu-button icon-button"
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          ☰
        </button>
        <Link className="brand" to="/" aria-label={`${APP_CONFIG.name} home`}>
          <span className="brand__mark" aria-hidden="true">
            T
          </span>
          <span>{APP_CONFIG.name}</span>
        </Link>
        <div className="header-search">
          <SearchBox />
        </div>
        <nav className="header-actions" aria-label="Account and cart" ref={headerActionsRef}>
          <div className="menu">
            <button
              className="menu__trigger"
              type="button"
              aria-label="Account menu"
              aria-haspopup="true"
              aria-expanded={openMenu === 'account'}
              aria-controls="account-menu-panel"
              ref={accountTriggerRef}
              onClick={() => toggleMenu('account')}
            >
              <span aria-hidden="true">♙</span>
              <span className="desktop-label">{user ? `Hi, ${user.firstName}` : 'Account'}</span>
            </button>
            {openMenu === 'account' && (
              <div className="menu__panel" id="account-menu-panel">
                {user ? (
                  <>
                    <p>
                      <strong>
                        {user.firstName} {user.lastName}
                      </strong>
                      <small>{user.email}</small>
                    </p>
                    <Link to="/account" onClick={() => setOpenMenu(null)}>
                      Profile & addresses
                    </Link>
                    <Link to="/orders" onClick={() => setOpenMenu(null)}>
                      Order history
                    </Link>
                    <Link to="/returns" onClick={() => setOpenMenu(null)}>
                      Returns & attachments
                    </Link>
                    <Link to="/admin/orders" onClick={() => setOpenMenu(null)}>
                      Demo order management
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenu(null);
                        navigate('/', { replace: true });
                        void logout().catch(() => undefined);
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
                      onClick={() => setOpenMenu(null)}
                    >
                      Sign in
                    </Link>
                    <Link to="/register" onClick={() => setOpenMenu(null)}>
                      Create account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="menu mini-cart">
            <button
              className="menu__trigger"
              type="button"
              aria-label={`Cart with ${count} items`}
              aria-haspopup="true"
              aria-expanded={openMenu === 'cart'}
              aria-controls="cart-menu-panel"
              ref={cartTriggerRef}
              onClick={() => toggleMenu('cart')}
            >
              <span aria-hidden="true">🛒</span>
              <span className="desktop-label">Cart</span>
              <span className="cart-badge" data-testid="cart-badge">
                {count}
              </span>
            </button>
            {openMenu === 'cart' && (
              <div className="menu__panel mini-cart__panel" id="cart-menu-panel">
                <h2>Your cart</h2>
                {!cart?.items.length ? (
                  <p>Your cart is ready for something useful.</p>
                ) : (
                  <>
                    <ul>
                      {cart.items.slice(0, 3).map((item) => (
                        <li key={item.id}>
                          <img
                            src={item.variant.images[0] ?? item.product.images[0]}
                            alt={`${item.product.name} in ${item.variant.colour}`}
                          />
                          <span>
                            {item.product.name}
                            <small>
                              {item.quantity} × {formatMoney(item.product.pricePaise)}
                            </small>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mini-cart__total">
                      <span>Subtotal</span>
                      <strong>{formatMoney(cart.totals.subtotalPaise)}</strong>
                    </p>
                  </>
                )}
                <Link
                  className="button button--primary button--full"
                  to="/cart"
                  onClick={() => setOpenMenu(null)}
                >
                  View cart
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <div className="container">
          {nav.map(([label, href]) => (
            <NavLink key={href} to={href}>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
      {mobileOpen && (
        <div className="drawer-backdrop" onMouseDown={() => setMobileOpen(false)}>
          <aside
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mobile-drawer__top">
              <span className="brand">
                <span className="brand__mark">T</span>
                {APP_CONFIG.name}
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label="Close navigation"
                autoFocus
                onClick={() => setMobileOpen(false)}
              >
                ×
              </button>
            </div>
            <SearchBox onNavigate={() => setMobileOpen(false)} />
            <nav aria-label="Mobile navigation">
              {nav.map(([label, href]) => (
                <NavLink key={href} to={href} onClick={() => setMobileOpen(false)}>
                  {label}
                </NavLink>
              ))}
            </nav>
            {user ? (
              <Link to="/account" onClick={() => setMobileOpen(false)}>
                Your account
              </Link>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                Sign in
              </Link>
            )}
          </aside>
        </div>
      )}
    </header>
  );
}
