import { APP_CONFIG } from '../shared/config';

export const openapi = {
  openapi: '3.1.0',
  info: {
    title: `${APP_CONFIG.name} API`,
    version: '1.0.0',
    description: 'Same-origin ecommerce practice API. All payment processing is simulated.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Catalogue' },
    { name: 'Authentication' },
    { name: 'Cart' },
    { name: 'Account' },
    { name: 'Orders' },
  ],
  paths: {
    '/categories': {
      get: {
        tags: ['Catalogue'],
        summary: 'List categories',
        responses: { '200': { description: 'Categories' } },
      },
    },
    '/products': {
      get: {
        tags: ['Catalogue'],
        summary: 'Search, filter and paginate products',
        responses: { '200': { description: 'Products' } },
      },
    },
    '/products/{slug}': {
      get: {
        tags: ['Catalogue'],
        summary: 'Get a product',
        responses: { '200': { description: 'Product' }, '404': { description: 'Not found' } },
      },
    },
    '/search/suggestions': {
      get: {
        tags: ['Catalogue'],
        summary: 'Get search suggestions',
        responses: { '200': { description: 'Suggestions' } },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register an account',
        responses: {
          '200': { description: 'Registered' },
          '409': { description: 'Duplicate account' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Create a session',
        responses: {
          '200': { description: 'Signed in' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'End a session',
        responses: { '200': { description: 'Signed out' } },
      },
    },
    '/auth/session': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current session',
        responses: { '200': { description: 'Session' } },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset a non-demo password using the enrolled security question and answer',
        responses: {
          '200': { description: 'Password reset' },
          '400': { description: 'Invalid recovery details or password' },
          '429': { description: 'Rate limited or already reset within the last 24 hours' },
        },
      },
    },
    '/cart': {
      get: { tags: ['Cart'], summary: 'Get cart', responses: { '200': { description: 'Cart' } } },
      delete: {
        tags: ['Cart'],
        summary: 'Clear cart',
        responses: { '200': { description: 'Cart cleared' } },
      },
    },
    '/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Add a cart item',
        responses: {
          '200': { description: 'Updated cart' },
          '409': { description: 'Out of stock' },
        },
      },
    },
    '/cart/items/{itemId}': {
      patch: {
        tags: ['Cart'],
        summary: 'Update a cart item',
        responses: { '200': { description: 'Updated cart' } },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Remove a cart item',
        responses: { '200': { description: 'Updated cart' } },
      },
    },
    '/profile': {
      get: {
        tags: ['Account'],
        summary: 'Get the signed-in profile',
        responses: { '200': { description: 'Profile' }, '401': { description: 'Unauthorized' } },
      },
      patch: {
        tags: ['Account'],
        summary: 'Update profile details',
        responses: { '200': { description: 'Updated profile' } },
      },
    },
    '/account/password': {
      post: {
        tags: ['Account'],
        summary: 'Change the signed-in non-demo user password',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': { description: 'Password changed' },
          '400': { description: 'Current password is incorrect or new password is invalid' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Public demo password is immutable' },
        },
      },
    },
    '/account/security-question': {
      post: {
        tags: ['Account'],
        summary: 'Set or replace password-recovery details for a signed-in non-demo user',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': { description: 'Security question updated' },
          '400': { description: 'Current password is incorrect or recovery details are invalid' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Public demo security settings are immutable' },
        },
      },
    },
    '/addresses': {
      get: {
        tags: ['Account'],
        summary: 'List saved delivery addresses',
        responses: { '200': { description: 'Addresses' } },
      },
      post: {
        tags: ['Account'],
        summary: 'Create a saved delivery address',
        responses: { '200': { description: 'Address' } },
      },
    },
    '/addresses/{id}': {
      patch: {
        tags: ['Account'],
        summary: 'Update a delivery address',
        responses: { '200': { description: 'Address' }, '404': { description: 'Not found' } },
      },
      delete: {
        tags: ['Account'],
        summary: 'Delete a delivery address',
        responses: { '200': { description: 'Deleted' }, '409': { description: 'Last address' } },
      },
    },
    '/checkout/preview': {
      post: {
        tags: ['Orders'],
        summary: 'Recalculate checkout totals',
        responses: { '200': { description: 'Preview' } },
      },
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders',
        responses: { '200': { description: 'Orders' } },
      },
      post: {
        tags: ['Orders'],
        summary: 'Create an idempotent simulated order',
        responses: { '200': { description: 'Order' }, '402': { description: 'Simulated decline' } },
      },
    },
    '/orders/{orderNumber}': {
      get: {
        tags: ['Orders'],
        summary: 'Get an order',
        responses: { '200': { description: 'Order' }, '404': { description: 'Not found' } },
      },
    },
    '/contact': {
      post: {
        summary: 'Store a demo contact message',
        responses: { '200': { description: 'Saved' } },
      },
    },
    '/qa/reset': {
      post: {
        summary: 'Reset data scoped to the current cart/account',
        responses: { '200': { description: 'Reset' } },
      },
    },
  },
  components: {
    securitySchemes: { sessionCookie: { type: 'apiKey', in: 'cookie', name: 'tm_session' } },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: { code: { type: 'string' }, message: { type: 'string' } },
          },
          meta: { type: 'object', properties: { requestId: { type: 'string' } } },
        },
      },
    },
  },
};
