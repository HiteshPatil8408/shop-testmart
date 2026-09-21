import { calculateTotals } from '../../shared/lib/money';
import { APP_CONFIG } from '../../shared/config';
import { applyProductFilters } from '../../shared/lib/productFilters';
import type { Address, ApiSuccess, Cart, OrderSummary, User } from '../../shared/types';
import { previewCategories, previewProducts } from './data';

const keys = {
  user: 'tm_preview_user',
  cart: 'tm_preview_cart',
  orders: 'tm_preview_orders',
  addresses: 'tm_preview_addresses',
  account: 'tm_preview_account',
};
type PreviewAccount = {
  user: User;
  password: string;
  securityQuestionId: string;
  securityAnswer: string;
  lastPasswordResetAt: number | null;
};
const demoUser: User = {
  id: 'preview-demo',
  username: 'testmart_tester',
  email: 'tester@testmart.demo',
  firstName: 'Demo',
  lastName: 'Tester',
  phone: '+91 90000 00000',
  marketingOptIn: false,
};
const demoAddress: Address = {
  id: 'preview-address',
  label: 'Demo address',
  firstName: 'Demo',
  lastName: 'Tester',
  phone: '+91 90000 00000',
  street: '101 Learning Lane',
  city: 'Pune',
  state: 'Maharashtra',
  postalCode: '411001',
  country: 'India',
  isDefault: true,
};

function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '') as T;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}
function normalizeSecurityAnswer(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}
function body(init: RequestInit) {
  return init.body ? (JSON.parse(String(init.body)) as Record<string, any>) : {};
}
function envelope<T>(data: T, meta: Record<string, unknown> = {}): ApiSuccess<T> {
  return { data, meta: { requestId: 'static-preview', ...meta } };
}

type Line = { id: string; productId: string; variantId: string; quantity: number };
function cart(): Cart {
  const lines = read<Line[]>(keys.cart, []);
  const items = lines.flatMap((line) => {
    const product = previewProducts.find((item) => item.id === line.productId);
    const variant = product?.variants.find((item) => item.id === line.variantId);
    return product && variant ? [{ ...line, product, variant }] : [];
  });
  return {
    id: 'preview-cart',
    items,
    totals: calculateTotals(
      items.map((item) => ({ pricePaise: item.product.pricePaise, quantity: item.quantity })),
    ),
  };
}

export async function staticPreviewApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiSuccess<T>> {
  await Promise.resolve();
  const method = init.method ?? 'GET';
  const url = new URL(path, 'https://preview.test');
  const pathname = url.pathname;
  if (pathname === '/categories') return envelope(previewCategories) as ApiSuccess<T>;
  if (pathname === '/products') {
    let products = applyProductFilters(previewProducts, {
      query: url.searchParams.get('q') ?? undefined,
      category: url.searchParams.get('category') ?? undefined,
      minimumRating: Number(url.searchParams.get('rating')) || undefined,
      inStock: url.searchParams.get('inStock') === '1',
      colours: url.searchParams.getAll('colour'),
    });
    const sort = url.searchParams.get('sort');
    if (sort === 'price_asc') products.sort((a, b) => a.pricePaise - b.pricePaise);
    if (sort === 'price_desc') products.sort((a, b) => b.pricePaise - a.pricePaise);
    if (sort === 'rating') products.sort((a, b) => b.rating - a.rating);
    if (url.searchParams.get('featured') === '1')
      products = products.filter((item) => item.featured);
    if (url.searchParams.get('popular') === '1') products = products.filter((item) => item.popular);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const pageSize = Number(url.searchParams.get('pageSize')) || 12;
    const total = products.length;
    return envelope(products.slice((page - 1) * pageSize, page * pageSize), {
      pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
    }) as ApiSuccess<T>;
  }
  if (pathname.startsWith('/products/')) {
    const product = previewProducts.find((item) => item.slug === pathname.split('/').pop());
    if (!product) throw new Error('Product not found.');
    return envelope({
      product,
      related: previewProducts
        .filter((item) => item.category === product.category && item.id !== product.id)
        .slice(0, 4),
    }) as ApiSuccess<T>;
  }
  if (pathname === '/search/suggestions') {
    const q = url.searchParams.get('q')?.toLowerCase() ?? '';
    return envelope(
      previewProducts
        .filter((item) => `${item.name} ${item.manufacturer}`.toLowerCase().includes(q))
        .slice(0, 6)
        .map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          categoryName: item.categoryName,
          pricePaise: item.pricePaise,
          image: item.images[0],
        })),
    ) as ApiSuccess<T>;
  }
  if (pathname === '/auth/session')
    return envelope({ user: read<User | null>(keys.user, null) }) as ApiSuccess<T>;
  if (pathname === '/auth/login' && method === 'POST') {
    const value = body(init);
    const account = read<PreviewAccount | null>(keys.account, null);
    const isDemo = value.email === demoUser.email && value.password === APP_CONFIG.demoPassword;
    const isRegistered =
      account && value.email === account.user.email && value.password === account.password;
    if (!isDemo && !isRegistered) throw new Error('The email or password is incorrect.');
    const user = isDemo ? demoUser : account!.user;
    write(keys.user, user);
    return envelope({ user }) as ApiSuccess<T>;
  }
  if (pathname === '/auth/register' && method === 'POST') {
    const value = body(init);
    const user = {
      ...demoUser,
      id: crypto.randomUUID(),
      username: value.username,
      email: value.email,
      firstName: value.firstName,
      lastName: value.lastName,
      phone: value.phone,
      marketingOptIn: Boolean(value.marketingOptIn),
    };
    write(keys.account, {
      user,
      password: value.password,
      securityQuestionId: value.securityQuestionId,
      securityAnswer: normalizeSecurityAnswer(value.securityAnswer),
      lastPasswordResetAt: null,
    } satisfies PreviewAccount);
    write(keys.user, user);
    return envelope({ user }) as ApiSuccess<T>;
  }
  if (pathname === '/auth/logout') {
    localStorage.removeItem(keys.user);
    return envelope({ signedOut: true }) as ApiSuccess<T>;
  }
  if (pathname === '/auth/reset-password' && method === 'POST') {
    const value = body(init);
    const account = read<PreviewAccount | null>(keys.account, null);
    const matches =
      account &&
      value.email === account.user.email &&
      value.securityQuestionId === account.securityQuestionId &&
      normalizeSecurityAnswer(value.securityAnswer) === account.securityAnswer;
    if (!matches || value.email === demoUser.email)
      throw new Error(
        'The account details or security answer are incorrect. Check them and try again.',
      );
    if (
      account.lastPasswordResetAt &&
      Date.now() - account.lastPasswordResetAt < 24 * 60 * 60 * 1000
    )
      throw new Error('A password can be reset only once every 24 hours. Try again later.');
    write(keys.account, {
      ...account,
      password: value.password,
      lastPasswordResetAt: Date.now(),
    } satisfies PreviewAccount);
    localStorage.removeItem(keys.user);
    return envelope({ reset: true }) as ApiSuccess<T>;
  }
  if (pathname === '/cart' && method === 'GET') return envelope(cart()) as ApiSuccess<T>;
  if (pathname === '/cart' && method === 'DELETE') {
    write(keys.cart, []);
    return envelope(cart()) as ApiSuccess<T>;
  }
  if (pathname === '/cart/items' && method === 'POST') {
    const value = body(init);
    const lines = read<Line[]>(keys.cart, []);
    const existing = lines.find(
      (item) => item.productId === value.productId && item.variantId === value.variantId,
    );
    if (existing) existing.quantity += value.quantity;
    else
      lines.push({
        id: crypto.randomUUID(),
        productId: value.productId,
        variantId: value.variantId,
        quantity: value.quantity,
      });
    write(keys.cart, lines);
    return envelope(cart()) as ApiSuccess<T>;
  }
  if (pathname.startsWith('/cart/items/')) {
    const id = pathname.split('/').pop();
    let lines = read<Line[]>(keys.cart, []);
    if (method === 'DELETE') lines = lines.filter((item) => item.id !== id);
    else {
      const value = body(init);
      const line = lines.find((item) => item.id === id);
      if (line) Object.assign(line, value);
    }
    write(keys.cart, lines);
    return envelope(cart()) as ApiSuccess<T>;
  }
  if (pathname === '/profile' && method === 'PATCH') {
    const user = { ...read<User>(keys.user, demoUser), ...body(init) };
    write(keys.user, user);
    return envelope(user) as ApiSuccess<T>;
  }
  if (pathname === '/account/password' && method === 'POST') {
    const user = read<User | null>(keys.user, null);
    if (!user || user.email === demoUser.email)
      throw new Error('The public demo account password cannot be changed.');
    const value = body(init);
    const account = read<PreviewAccount | null>(keys.account, null);
    if (!account || value.currentPassword !== account.password)
      throw new Error('The current password is incorrect.');
    write(keys.account, { ...account, password: value.password } satisfies PreviewAccount);
    return envelope({ changed: true }) as ApiSuccess<T>;
  }
  if (pathname === '/account/security-question' && method === 'POST') {
    const user = read<User | null>(keys.user, null);
    if (!user || user.email === demoUser.email)
      throw new Error('The public demo account security settings cannot be changed.');
    const value = body(init);
    const account = read<PreviewAccount | null>(keys.account, null);
    if (!account || value.currentPassword !== account.password)
      throw new Error('The current password is incorrect.');
    write(keys.account, {
      ...account,
      securityQuestionId: value.securityQuestionId,
      securityAnswer: normalizeSecurityAnswer(value.securityAnswer),
    } satisfies PreviewAccount);
    return envelope({ updated: true }) as ApiSuccess<T>;
  }
  if (pathname === '/addresses' && method === 'GET')
    return envelope(read<Address[]>(keys.addresses, [demoAddress])) as ApiSuccess<T>;
  if (pathname === '/addresses' && method === 'POST') {
    const items = read<Address[]>(keys.addresses, [demoAddress]);
    const item = { ...body(init), id: crypto.randomUUID() } as Address;
    items.push(item);
    write(keys.addresses, items);
    return envelope(item) as ApiSuccess<T>;
  }
  if (pathname.startsWith('/addresses/') && method === 'DELETE') {
    write(
      keys.addresses,
      read<Address[]>(keys.addresses, [demoAddress]).filter(
        (item) => item.id !== pathname.split('/').pop(),
      ),
    );
    return envelope({ deleted: true }) as ApiSuccess<T>;
  }
  if (pathname === '/checkout/preview') {
    const value = body(init);
    const current = cart();
    return envelope({
      cart: current,
      deliveryMethod: value.deliveryMethod,
      totals: calculateTotals(
        current.items.map((item) => ({
          pricePaise: item.product.pricePaise,
          quantity: item.quantity,
        })),
        value.deliveryMethod,
      ),
    }) as ApiSuccess<T>;
  }
  if (pathname === '/orders' && method === 'POST') {
    const value = body(init);
    const current = cart();
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const orderNumber = `${APP_CONFIG.shortName}-${date}-PREVIEW`;
    const totals = calculateTotals(
      current.items.map((item) => ({
        pricePaise: item.product.pricePaise,
        quantity: item.quantity,
      })),
      value.deliveryMethod,
    );
    const order = {
      orderNumber,
      status: 'confirmed',
      paymentStatus: value.payment.type === 'cod' ? 'pending' : 'paid',
      deliveryMethod: value.deliveryMethod,
      address: value.address,
      ...totals,
      totalPaise: totals.totalPaise,
      createdAt: new Date().toISOString(),
      items: current.items.map((item) => ({
        id: item.id,
        productName: item.product.name,
        productSlug: item.product.slug,
        variantColour: item.variant.colour,
        quantity: item.quantity,
        unitPricePaise: item.product.pricePaise,
        image: item.variant.images[0] ?? item.product.images[0],
      })),
    };
    write(keys.orders, [order, ...read<OrderSummary[]>(keys.orders, [])]);
    write(keys.cart, []);
    return envelope({
      orderNumber,
      status: 'confirmed',
      paymentStatus: order.paymentStatus,
      totals,
    }) as ApiSuccess<T>;
  }
  if (pathname === '/orders' && method === 'GET')
    return envelope(read<OrderSummary[]>(keys.orders, [])) as ApiSuccess<T>;
  if (pathname.startsWith('/orders/')) {
    const order = read<OrderSummary[]>(keys.orders, []).find(
      (item) => item.orderNumber === pathname.split('/').pop(),
    );
    if (!order) throw new Error('Order not found.');
    return envelope(order) as ApiSuccess<T>;
  }
  if (pathname === '/contact')
    return envelope({
      id: crypto.randomUUID(),
      message: 'Thanks — your browser-local demo message has been simulated.',
    }) as ApiSuccess<T>;
  if (pathname === '/qa/reset') {
    [keys.cart, keys.orders, keys.addresses].forEach((key) => localStorage.removeItem(key));
    return envelope({ reset: true }) as ApiSuccess<T>;
  }
  throw new Error(`Static preview does not implement ${method} ${pathname}.`);
}
