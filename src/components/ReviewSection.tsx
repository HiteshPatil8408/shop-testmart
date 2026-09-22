import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { ProductReview, ReviewSummary } from '../../shared/types';
import { useAuth } from '../app/AuthContext';
import { useToast } from '../app/ToastContext';
import { api, apiEnvelope, ApiError, jsonBody } from '../lib/api';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState, ErrorState } from './Feedback';

interface ReviewData {
  reviews: ProductReview[];
  summary: ReviewSummary;
}

export function ReviewSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [data, setData] = useState<ReviewData | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [sort, setSort] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<ProductReview | null>(null);
  const [deleteReview, setDeleteReview] = useState<ProductReview | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiEnvelope<ReviewData>(
        `/products/${productId}/reviews?page=${page}&sort=${sort}${ratingFilter ? `&rating=${ratingFilter}` : ''}`,
      );
      setData(result.data);
      setPages((result.meta.pagination as { pages: number }).pages || 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [page, productId, ratingFilter, sort]);

  useEffect(() => void load(), [load]);

  const resetForm = () => {
    setEditing(null);
    setRating(5);
    setTitle('');
    setMessage('');
    setFormErrors({});
  };

  const beginEdit = (review: ProductReview) => {
    setEditing(review);
    setRating(review.rating);
    setTitle(review.title);
    setMessage(review.message);
    setFormErrors({});
    document.getElementById('review-form-heading')?.scrollIntoView({ behavior: 'smooth' });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (title.trim().length < 4) errors.title = 'Use at least 4 characters.';
    if (message.trim().length < 20) errors.message = 'Use at least 20 characters.';
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setPending(true);
    setFormErrors({});
    try {
      await api(editing ? `/reviews/${editing.id}` : `/products/${productId}/reviews`, {
        method: editing ? 'PATCH' : 'POST',
        body: jsonBody({ rating, title, message }),
      });
      toast(editing ? 'Your review was updated.' : 'Your review was published.', 'success');
      resetForm();
      setPage(1);
      await load();
    } catch (reason) {
      if (reason instanceof ApiError)
        setFormErrors({ ...reason.fieldErrors, form: reason.message });
      else setFormErrors({ form: 'Unable to save the review.' });
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="reviews" aria-labelledby="reviews-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Deterministic community feedback</p>
          <h2 id="reviews-heading">Product reviews</h2>
        </div>
      </div>
      {data && (
        <div className="review-summary" aria-label="Review summary">
          <div className="review-summary__average">
            <strong>{data.summary.average.toFixed(1)}</strong>
            <span role="img" aria-label={`${data.summary.average.toFixed(1)} out of 5 stars`}>
              <span aria-hidden="true">★★★★★</span>
            </span>
            <small>{data.summary.total} reviews</small>
          </div>
          <div className="review-summary__bars">
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                type="button"
                aria-pressed={ratingFilter === star}
                key={star}
                onClick={() => {
                  setRatingFilter((value) => (value === star ? 0 : star));
                  setPage(1);
                }}
              >
                <span>{star} star</span>
                <span className="review-bar" aria-hidden="true">
                  <i
                    style={{
                      width: `${data.summary.total ? (data.summary.byRating[star as 1 | 2 | 3 | 4 | 5] / data.summary.total) * 100 : 0}%`,
                    }}
                  />
                </span>
                <span>{data.summary.byRating[star as 1 | 2 | 3 | 4 | 5]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="review-layout">
        <div>
          <div className="review-toolbar">
            <label>
              Sort reviews
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="highest">Highest rating</option>
                <option value="lowest">Lowest rating</option>
                <option value="helpful">Most helpful</option>
              </select>
            </label>
            {ratingFilter > 0 && (
              <button className="link-button" type="button" onClick={() => setRatingFilter(0)}>
                Clear {ratingFilter}-star filter
              </button>
            )}
          </div>
          <p className="sr-only" aria-live="polite">
            {loading ? 'Loading reviews.' : `${data?.reviews.length ?? 0} reviews shown.`}
          </p>
          {loading ? (
            <div className="review-skeleton" role="status" aria-label="Loading reviews">
              <span className="skeleton" />
              <span className="skeleton" />
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={() => void load()} />
          ) : !data?.reviews.length ? (
            <EmptyState
              title="No matching reviews"
              message={
                ratingFilter
                  ? 'Try a different star rating or clear the filter.'
                  : 'Be the first signed-in tester to add a review.'
              }
            />
          ) : (
            <div className="review-list">
              {data.reviews.map((review) => (
                <article key={review.id}>
                  <div className="review-list__top">
                    <div>
                      <strong>{review.title}</strong>
                      <span role="img" aria-label={`${review.rating} out of 5 stars`}>
                        <span aria-hidden="true">
                          {'★'.repeat(review.rating)}
                          {'☆'.repeat(5 - review.rating)}
                        </span>
                      </span>
                    </div>
                    <time dateTime={review.createdAt}>
                      {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(
                        new Date(review.createdAt),
                      )}
                    </time>
                  </div>
                  <p>{review.message}</p>
                  <footer>
                    <span>By {review.authorName}</span>
                    <button
                      type="button"
                      className="button button--secondary"
                      aria-pressed={review.helpfulByMe}
                      onClick={async () => {
                        try {
                          await api(`/reviews/${review.id}/helpful`, { method: 'POST' });
                          await load();
                        } catch (reason) {
                          toast(
                            reason instanceof Error
                              ? reason.message
                              : 'Unable to update helpfulness.',
                            'error',
                          );
                        }
                      }}
                    >
                      Helpful ({review.helpfulCount})
                    </button>
                    {review.isOwn && (
                      <>
                        <button
                          className="link-button"
                          type="button"
                          onClick={() => beginEdit(review)}
                        >
                          Edit
                        </button>
                        <button
                          className="link-button danger"
                          type="button"
                          onClick={() => setDeleteReview(review)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </footer>
                </article>
              ))}
              {pages > 1 && (
                <nav className="pagination" aria-label="Review pages">
                  <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </button>
                  <span>
                    Page {page} of {pages}
                  </span>
                  <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                    Next
                  </button>
                </nav>
              )}
            </div>
          )}
        </div>
        <aside className="review-form-card">
          <h3 id="review-form-heading">{editing ? 'Edit your review' : 'Write a review'}</h3>
          {!user ? (
            <p>
              <Link to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}>Sign in</Link>{' '}
              to publish, edit, or mark reviews helpful.
            </p>
          ) : (
            <form onSubmit={(event) => void submit(event)} noValidate>
              {formErrors.form && (
                <div className="alert alert--error" role="alert">
                  {formErrors.form}
                </div>
              )}
              <fieldset className="star-input">
                <legend>Your rating</legend>
                <div>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="review-rating"
                        value={value}
                        checked={rating === value}
                        onChange={() => setRating(value)}
                      />
                      <span aria-hidden="true">★</span>
                      <span className="sr-only">
                        {value} star{value > 1 ? 's' : ''}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>
                Review title
                <input
                  value={title}
                  maxLength={80}
                  aria-invalid={Boolean(formErrors.title)}
                  aria-describedby="review-title-count review-title-error"
                  onChange={(event) => setTitle(event.target.value)}
                />
                <small id="review-title-count">{title.length}/80 characters</small>
                {formErrors.title && (
                  <span className="field-error" id="review-title-error">
                    {formErrors.title}
                  </span>
                )}
              </label>
              <label>
                Review
                <textarea
                  value={message}
                  maxLength={1000}
                  rows={6}
                  aria-invalid={Boolean(formErrors.message)}
                  aria-describedby="review-message-count review-message-error"
                  onChange={(event) => setMessage(event.target.value)}
                />
                <small id="review-message-count" aria-live="polite">
                  {message.length}/1,000 characters
                </small>
                {formErrors.message && (
                  <span className="field-error" id="review-message-error">
                    {formErrors.message}
                  </span>
                )}
              </label>
              <div className="button-row">
                <button className="button button--primary" disabled={pending}>
                  {pending ? 'Submitting…' : editing ? 'Update review' : 'Submit review'}
                </button>
                {editing && (
                  <button className="button button--secondary" type="button" onClick={resetForm}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          )}
        </aside>
      </div>
      <ConfirmDialog
        open={Boolean(deleteReview)}
        title="Delete your review?"
        onClose={() => setDeleteReview(null)}
        confirmLabel="Delete review"
        destructive
        successMessage="Your review was deleted."
        onConfirm={async () => {
          if (!deleteReview) return;
          await api(`/reviews/${deleteReview.id}`, { method: 'DELETE' });
          await load();
          toast('Your review was deleted.', 'info');
        }}
      >
        <p>This permanently removes your review from the public demo data.</p>
      </ConfirmDialog>
    </section>
  );
}
