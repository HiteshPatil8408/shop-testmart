import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../../shared/types';
import { api, jsonBody } from '../lib/api';

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (details: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const result = await api<{ user: User | null }>('/auth/session');
      setUser(result.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => void refresh(), [refresh]);
  const login = useCallback(async (email: string, password: string) => {
    const result = await api<{ user: User }>('/auth/login', {
      method: 'POST',
      body: jsonBody({ email, password }),
    });
    setUser(result.user);
    window.dispatchEvent(new Event('testmart:auth-changed'));
  }, []);
  const register = useCallback(async (details: Record<string, unknown>) => {
    const result = await api<{ user: User }>('/auth/register', {
      method: 'POST',
      body: jsonBody(details),
    });
    setUser(result.user);
    window.dispatchEvent(new Event('testmart:auth-changed'));
  }, []);
  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
    window.dispatchEvent(new Event('testmart:auth-changed'));
  }, []);
  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
