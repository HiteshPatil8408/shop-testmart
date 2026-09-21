import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="page-loader" role="status">
        <span className="spinner" /> Checking your session…
      </div>
    );
  if (!user)
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  return <Outlet />;
}
