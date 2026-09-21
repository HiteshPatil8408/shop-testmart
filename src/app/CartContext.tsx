import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Cart } from '../../shared/types';
import { api, jsonBody } from '../lib/api';

interface CartValue {
  cart: Cart | null;
  loading: boolean;
  refresh: () => Promise<void>;
  add: (productId: string, variantId: string, quantity: number) => Promise<void>;
  update: (itemId: string, details: { quantity?: number; variantId?: string }) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      setCart(await api<Cart>('/cart'));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const handler = () => void refresh();
    window.addEventListener('testmart:auth-changed', handler);
    return () => window.removeEventListener('testmart:auth-changed', handler);
  }, [refresh]);
  const add = useCallback(async (productId: string, variantId: string, quantity: number) => {
    setCart(
      await api<Cart>('/cart/items', {
        method: 'POST',
        body: jsonBody({ productId, variantId, quantity }),
      }),
    );
  }, []);
  const update = useCallback(
    async (itemId: string, details: { quantity?: number; variantId?: string }) => {
      setCart(
        await api<Cart>(`/cart/items/${itemId}`, { method: 'PATCH', body: jsonBody(details) }),
      );
    },
    [],
  );
  const remove = useCallback(async (itemId: string) => {
    setCart(await api<Cart>(`/cart/items/${itemId}`, { method: 'DELETE' }));
  }, []);
  const clear = useCallback(
    async () => setCart(await api<Cart>('/cart', { method: 'DELETE' })),
    [],
  );
  const value = useMemo(
    () => ({ cart, loading, refresh, add, update, remove, clear }),
    [cart, loading, refresh, add, update, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
