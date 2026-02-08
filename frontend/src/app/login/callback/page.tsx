'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getProfileWithToken,
  setAuth,
  needsOnboarding,
  OAUTH_RETURN_URL_KEY,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/hooks/useTranslations';

const PROFILE_FETCH_TIMEOUT_MS = 15_000;

function LoginCallbackContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const { refreshAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');
    const fromParams = searchParams.get('returnUrl');
    const fromStorage =
      typeof window !== 'undefined' ? sessionStorage.getItem(OAUTH_RETURN_URL_KEY) : null;
    const returnUrl = fromParams || fromStorage || null;
    if (typeof window !== 'undefined' && fromStorage) {
      sessionStorage.removeItem(OAUTH_RETURN_URL_KEY);
    }

    if (errorParam) {
      setError(t('auth.googleAuthFailed'));
      redirectTimeoutRef.current = setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
      return () => {
        if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      };
    }

    if (!token) {
      window.location.href = returnUrl || '/login';
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      setError(t('auth.profileFetchTimeout'));
      redirectTimeoutRef.current = setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    }, PROFILE_FETCH_TIMEOUT_MS);

    getProfileWithToken(token)
      .then(({ user }) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setAuth({ access_token: token, user });
        refreshAuth();
        const target =
          returnUrl || (needsOnboarding(user) ? '/onboarding' : '/');
        window.location.href = target;
      })
      .catch((err) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setError(err instanceof Error ? err.message : t('auth.loginFailed'));
        redirectTimeoutRef.current = setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, [searchParams, t]);

  if (error) {
    return (
      <div className="flex justify-center p-4 pt-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">{t('common.error')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('auth.redirectingToLogin')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-4 pt-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.login')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-4 pt-12">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <LoginCallbackContent />
    </Suspense>
  );
}
