import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatMoney } from '../../shared/lib/money';
import type { AdminOrder } from '../../shared/types';
import { useToast } from '../app/ToastContext';
import { EmptyState, ErrorState } from '../components/Feedback';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api, apiEnvelope, jsonBody } from '../lib/api';

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
}

const statuses = [
  ['confirmed', 'Confirmed'],
  ['packed', 'Packed'],
  ['shipped', 'Shipped'],
  ['out_for_delivery', 'Out for delivery'],
  ['delivered', 'Delivered'],
] as const;

type Status = (typeof statuses)[number][0] | 'cancelled';
type Column = 'customer' | 'payment' | 'items' | 'channel';

function readOverrides() {
  try {
    return JSON.parse(sessionStorage.getItem('tm_admin_order_status') ?? '{}') as Record<
      string,
      Status
    >;
  } catch {
    return {};
  }
}

export function AdminOrdersPage() {
  useDocumentTitle('Demo order management', { noIndex: true });
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<Column>>(
    new Set(['customer', 'payment', 'items', 'channel']),
  );
  const [view, setView] = useState<'table' | 'board'>('table');
  const [bulkStatus, setBulkStatus] = useState<Status>('packed');
  const [overrides, setOverrides] = useState(readOverrides);
  const [announcement, setAnnouncement] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const pointerOrder = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiEnvelope<AdminOrder[]>(`/admin/orders?${location.search.slice(1)}`);
      setOrders(result.data);
      setMeta(result.meta.pagination as PaginationMeta);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load demo orders.');
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => void load(), [load]);

  const update = (name: string, value?: string) => {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== 'page') next.delete('page');
    navigate(`${location.pathname}${next.size ? `?${next}` : ''}`);
  };

  const saveOverrides = (next: Record<string, Status>) => {
    setOverrides(next);
    sessionStorage.setItem('tm_admin_order_status', JSON.stringify(next));
  };

  const rows = orders.map((order) => ({ ...order, status: overrides[order.id] ?? order.status }));
  const selectedVisible = rows.length > 0 && rows.every((order) => selected.has(order.id));

  const moveOrder = async (order: AdminOrder, status: Status) => {
    const previous = overrides[order.id] ?? order.status;
    if (previous === status) return;
    const currentIndex = statuses.findIndex(([value]) => value === previous);
    const targetIndex = statuses.findIndex(([value]) => value === status);
    if (status !== 'cancelled' && (currentIndex < 0 || targetIndex !== currentIndex + 1)) {
      setAnnouncement(
        `${status.replaceAll('_', ' ')} is not a valid next status for ${order.orderNumber}.`,
      );
      return;
    }
    const optimistic = { ...overrides, [order.id]: status };
    saveOverrides(optimistic);
    setAnnouncement(`${order.orderNumber} moved optimistically to ${status.replaceAll('_', ' ')}.`);
    try {
      await api(`/admin/orders/${order.id}`, {
        method: 'PATCH',
        body: jsonBody({ status }),
      });
      setAnnouncement(`${order.orderNumber} status saved for this browser session.`);
      toast('Demo order status updated.', 'success');
    } catch (reason) {
      const rollback = { ...optimistic };
      if (previous === order.status) delete rollback[order.id];
      else rollback[order.id] = previous as Status;
      saveOverrides(rollback);
      const message = reason instanceof Error ? reason.message : 'Update rejected.';
      setAnnouncement(
        `${message} ${order.orderNumber} was restored to ${previous.replaceAll('_', ' ')}.`,
      );
      toast(message, 'error');
    }
  };

  const sortHeader = (key: string, label: string) => {
    const active = (params.get('sort') ?? 'orderDate') === key;
    const direction = params.get('direction') === 'asc' ? 'asc' : 'desc';
    return (
      <button
        type="button"
        onClick={() => {
          const next = new URLSearchParams(params);
          next.set('sort', key);
          next.set('direction', active && direction === 'asc' ? 'desc' : 'asc');
          next.delete('page');
          navigate(`${location.pathname}?${next}`);
        }}
      >
        {label} {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
      </button>
    );
  };

  const hasFilters = [
    'q',
    'customer',
    'status',
    'payment',
    'channel',
    'priority',
    'dateFrom',
    'dateTo',
  ].some((key) => params.has(key));

  return (
    <div className="page container admin-orders">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/account">Account</Link>
          </li>
          <li aria-current="page">Order management</li>
        </ol>
      </nav>
      <div className="page-title">
        <div>
          <p className="eyebrow">Advanced automation practice</p>
          <h1>Demo order management</h1>
          <p>Server-backed fixtures with safe, browser-session status updates.</p>
        </div>
        <div className="view-toggle" aria-label="Order view">
          <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>
            Data grid
          </button>
          <button type="button" aria-pressed={view === 'board'} onClick={() => setView('board')}>
            Status board
          </button>
        </div>
      </div>
      <div className="admin-toolbar">
        <label className="admin-search">
          Global search
          <input
            type="search"
            value={params.get('q') ?? ''}
            placeholder="Order, customer, or email"
            onChange={(event) => update('q', event.target.value)}
          />
        </label>
        <label>
          Status
          <select
            value={params.get('status') ?? ''}
            onChange={(event) => update('status', event.target.value)}
          >
            <option value="">All statuses</option>
            {[...statuses, ['cancelled', 'Cancelled'] as const].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input
            type="date"
            value={params.get('dateFrom') ?? ''}
            onChange={(event) => update('dateFrom', event.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={params.get('dateTo') ?? ''}
            onChange={(event) => update('dateTo', event.target.value)}
          />
        </label>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => navigate(location.pathname)}
        >
          Clear filters
        </button>
      </div>
      <details className="column-filters">
        <summary>Column filters and display</summary>
        <div>
          <label>
            Customer
            <input
              value={params.get('customer') ?? ''}
              onChange={(event) => update('customer', event.target.value)}
            />
          </label>
          <label>
            Payment
            <select
              value={params.get('payment') ?? ''}
              onChange={(event) => update('payment', event.target.value)}
            >
              <option value="">Any payment</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </label>
          <label>
            Channel
            <select
              value={params.get('channel') ?? ''}
              onChange={(event) => update('channel', event.target.value)}
            >
              <option value="">Any channel</option>
              <option value="web">Web</option>
              <option value="mobile">Mobile</option>
              <option value="support">Support</option>
            </select>
          </label>
          <label>
            Priority
            <select
              value={params.get('priority') ?? ''}
              onChange={(event) => update('priority', event.target.value)}
            >
              <option value="">Any priority</option>
              <option value="normal">Normal</option>
              <option value="priority">Priority</option>
            </select>
          </label>
          <fieldset>
            <legend>Show columns</legend>
            {(['customer', 'payment', 'items', 'channel'] as Column[]).map((column) => (
              <label className="check-row" key={column}>
                <input
                  type="checkbox"
                  checked={visibleColumns.has(column)}
                  onChange={(event) =>
                    setVisibleColumns((current) => {
                      const next = new Set(current);
                      if (event.target.checked) next.add(column);
                      else next.delete(column);
                      return next;
                    })
                  }
                />{' '}
                {column}
              </label>
            ))}
          </fieldset>
        </div>
      </details>
      <div className="grid-actions">
        <span role="status" aria-live="polite">
          {loading ? 'Loading orders…' : `${meta.total} orders. ${selected.size} selected.`}
        </span>
        <label>
          Bulk status
          <select
            value={bulkStatus}
            onChange={(event) => setBulkStatus(event.target.value as Status)}
          >
            {[...statuses, ['cancelled', 'Cancelled'] as const].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button button--primary"
          type="button"
          disabled={!selected.size}
          onClick={async () => {
            try {
              await api('/admin/orders/bulk-status', {
                method: 'POST',
                body: jsonBody({ ids: [...selected], status: bulkStatus }),
              });
              saveOverrides({
                ...overrides,
                ...Object.fromEntries([...selected].map((id) => [id, bulkStatus])),
              });
              setAnnouncement(
                `${selected.size} orders updated to ${bulkStatus.replaceAll('_', ' ')}.`,
              );
              setSelected(new Set());
            } catch (reason) {
              setAnnouncement(reason instanceof Error ? reason.message : 'Bulk update failed.');
            }
          }}
        >
          Update selected
        </button>
        <button
          className="button button--secondary"
          type="button"
          onClick={async () => {
            if (import.meta.env.VITE_STATIC_PREVIEW === 'true') {
              const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
              const csv = [
                ['Order', 'Customer', 'Email', 'Status', 'Payment', 'Total paise', 'Items', 'Date'],
                ...rows.map((order) => [
                  order.orderNumber,
                  order.customerName,
                  order.customerEmail,
                  order.status,
                  order.paymentStatus,
                  order.totalPaise,
                  order.itemCount,
                  order.orderDate,
                ]),
              ]
                .map((row) => row.map(escape).join(','))
                .join('\n');
              const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = 'testmart-orders.csv';
              anchor.click();
              URL.revokeObjectURL(url);
              return;
            }
            const response = await fetch(`/api/v1/admin/orders/export?${params}`);
            if (!response.ok) return toast('CSV export failed.', 'error');
            const url = URL.createObjectURL(await response.blob());
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'testmart-orders.csv';
            anchor.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export CSV
        </button>
      </div>
      <p className="sr-only" aria-live="assertive">
        {announcement}
      </p>
      {loading ? (
        <div className="data-grid-skeleton" role="status" aria-label="Loading order table">
          {Array.from({ length: 6 }, (_, index) => (
            <span className="skeleton" key={index} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : !rows.length ? (
        <EmptyState
          title={hasFilters ? 'No orders match these filters' : 'No demo orders available'}
          message={
            hasFilters
              ? 'Clear or adjust one of the order filters.'
              : 'Use QA Lab to turn off the empty-table simulation.'
          }
          action={
            hasFilters ? (
              <button
                className="button button--secondary"
                type="button"
                onClick={() => navigate(location.pathname)}
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : view === 'table' ? (
        <>
          <div className="data-grid-wrap">
            <table className="data-grid">
              <caption>Demo orders</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <input
                      type="checkbox"
                      aria-label="Select all visible orders"
                      checked={selectedVisible}
                      onChange={(event) =>
                        setSelected((current) => {
                          const next = new Set(current);
                          rows.forEach((order) =>
                            event.target.checked ? next.add(order.id) : next.delete(order.id),
                          );
                          return next;
                        })
                      }
                    />
                  </th>
                  <th scope="col">{sortHeader('orderNumber', 'Order')}</th>
                  {visibleColumns.has('customer') && (
                    <th scope="col">{sortHeader('customerName', 'Customer')}</th>
                  )}
                  <th scope="col">{sortHeader('status', 'Status')}</th>
                  {visibleColumns.has('payment') && <th scope="col">Payment</th>}
                  <th scope="col">{sortHeader('totalPaise', 'Total')}</th>
                  {visibleColumns.has('items') && (
                    <th scope="col">{sortHeader('itemCount', 'Items')}</th>
                  )}
                  {visibleColumns.has('channel') && <th scope="col">Channel</th>}
                  <th scope="col">{sortHeader('orderDate', 'Date')}</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => (
                  <OrderRows
                    key={order.id}
                    order={order}
                    selected={selected.has(order.id)}
                    expanded={expanded.has(order.id)}
                    columns={visibleColumns}
                    onSelect={(checked) =>
                      setSelected((current) => {
                        const next = new Set(current);
                        if (checked) next.add(order.id);
                        else next.delete(order.id);
                        return next;
                      })
                    }
                    onExpand={() =>
                      setExpanded((current) => {
                        const next = new Set(current);
                        if (next.has(order.id)) next.delete(order.id);
                        else next.add(order.id);
                        return next;
                      })
                    }
                    onStatus={(status) => void moveOrder(order, status)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="order-mobile-list">
            {rows.map((order) => (
              <article key={order.id}>
                <div>
                  <input
                    type="checkbox"
                    aria-label={`Select ${order.orderNumber}`}
                    checked={selected.has(order.id)}
                    onChange={(event) =>
                      setSelected((current) => {
                        const next = new Set(current);
                        if (event.target.checked) next.add(order.id);
                        else next.delete(order.id);
                        return next;
                      })
                    }
                  />
                  <strong>{order.orderNumber}</strong>
                  <span className="badge">{order.status.replaceAll('_', ' ')}</span>
                </div>
                <p>
                  {order.customerName}
                  <br />
                  {formatMoney(order.totalPaise)} · {order.itemCount} items
                </p>
                <label>
                  Update status
                  <select
                    value={order.status}
                    onChange={(event) => void moveOrder(order, event.target.value as Status)}
                  >
                    {[...statuses, ['cancelled', 'Cancelled'] as const].map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="kanban" aria-label="Order status board">
          {statuses.map(([status, label], targetIndex) => {
            const draggedOrder = rows.find((order) => order.id === draggingId);
            const sourceIndex = statuses.findIndex(([value]) => value === draggedOrder?.status);
            const validTarget = Boolean(draggedOrder) && targetIndex === sourceIndex + 1;
            return (
              <section
                key={status}
                className={`kanban__column ${draggingId ? (validTarget ? 'is-valid-target' : 'is-invalid-target') : ''}`}
                data-status={status}
                aria-labelledby={`kanban-${status}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = event.dataTransfer.getData('text/plain');
                  const order = rows.find((item) => item.id === id);
                  setDraggingId(null);
                  if (order) void moveOrder(order, status);
                }}
              >
                <h2 id={`kanban-${status}`}>
                  {label}
                  <span>{rows.filter((order) => order.status === status).length}</span>
                </h2>
                {rows
                  .filter((order) => order.status === status)
                  .map((order) => (
                    <article
                      key={order.id}
                      className={draggingId === order.id ? 'is-dragging' : ''}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', order.id);
                        setDraggingId(order.id);
                      }}
                      onDragEnd={() => setDraggingId(null)}
                    >
                      <button
                        type="button"
                        className="kanban__drag-handle"
                        aria-label={`Drag ${order.orderNumber}`}
                        onPointerDown={(event) => {
                          pointerOrder.current = order.id;
                          setDraggingId(order.id);
                          event.currentTarget.setPointerCapture(event.pointerId);
                        }}
                        onPointerUp={(event) => {
                          const target = document
                            .elementFromPoint(event.clientX, event.clientY)
                            ?.closest<HTMLElement>('[data-status]');
                          const current = rows.find((item) => item.id === pointerOrder.current);
                          pointerOrder.current = null;
                          setDraggingId(null);
                          if (current && target?.dataset.status)
                            void moveOrder(current, target.dataset.status as Status);
                        }}
                      >
                        ⋮⋮
                      </button>
                      <strong>{order.orderNumber}</strong>
                      <span>{order.customerName}</span>
                      <small>{formatMoney(order.totalPaise)}</small>
                      <label>
                        Move order
                        <select
                          value=""
                          onChange={(event) => {
                            if (event.target.value)
                              void moveOrder(order, event.target.value as Status);
                          }}
                        >
                          <option value="">Choose next status</option>
                          {statuses.map(([value, text], index) => (
                            <option
                              key={value}
                              value={value}
                              disabled={
                                index !==
                                statuses.findIndex(([current]) => current === order.status) + 1
                              }
                            >
                              {text}
                            </option>
                          ))}
                        </select>
                      </label>
                    </article>
                  ))}
              </section>
            );
          })}
        </div>
      )}
      {!loading && rows.length > 0 && view === 'table' && (
        <div className="data-grid-pagination">
          <label>
            Rows per page
            <select
              value={meta.pageSize}
              onChange={(event) => update('pageSize', event.target.value)}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </label>
          <span>
            Page {meta.page} of {Math.max(1, meta.pages)}
          </span>
          <button
            type="button"
            disabled={meta.page <= 1}
            onClick={() => update('page', String(meta.page - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={meta.page >= meta.pages}
            onClick={() => update('page', String(meta.page + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function OrderRows({
  order,
  selected,
  expanded,
  columns,
  onSelect,
  onExpand,
  onStatus,
}: {
  order: AdminOrder;
  selected: boolean;
  expanded: boolean;
  columns: Set<Column>;
  onSelect: (checked: boolean) => void;
  onExpand: () => void;
  onStatus: (status: Status) => void;
}) {
  const columnCount = 6 + columns.size;
  return (
    <>
      <tr>
        <td>
          <input
            type="checkbox"
            aria-label={`Select ${order.orderNumber}`}
            checked={selected}
            onChange={(event) => onSelect(event.target.checked)}
          />
        </td>
        <th scope="row">
          {order.orderNumber}
          {order.priority === 'priority' && <span className="badge badge--warm">Priority</span>}
        </th>
        {columns.has('customer') && (
          <td>
            <strong>{order.customerName}</strong>
            <small>{order.customerEmail}</small>
          </td>
        )}
        <td>
          <label>
            <span className="sr-only">Status for {order.orderNumber}</span>
            <select
              value={order.status}
              onChange={(event) => onStatus(event.target.value as Status)}
            >
              {[...statuses, ['cancelled', 'Cancelled'] as const].map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </td>
        {columns.has('payment') && (
          <td>
            <span className="badge">{order.paymentStatus}</span>
          </td>
        )}
        <td>{formatMoney(order.totalPaise)}</td>
        {columns.has('items') && <td>{order.itemCount}</td>}
        {columns.has('channel') && <td>{order.channel}</td>}
        <td>
          <time dateTime={order.orderDate}>
            {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(
              new Date(order.orderDate),
            )}
          </time>
        </td>
        <td>
          <button
            className="link-button"
            type="button"
            aria-expanded={expanded}
            aria-controls={`details-${order.id}`}
            onClick={onExpand}
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="data-grid__details">
          <td colSpan={columnCount} id={`details-${order.id}`}>
            <strong>Expanded order details</strong>
            <dl>
              <div>
                <dt>Customer email</dt>
                <dd>{order.customerEmail}</dd>
              </div>
              <div>
                <dt>Channel</dt>
                <dd>{order.channel}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>{order.priority}</dd>
              </div>
              <div>
                <dt>Fixture ID</dt>
                <dd>{order.id}</dd>
              </div>
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}
