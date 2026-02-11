'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getToken,
  getStoredUser,
  clearAuth,
  getProfile,
  updateStoredUser,
  type AuthUser,
} from '@/lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  /** Key that changes on each refetch – use as cache buster for avatar URL. */
  userKey: number;
  /** Refetch user from API and update state (e.g. after login/register/avatar change). */
  refreshAuth: () => Promise<void>;
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
  const [userKey, setUserKey] = useState(0);

  const refreshAuth = useCallback((): Promise<void> => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoggedIn(false);
      return Promise.resolve();
    }
    return getProfile()
      .then((res) => {
        if (res?.user) {
          updateStoredUser(res.user);
          setUser(res.user);
          setUserKey((k) => k + 1);
          setIsLoggedIn(true);
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      })
      .catch(() => {
        setUser(null);
        setIsLoggedIn(false);
      });
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => refreshAuth());
  }, [refreshAuth]);

  const value: AuthContextValue = {
    user,
    isLoggedIn,
    userKey,
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
