import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_CONFIG, DEMO_SAFETY_NOTICE, SECURITY_QUESTIONS } from '../../shared/config';
import { useAuth } from '../app/AuthContext';
import { useToast } from '../app/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ApiError } from '../lib/api';

export function RegisterPage() {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setErrors({});
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data.entries()) as Record<string, unknown>;
    payload.marketingOptIn = data.has('marketingOptIn');
    payload.termsAccepted = data.has('termsAccepted');
    payload.isDefault = true;
    payload.label = 'Home';
    try {
      await register(payload);
      toast('Your demo account is ready.', 'success');
      navigate('/account');
    } catch (reason) {
      if (reason instanceof ApiError) setErrors({ ...reason.fieldErrors, form: reason.message });
      else setErrors({ form: 'Unable to register.' });
    } finally {
      setPending(false);
    }
  };
  const error = (name: string) =>
    errors[name] ? (
      <span className="field-error" id={`${name}-error`}>
        {errors[name]}
      </span>
    ) : null;
  return (
    <div className="registration-page">
      <section className="registration-card">
        <Link className="brand" to="/">
          <span className="brand__mark">T</span>
          {APP_CONFIG.name}
        </Link>
        <div className="page-title">
          <div>
            <p className="eyebrow">Public practice environment</p>
            <h1>Create a demo account</h1>
            <p>Fields are realistic so you can practise validation and automation.</p>
          </div>
        </div>
        <div className="demo-notice" role="note">
          ⚠ <strong>{DEMO_SAFETY_NOTICE}</strong>
        </div>
        {errors.form && (
          <div className="alert alert--error" role="alert">
            {errors.form}
          </div>
        )}
        <form className="form-grid" onSubmit={(event) => void submit(event)} noValidate>
          <h2>Account details</h2>
          <label>
            Username
            <input
              name="username"
              required
              minLength={3}
              autoComplete="username"
              aria-describedby={errors.username ? 'username-error' : undefined}
            />
            {error('username')}
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {error('email')}
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              aria-describedby="password-help password-error"
            />
            <small id="password-help">
              10+ characters with uppercase, lowercase, number and symbol.
            </small>
            {error('password')}
          </label>
          <label>
            Confirm password
            <input name="confirmPassword" type="password" required autoComplete="new-password" />
            {error('confirmPassword')}
          </label>
          <div className="demo-notice form-grid__wide" role="note">
            <strong>Your security answer protects password recovery.</strong> Choose an answer you
            will remember but other people cannot easily discover. It cannot be displayed or
            recovered later, and you will need it if you forget your password.
          </div>
          <label>
            Security question
            <select
              name="securityQuestionId"
              defaultValue=""
              required
              aria-describedby={errors.securityQuestionId ? 'securityQuestionId-error' : undefined}
            >
              <option value="" disabled>
                Choose a question
              </option>
              {SECURITY_QUESTIONS.map((question) => (
                <option key={question.id} value={question.id}>
                  {question.label}
                </option>
              ))}
            </select>
            {error('securityQuestionId')}
          </label>
          <label>
            Security answer
            <input
              name="securityAnswer"
              type="password"
              required
              minLength={3}
              maxLength={128}
              autoComplete="off"
              aria-describedby="security-answer-help securityAnswer-error"
            />
            <small id="security-answer-help">
              Answers ignore capitalisation and repeated spaces. Do not use your password.
            </small>
            {error('securityAnswer')}
          </label>
          <h2>Delivery details</h2>
          <label>
            First name
            <input name="firstName" required autoComplete="given-name" />
            {error('firstName')}
          </label>
          <label>
            Last name
            <input name="lastName" required autoComplete="family-name" />
            {error('lastName')}
          </label>
          <label>
            Phone number
            <input name="phone" type="tel" required autoComplete="tel" />
            {error('phone')}
          </label>
          <label>
            Country
            <select name="country" defaultValue="India" required>
              <option>India</option>
              <option>Singapore</option>
              <option>United Kingdom</option>
            </select>
            {error('country')}
          </label>
          <label className="form-grid__wide">
            Street address
            <input name="street" required autoComplete="street-address" />
            {error('street')}
          </label>
          <label>
            City
            <input name="city" required autoComplete="address-level2" />
            {error('city')}
          </label>
          <label>
            State
            <input name="state" required autoComplete="address-level1" />
            {error('state')}
          </label>
          <label>
            Postal code
            <input name="postalCode" required autoComplete="postal-code" />
            {error('postalCode')}
          </label>
          <div className="form-grid__wide checks">
            <label className="check-row">
              <input type="checkbox" name="marketingOptIn" /> Send occasional fictional offers
            </label>
            <label className="check-row">
              <input type="checkbox" name="termsAccepted" required /> I accept the demo terms and
              understand no real purchase is made
            </label>
            {error('termsAccepted')}
          </div>
          <button
            className="button button--primary form-grid__wide"
            type="submit"
            disabled={pending}
          >
            {pending ? 'Creating account…' : 'Create demo account'}
          </button>
        </form>
        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}
