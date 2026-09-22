import { useEffect, useState, type FormEvent } from 'react';
import { APP_CONFIG, SECURITY_QUESTIONS } from '../../shared/config';
import type { Address, User } from '../../shared/types';
import { useAuth } from '../app/AuthContext';
import { useToast } from '../app/ToastContext';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api, jsonBody } from '../lib/api';

export function AccountPage() {
  useDocumentTitle('Your account');
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<'profile' | 'addresses' | 'security'>('profile');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const isDemoUser = user?.email.toLowerCase() === APP_CONFIG.demoEmail.toLowerCase();
  const loadAddresses = () => api<Address[]>('/addresses').then(setAddresses);
  useEffect(() => {
    void loadAddresses().catch(() => setAddresses([]));
  }, []);
  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      await api<User>('/profile', {
        method: 'PATCH',
        body: jsonBody({
          firstName: data.get('firstName'),
          lastName: data.get('lastName'),
          phone: data.get('phone'),
          marketingOptIn: data.has('marketingOptIn'),
        }),
      });
      await refresh();
      toast('Profile updated.', 'success');
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : 'Unable to update profile.', 'error');
    } finally {
      setPending(false);
    }
  };
  const addAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await api('/addresses', { method: 'POST', body: jsonBody({ ...data, isDefault: false }) });
      await loadAddresses();
      setAdding(false);
      toast('Address saved.', 'success');
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : 'Unable to save address.', 'error');
    } finally {
      setPending(false);
    }
  };
  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await api('/account/password', {
        method: 'POST',
        body: jsonBody({
          currentPassword: data.get('currentPassword'),
          password: data.get('password'),
          confirmPassword: data.get('confirmPassword'),
        }),
      });
      form.reset();
      toast('Password updated. Other signed-in sessions were ended.', 'success');
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : 'Unable to update password.', 'error');
    } finally {
      setPending(false);
    }
  };
  const updateSecurityQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await api('/account/security-question', {
        method: 'POST',
        body: jsonBody({
          currentPassword: data.get('currentPassword'),
          securityQuestionId: data.get('securityQuestionId'),
          securityAnswer: data.get('securityAnswer'),
        }),
      });
      form.reset();
      toast('Security question updated.', 'success');
    } catch (reason) {
      toast(
        reason instanceof Error ? reason.message : 'Unable to update the security question.',
        'error',
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="page container">
      <div className="account-header">
        <div className="account-avatar" aria-hidden="true">
          {user?.firstName[0]}
          {user?.lastName[0]}
        </div>
        <div>
          <p className="eyebrow">Your account</p>
          <h1>
            {user?.firstName} {user?.lastName}
          </h1>
          <p>{user?.email}</p>
        </div>
      </div>
      <div className="account-layout">
        <nav className="account-nav" aria-label="Account sections">
          <button
            type="button"
            aria-current={tab === 'profile' ? 'page' : undefined}
            onClick={() => setTab('profile')}
          >
            Profile
          </button>
          <button
            type="button"
            aria-current={tab === 'addresses' ? 'page' : undefined}
            onClick={() => setTab('addresses')}
          >
            Saved addresses
          </button>
          {!isDemoUser && (
            <button
              type="button"
              aria-current={tab === 'security' ? 'page' : undefined}
              onClick={() => setTab('security')}
            >
              Password &amp; security
            </button>
          )}
          <a href="/orders">Order history</a>
          <a href="/returns">Returns & attachments</a>
          <a href="/admin/orders">Demo order management</a>
        </nav>
        <section className="account-content">
          {tab === 'profile' ? (
            <>
              <h2>Profile details</h2>
              <p>Update the fictional details attached to this practice account.</p>
              <form className="form-grid" onSubmit={(event) => void saveProfile(event)}>
                <label>
                  Username
                  <input value={user?.username ?? ''} disabled />
                </label>
                <label>
                  Email
                  <input value={user?.email ?? ''} disabled />
                </label>
                <label>
                  First name
                  <input name="firstName" defaultValue={user?.firstName} required />
                </label>
                <label>
                  Last name
                  <input name="lastName" defaultValue={user?.lastName} required />
                </label>
                <label>
                  Phone
                  <input name="phone" type="tel" defaultValue={user?.phone} required />
                </label>
                <label className="check-row form-grid__wide">
                  <input
                    type="checkbox"
                    name="marketingOptIn"
                    defaultChecked={user?.marketingOptIn}
                  />{' '}
                  Receive fictional marketing messages
                </label>
                <button className="button button--primary" disabled={pending}>
                  {pending ? 'Saving…' : 'Save profile'}
                </button>
              </form>
            </>
          ) : tab === 'addresses' ? (
            <>
              <div className="section-heading">
                <div>
                  <h2>Saved addresses</h2>
                  <p>Manage addresses used by the simulated checkout.</p>
                </div>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => setAdding(true)}
                >
                  Add address
                </button>
              </div>
              <div className="address-grid">
                {addresses.map((address) => (
                  <article className="address-card" key={address.id}>
                    {address.isDefault && <span className="badge">Default</span>}
                    <h3>{address.label}</h3>
                    <p>
                      {address.firstName} {address.lastName}
                      <br />
                      {address.street}
                      <br />
                      {address.city}, {address.state} {address.postalCode}
                      <br />
                      {address.country}
                      <br />
                      {address.phone}
                    </p>
                    <button
                      className="link-button danger"
                      type="button"
                      aria-label={`Remove ${address.label}`}
                      onClick={() => setAddressToDelete(address)}
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            </>
          ) : !isDemoUser ? (
            <>
              <h2>Password &amp; security</h2>
              <p>Confirm your current password before choosing a new one.</p>
              <form className="form-grid" onSubmit={(event) => void changePassword(event)}>
                <label className="form-grid__wide">
                  Current password
                  <input
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </label>
                <label>
                  New password
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    aria-describedby="account-password-help"
                    required
                  />
                  <small id="account-password-help">
                    At least 10 characters with uppercase, lowercase, number, and special character.
                  </small>
                </label>
                <label>
                  Confirm new password
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                </label>
                <button className="button button--primary" disabled={pending}>
                  {pending ? 'Updating…' : 'Update password'}
                </button>
              </form>
              <h3>Recovery security question</h3>
              <p>
                Set or replace your recovery question. Your answer is stored as a one-way hash and
                cannot be displayed later, so choose something memorable and private.
              </p>
              <form className="form-grid" onSubmit={(event) => void updateSecurityQuestion(event)}>
                <label className="form-grid__wide">
                  Current password
                  <input
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </label>
                <label>
                  Security question
                  <select name="securityQuestionId" defaultValue="" required>
                    <option value="" disabled>
                      Choose a question
                    </option>
                    {SECURITY_QUESTIONS.map((question) => (
                      <option key={question.id} value={question.id}>
                        {question.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Security answer
                  <input
                    name="securityAnswer"
                    type="password"
                    autoComplete="off"
                    minLength={3}
                    maxLength={128}
                    required
                  />
                </label>
                <button className="button button--secondary" disabled={pending}>
                  {pending ? 'Saving…' : 'Update security question'}
                </button>
              </form>
            </>
          ) : null}
        </section>
      </div>
      <Modal open={adding} title="Add delivery address" onClose={() => setAdding(false)}>
        <form className="form-grid" onSubmit={(event) => void addAddress(event)}>
          <label>
            Label
            <input name="label" defaultValue="Work" required />
          </label>
          <label>
            First name
            <input name="firstName" defaultValue={user?.firstName} required />
          </label>
          <label>
            Last name
            <input name="lastName" defaultValue={user?.lastName} required />
          </label>
          <label>
            Phone
            <input name="phone" defaultValue={user?.phone} required />
          </label>
          <label className="form-grid__wide">
            Street address
            <input name="street" required />
          </label>
          <label>
            City
            <input name="city" required />
          </label>
          <label>
            State
            <input name="state" required />
          </label>
          <label>
            Postal code
            <input name="postalCode" required />
          </label>
          <label>
            Country
            <select name="country" defaultValue="India">
              <option>India</option>
              <option>Singapore</option>
              <option>United Kingdom</option>
            </select>
          </label>
          <button className="button button--primary form-grid__wide" disabled={pending}>
            {pending ? 'Saving…' : 'Save address'}
          </button>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(addressToDelete)}
        title={`Delete ${addressToDelete?.label ?? 'saved address'}?`}
        onClose={() => setAddressToDelete(null)}
        confirmLabel="Delete address"
        destructive
        successMessage="The saved address was deleted."
        onConfirm={async () => {
          if (!addressToDelete) return;
          await api(`/addresses/${addressToDelete.id}`, { method: 'DELETE' });
          await loadAddresses();
          toast('Address removed.', 'info');
        }}
      >
        <p>This address will no longer be available during simulated checkout.</p>
      </ConfirmDialog>
    </div>
  );
}
