import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../shared/config';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand brand--light" to="/">
            <span className="brand__mark">T</span>
            {APP_CONFIG.name}
          </Link>
          <p>A free, deterministic UI testing environment for modern test automation.</p>
        </div>
        <div>
          <h2>Shop</h2>
          <Link to="/products">All products</Link>
          <Link to="/category/laptops">Laptops</Link>
          <Link to="/category/speakers">Speakers</Link>
        </div>
        <div>
          <h2>Help</h2>
          <Link to="/contact">Contact</Link>
          <Link to="/api-docs">API documentation</Link>
          <Link to="/?qa=1">QA laboratory</Link>
        </div>
        <div>
          <h2>Demo safety</h2>
          <p>
            Never enter real personal or payment information. No financial transaction is performed.
          </p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 {APP_CONFIG.name}</span>
        <span>Built for practice, not real commerce.</span>
      </div>
    </footer>
  );
}
