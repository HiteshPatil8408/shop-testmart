import { useEffect, useState, type FormEvent } from 'react';
import type { Category, Product } from '../../shared/types';
import { DEMO_SAFETY_NOTICE } from '../../shared/config';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api, ApiError, jsonBody } from '../lib/api';

export function ContactPage() {
  useDocumentTitle('Contact form testing', {
    canonicalPath: '/contact',
    description:
      'Practise dependent selects, client and server validation, pending states, error handling and successful form submission.',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  useEffect(() => {
    void api<Category[]>('/categories').then((items) => {
      setCategories(items);
      setCategoryId(items[0]?.id ?? '');
    });
  }, []);
  useEffect(() => {
    const category = categories.find((item) => item.id === categoryId);
    if (category)
      void api<Product[]>(`/products?category=${category.slug}&pageSize=24`).then(setProducts);
  }, [categoryId, categories]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setSuccess('');
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const result = await api<{ message: string }>('/contact', {
        method: 'POST',
        body: jsonBody({ ...data, categoryId }),
      });
      setSuccess(result.message);
      form.reset();
      setCategoryId(categories[0]?.id ?? '');
    } catch (reason) {
      setErrors(
        reason instanceof ApiError
          ? { ...reason.fieldErrors, form: reason.message }
          : { form: 'Unable to submit the message.' },
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="page container">
      <div className="contact-layout">
        <section>
          <p className="eyebrow">We’re listening</p>
          <h1>Contact the demo team</h1>
          <p>
            Use this form to practise dependent selects, client and server validation, pending
            states and persisted submission.
          </p>
          <div className="contact-points">
            <article>
              <span aria-hidden="true">@</span>
              <div>
                <strong>Email</strong>
                <p>help@testmart.demo</p>
              </div>
            </article>
            <article>
              <span aria-hidden="true">◷</span>
              <div>
                <strong>Demo hours</strong>
                <p>Always available locally</p>
              </div>
            </article>
            <article>
              <span aria-hidden="true">⚗</span>
              <div>
                <strong>QA ready</strong>
                <p>Try a forced 500 response in QA Lab</p>
              </div>
            </article>
          </div>
        </section>
        <section className="contact-form-card">
          <div className="demo-notice">
            <strong>{DEMO_SAFETY_NOTICE}</strong>
          </div>
          <h2>Send a demo message</h2>
          {success && (
            <div className="alert alert--success" role="status">
              {success}
            </div>
          )}
          {errors.form && (
            <div className="alert alert--error" role="alert">
              {errors.form}
            </div>
          )}
          <form onSubmit={(event) => void submit(event)} noValidate>
            <label>
              Category
              <select
                name="categoryId"
                required
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <span className="field-error">{errors.categoryId}</span>}
            </label>
            <label>
              Product
              <select name="productId" defaultValue="">
                <option value="">General category question</option>
                {products.map((product) => (
                  <option value={product.id} key={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Email address
              <input name="email" type="email" required />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>
            <label>
              Subject
              <input name="subject" required maxLength={120} />
              {errors.subject && <span className="field-error">{errors.subject}</span>}
            </label>
            <label>
              Message
              <textarea name="message" required minLength={20} maxLength={2000} rows={6} />
              <small>20–2,000 characters</small>
              {errors.message && <span className="field-error">{errors.message}</span>}
            </label>
            <button
              className="button button--primary button--full"
              type="submit"
              disabled={pending}
            >
              {pending ? 'Sending demo message…' : 'Send message'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
