'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getToken, getStoredUser, clearAuth, type AuthUser } from '@/lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  /** Re-read token and user from storage (e.g. after login/register). */
  refreshAuth: () => void;
  /** Clear storage and set user to null. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitialAuth() {
  if (typeof window === 'undefined') return { user: null, isLoggedIn: false };
  const u = getStoredUser();
  const token = getToken();
  return { user: u, isLoggedIn: !!token };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(
    () => getInitialAuth().user,
  );
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => getInitialAuth().isLoggedIn,
  );

  const refreshAuth = useCallback(() => {
    const token = getToken();
    const u = getStoredUser();
    setUser(u);
    setIsLoggedIn(!!token);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const value: AuthContextValue = {
    user,
    isLoggedIn,
    refreshAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
