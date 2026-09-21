import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { APP_CONFIG } from '../../shared/config';
import { useAuth } from '../app/AuthContext';
import { useToast } from '../app/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ApiError } from '../lib/api';

export function LoginPage() {
  useDocumentTitle('Sign in');
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  if (user) return <Navigate to={params.get('returnTo') || '/account'} replace />;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await login(email, password);
      toast('Welcome back.', 'success');
      navigate(params.get('returnTo') || '/account');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Unable to sign in.');
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-art">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Your next test starts here</h1>
          <p>
            Continue with a guest cart, verify order history and explore protected-route behaviour.
          </p>
        </div>
      </div>
      <section className="auth-card">
        <Link className="brand" to="/">
          <span className="brand__mark">T</span>
          {APP_CONFIG.name}
        </Link>
        <h1>Sign in</h1>
        <p>Use your demo account or the public tester below.</p>
        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={(event) => void submit(event)} noValidate>
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <div className="form-between">
            <label className="check-row">
              <input type="checkbox" /> Remember this browser
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <button className="button button--primary button--full" type="submit" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="demo-credentials">
          <strong>Public demo account</strong>
          <code>{APP_CONFIG.demoEmail}</code>
          <code>{APP_CONFIG.demoPassword}</code>
          <button
            type="button"
            className="button button--secondary button--full"
            onClick={() => {
              setEmail(APP_CONFIG.demoEmail);
              setPassword(APP_CONFIG.demoPassword);
            }}
          >
            Fill demo credentials
          </button>
          <small>Contains no real personal information.</small>
        </div>
        <p className="auth-switch">
          New to {APP_CONFIG.name}? <Link to="/register">Create a demo account</Link>
        </p>
      </section>
    </div>
  );
}
