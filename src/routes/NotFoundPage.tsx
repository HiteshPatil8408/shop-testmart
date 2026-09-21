import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="page container">
      <div className="state-card not-found">
        <span>404</span>
        <h1>This page took a wrong turn</h1>
        <p>The route exists only in your imagination, but the product catalogue is ready.</p>
        <Link className="button button--primary" to="/">
          Return home
        </Link>
      </div>
    </div>
  );
}
