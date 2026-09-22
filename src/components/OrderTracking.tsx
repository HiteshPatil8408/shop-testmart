import { useCallback, useEffect, useRef, useState } from 'react';
import type { OrderStatus, TrackingEvent } from '../../shared/types';
import { useQa } from '../app/QaContext';
import { api } from '../lib/api';
import { ErrorState } from './Feedback';

const steps: Array<[OrderStatus, string]> = [
  ['confirmed', 'Confirmed'],
  ['packed', 'Packed'],
  ['shipped', 'Shipped'],
  ['out_for_delivery', 'Out for delivery'],
  ['delivered', 'Delivered'],
];

type Connection = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'complete';

export function OrderTracking({ orderNumber }: { orderNumber: string }) {
  const qa = useQa();
  const [source, setSource] = useState<TrackingEvent[]>([]);
  const [accepted, setAccepted] = useState<TrackingEvent[]>([]);
  const [connection, setConnection] = useState<Connection>('connecting');
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('Connecting to demo tracking.');
  const index = useRef(0);
  const nextSequence = useRef(1);
  const seen = useRef(new Set<string>());
  const buffered = useRef(new Map<number, TrackingEvent>());
  const timer = useRef<number | null>(null);

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  };

  const accept = useCallback((event: TrackingEvent) => {
    if (seen.current.has(event.id) || event.sequence < nextSequence.current) {
      setAnnouncement(`Duplicate tracking event ${event.sequence} ignored.`);
      return;
    }
    if (event.sequence > nextSequence.current) {
      buffered.current.set(event.sequence, event);
      setAnnouncement(`Out-of-order event ${event.sequence} buffered.`);
      return;
    }
    const ready: TrackingEvent[] = [event];
    seen.current.add(event.id);
    nextSequence.current += 1;
    while (buffered.current.has(nextSequence.current)) {
      const next = buffered.current.get(nextSequence.current)!;
      buffered.current.delete(nextSequence.current);
      if (!seen.current.has(next.id)) {
        ready.push(next);
        seen.current.add(next.id);
      }
      nextSequence.current += 1;
    }
    setAccepted((current) => [...current, ...ready]);
    setAnnouncement(ready.map((item) => item.label).join('. '));
  }, []);

  const deliverNext = useCallback(() => {
    if (index.current >= source.length) {
      stop();
      setConnection('complete');
      setAnnouncement('All deterministic tracking events delivered.');
      return;
    }
    if (index.current === 1 && qa.consume('orderEventDisconnection')) {
      stop();
      setConnection('disconnected');
      setAnnouncement('Connection lost. Use retry to reconnect.');
      return;
    }
    accept(source[index.current]);
    index.current += 1;
  }, [accept, qa, source]);

  const start = useCallback(() => {
    stop();
    setConnection('connected');
    timer.current = window.setInterval(deliverNext, qa.orderEventDelay ? 3000 : 900);
  }, [deliverNext, qa.orderEventDelay]);

  const load = useCallback(async () => {
    stop();
    setConnection('connecting');
    setError('');
    try {
      const result = await api<{ events: TrackingEvent[] }>(`/orders/${orderNumber}/tracking`);
      index.current = 0;
      nextSequence.current = 1;
      seen.current.clear();
      buffered.current.clear();
      setAccepted([]);
      setSource(result.events);
      setAnnouncement('Tracking connected.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load tracking.');
      setConnection('disconnected');
    }
  }, [orderNumber]);

  useEffect(() => void load(), [load]);
  useEffect(() => {
    if (source.length) start();
    return stop;
  }, [source, start]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  const latest = accepted.at(-1)?.status;
  const latestIndex = steps.findIndex(([status]) => status === latest);
  return (
    <section className="order-tracking" aria-labelledby="tracking-heading">
      <div className="section-heading">
        <div>
          <h2 id="tracking-heading">Live simulated tracking</h2>
          <p>
            Events are deterministic; duplicates are ignored and out-of-order updates are buffered.
          </p>
        </div>
        <span className={`connection-state connection-state--${connection}`}>
          <span aria-hidden="true" /> {connection.replaceAll('_', ' ')}
        </span>
      </div>
      <ol className="tracking-timeline">
        {steps.map(([status, label], stepIndex) => {
          const complete = stepIndex <= latestIndex;
          const event = accepted.find((item) => item.status === status);
          return (
            <li className={complete ? 'is-complete' : ''} key={status}>
              <span aria-hidden="true">{complete ? '✓' : stepIndex + 1}</span>
              <div>
                <strong>{label}</strong>
                {event ? (
                  <time dateTime={event.occurredAt}>
                    {new Intl.DateTimeFormat('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(event.occurredAt))}
                  </time>
                ) : (
                  <small>Waiting for event</small>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <div className="button-row tracking-controls">
        {connection === 'disconnected' && (
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              setConnection('reconnecting');
              setAnnouncement('Reconnecting to tracking.');
              window.setTimeout(start, 300);
            }}
          >
            Retry connection
          </button>
        )}
        {connection === 'connected' && (
          <button className="button button--secondary" type="button" onClick={deliverNext}>
            Deliver next test event
          </button>
        )}
        <button className="link-button" type="button" onClick={() => void load()}>
          Reset tracking stream
        </button>
      </div>
    </section>
  );
}
