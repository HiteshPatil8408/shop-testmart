import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { SECURITY_QUESTIONS } from '../../shared/config';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ApiError, api, jsonBody } from '../lib/api';

function PasswordRecoveryPage() {
  useDocumentTitle('Reset password');
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError('');
    setFieldErrors({});
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: jsonBody({
          email: data.get('email'),
          securityQuestionId: data.get('securityQuestionId'),
          securityAnswer: data.get('securityAnswer'),
          password: data.get('password'),
          confirmPassword: data.get('confirmPassword'),
        }),
      });
      form.reset();
      setComplete(true);
    } catch (reason) {
      if (reason instanceof ApiError) {
        setError(reason.message);
        setFieldErrors(reason.fieldErrors);
      } else setError('Unable to reset the password.');
    } finally {
      setPending(false);
    }
  };

  const fieldError = (name: string) =>
    fieldErrors[name] ? (
      <span className="field-error" id={`${name}-error`}>
        {fieldErrors[name]}
      </span>
    ) : null;

  return (
    <div className="narrow-page">
      <section className="auth-card password-recovery-card">
        <h1>Reset password</h1>
        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}

        {complete ? (
          <div className="alert alert--success" role="status">
            Password updated. Your existing sessions have been signed out.{' '}
            <Link to="/login">Sign in</Link>
          </div>
        ) : (
          <>
            <p>
              Enter the security question and answer chosen when the account was created. For
              protection, an account password can be reset only once every 24 hours.
            </p>
            <div className="demo-notice" role="note">
              Your answer acts like a recovery password. Keep it private. The public demo account
              cannot be reset.
            </div>
            <form onSubmit={(event) => void resetPassword(event)} noValidate>
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
                {fieldError('email')}
              </label>
              <label>
                Security question
                <select
                  name="securityQuestionId"
                  defaultValue=""
                  required
                  aria-describedby={
                    fieldErrors.securityQuestionId ? 'securityQuestionId-error' : undefined
                  }
                >
                  <option value="" disabled>
                    Choose your question
                  </option>
                  {SECURITY_QUESTIONS.map((question) => (
                    <option key={question.id} value={question.id}>
                      {question.label}
                    </option>
                  ))}
                </select>
                {fieldError('securityQuestionId')}
              </label>
              <label>
                Security answer
                <input
                  name="securityAnswer"
                  type="password"
                  autoComplete="off"
                  required
                  minLength={3}
                  maxLength={128}
                  aria-describedby={fieldErrors.securityAnswer ? 'securityAnswer-error' : undefined}
                />
                {fieldError('securityAnswer')}
              </label>
              <label>
                New password
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  aria-describedby="new-password-help password-error"
                  required
                />
                <small id="new-password-help" className="muted">
                  Use at least 10 characters with uppercase, lowercase, number, and special
                  character.
                </small>
                {fieldError('password')}
              </label>
              <label>
                Confirm new password
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  aria-describedby={
                    fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined
                  }
                />
                {fieldError('confirmPassword')}
              </label>
              <button className="button button--primary button--full" disabled={pending}>
                {pending ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
            <p>
              <Link to="/login">← Back to sign in</Link>
            </p>
          </>
        )}
      </section>
    </div>
  );
}

export function ForgotPasswordPage() {
  return <PasswordRecoveryPage />;
}

export function ResetPasswordPage() {
  return <PasswordRecoveryPage />;
}
