import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';
import { QaPanel } from './QaPanel';

export function Layout() {
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const qaEnabled =
    import.meta.env.DEV ||
    new URLSearchParams(location.search).get('qa') === '1' ||
    sessionStorage.getItem('tm_qa_enabled') === '1';
  useEffect(() => {
    if (new URLSearchParams(location.search).get('qa') === '1')
      sessionStorage.setItem('tm_qa_enabled', '1');
  }, [location.search]);
  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      previousPath.current = location.pathname;
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header />
      {import.meta.env.VITE_STATIC_PREVIEW === 'true' && (
        <div className="preview-banner" role="note">
          GitHub Pages preview — account, cart, checkout and contact actions are simulated in this
          browser’s local storage.
        </div>
      )}
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      {qaEnabled && <QaPanel />}
    </>
  );
}
