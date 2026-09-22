import { Hono } from 'hono';
import { accountApi } from './api/account';
import { adminOrdersApi } from './api/adminOrders';
import { authApi } from './api/auth';
import { cartApi } from './api/cart';
import { catalogue } from './api/catalogue';
import { contactApi } from './api/contact';
import { ordersApi } from './api/orders';
import { qaApi } from './api/qa';
import { reviewsApi } from './api/reviews';
import { fail } from './lib/response';
import { loadUser, requireUser } from './middleware/auth';
import { protectMutations, qaSimulation, requestContext } from './middleware/security';
import { openapi } from './openapi';
import type { AppBindings } from './types';

const app = new Hono<AppBindings>();

app.use('/api/*', requestContext, protectMutations, loadUser, qaSimulation);
app.get('/api/openapi.json', (c) => c.json(openapi));

const api = new Hono<AppBindings>();
api.route('/', catalogue);
api.route('/', reviewsApi);
api.route('/auth', authApi);
api.route('/cart', cartApi);
api.route('/', contactApi);
api.use('/profile', requireUser);
api.use('/account/*', requireUser);
api.use('/addresses', requireUser);
api.use('/addresses/*', requireUser);
api.route('/', accountApi);
api.use('/checkout/*', requireUser);
api.use('/orders*', requireUser);
api.route('/', ordersApi);
api.use('/admin/*', requireUser);
api.route('/', adminOrdersApi);
api.route('/qa', qaApi);

app.route('/api/v1', api);

app.notFound((c) =>
  c.req.path.startsWith('/api/')
    ? fail(c, 404, 'NOT_FOUND', 'The requested API route does not exist.')
    : c.env.ASSETS.fetch(c.req.raw),
);

app.onError((error, c) => {
  console.error(
    'Request failed',
    c.get('requestId'),
    error instanceof Error ? error.message : 'Unknown error',
  );
  return fail(c, 500, 'INTERNAL_ERROR', 'Something went wrong. Try again.');
});

export default app;
