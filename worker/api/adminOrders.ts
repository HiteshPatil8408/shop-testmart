import { Hono, type Context } from 'hono';
import { adminBulkOrderUpdateSchema, adminOrderUpdateSchema } from '../../shared/schemas';
import type { AdminOrder } from '../../shared/types';
import { fail, ok, zodFieldErrors } from '../lib/response';
import type { AppBindings } from '../types';

export const adminOrdersApi = new Hono<AppBindings>();

function mapOrder(row: Record<string, unknown>): AdminOrder {
  return {
    id: String(row.id),
    orderNumber: String(row.order_number),
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    status: String(row.status) as AdminOrder['status'],
    paymentStatus: String(row.payment_status) as AdminOrder['paymentStatus'],
    totalPaise: Number(row.total_paise),
    itemCount: Number(row.item_count),
    orderDate: String(row.order_date),
    channel: String(row.channel) as AdminOrder['channel'],
    priority: String(row.priority) as AdminOrder['priority'],
  };
}

function readFilteredOrders(rows: AdminOrder[], search: URLSearchParams) {
  const q = (search.get('q') ?? '').trim().toLowerCase();
  const status = search.get('status') ?? '';
  const channel = search.get('channel') ?? '';
  const priority = search.get('priority') ?? '';
  const dateFrom = search.get('dateFrom') ?? '';
  const dateTo = search.get('dateTo') ?? '';
  const customer = (search.get('customer') ?? '').trim().toLowerCase();
  const payment = search.get('payment') ?? '';
  const filtered = rows.filter((order) => {
    if (
      q &&
      !`${order.orderNumber} ${order.customerName} ${order.customerEmail}`.toLowerCase().includes(q)
    )
      return false;
    if (
      customer &&
      !`${order.customerName} ${order.customerEmail}`.toLowerCase().includes(customer)
    )
      return false;
    if (status && order.status !== status) return false;
    if (channel && order.channel !== channel) return false;
    if (priority && order.priority !== priority) return false;
    if (payment && order.paymentStatus !== payment) return false;
    if (dateFrom && order.orderDate.slice(0, 10) < dateFrom) return false;
    if (dateTo && order.orderDate.slice(0, 10) > dateTo) return false;
    return true;
  });
  const sort = search.get('sort') ?? 'orderDate';
  const direction = search.get('direction') === 'asc' ? 1 : -1;
  const values: Record<string, (order: AdminOrder) => string | number> = {
    orderNumber: (order) => order.orderNumber,
    customerName: (order) => order.customerName,
    status: (order) => order.status,
    totalPaise: (order) => order.totalPaise,
    itemCount: (order) => order.itemCount,
    orderDate: (order) => order.orderDate,
  };
  const read = values[sort] ?? values.orderDate;
  return filtered.sort((a, b) => {
    const left = read(a);
    const right = read(b);
    return (
      (typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right))) * direction
    );
  });
}

async function allOrders(c: Context<AppBindings>) {
  const result = await c.env.DB.prepare('SELECT * FROM admin_demo_orders').all<
    Record<string, unknown>
  >();
  let rows = result.results.map(mapOrder);
  if (c.req.header('X-QA-Large-Dataset') === '1') {
    rows = Array.from({ length: 10 }, (_, group) =>
      rows.map((order, index) => ({
        ...order,
        id: `${order.id.slice(0, -3)}${String(group * rows.length + index + 1).padStart(3, '0')}`,
        orderNumber: `${order.orderNumber}-L${group + 1}`,
      })),
    ).flat();
  }
  return rows;
}

adminOrdersApi.get('/admin/orders/export', async (c) => {
  const search = new URL(c.req.url).searchParams;
  const rows = readFilteredOrders(await allOrders(c), search);
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const csv = [
    ['Order', 'Customer', 'Email', 'Status', 'Payment', 'Total paise', 'Items', 'Date', 'Channel'],
    ...rows.map((order) => [
      order.orderNumber,
      order.customerName,
      order.customerEmail,
      order.status,
      order.paymentStatus,
      order.totalPaise,
      order.itemCount,
      order.orderDate,
      order.channel,
    ]),
  ]
    .map((row) => row.map(escape).join(','))
    .join('\n');
  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', 'attachment; filename="testmart-orders.csv"');
  return c.body(csv);
});

adminOrdersApi.get('/admin/orders', async (c) => {
  const search = new URL(c.req.url).searchParams;
  const page = Math.max(1, Number(search.get('page')) || 1);
  const pageSize = [5, 10, 20].includes(Number(search.get('pageSize')))
    ? Number(search.get('pageSize'))
    : 10;
  const rows =
    c.req.header('X-QA-Empty-Table') === '1' ? [] : readFilteredOrders(await allOrders(c), search);
  return ok(c, rows.slice((page - 1) * pageSize, page * pageSize), {
    pagination: {
      page,
      pageSize,
      total: rows.length,
      pages: Math.ceil(rows.length / pageSize),
    },
  });
});

adminOrdersApi.patch('/admin/orders/:id', async (c) => {
  if (c.req.header('X-QA-Optimistic-Reject') === '1')
    return fail(c, 409, 'OPTIMISTIC_UPDATE_REJECTED', 'QA Lab rejected the optimistic update.');
  const parsed = adminOrderUpdateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Choose a valid status.',
      zodFieldErrors(parsed.error.issues),
    );
  const row = await c.env.DB.prepare('SELECT * FROM admin_demo_orders WHERE id = ?')
    .bind(c.req.param('id'))
    .first<Record<string, unknown>>();
  if (!row) return fail(c, 404, 'ORDER_NOT_FOUND', 'That demo order could not be found.');
  return ok(c, { ...mapOrder(row), status: parsed.data.status, simulated: true });
});

adminOrdersApi.post('/admin/orders/bulk-status', async (c) => {
  if (c.req.header('X-QA-Optimistic-Reject') === '1')
    return fail(c, 409, 'OPTIMISTIC_UPDATE_REJECTED', 'QA Lab rejected the bulk update.');
  const parsed = adminBulkOrderUpdateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return fail(
      c,
      400,
      'VALIDATION_ERROR',
      'Check the selected orders.',
      zodFieldErrors(parsed.error.issues),
    );
  return ok(c, { ids: parsed.data.ids, status: parsed.data.status, simulated: true });
});
