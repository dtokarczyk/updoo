'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  getProfileWithToken,
  setAuth,
  needsOnboarding,
  needsAgreementsAcceptance,
  OAUTH_RETURN_URL_KEY,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/hooks/useTranslations';

const PROFILE_FETCH_TIMEOUT_MS = 15_000;
/** Delay before treating missing token as "redirect to login" (avoids redirect on first paint before params are ready) */
const PARAMS_READY_DELAY_MS = 150;

function LoaderCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex justify-center p-4 pt-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginCallbackContent() {
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const { refreshAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHandledRef = useRef(false);

  useEffect(() => {
    if (hasHandledRef.current) return;
    hasHandledRef.current = true;

    const errorParam = searchParams.get('error');
    let isActive = true;
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
        hasHandledRef.current = false;
      };
    }

    const token = searchParams.get('token');
    if (!token) {
      // Wait for params to be ready (avoids redirect loop when searchParams aren't available on first paint)
      const noTokenTimeout = setTimeout(() => {
        if (isActive) window.location.href = returnUrl || '/login';
      }, PARAMS_READY_DELAY_MS);
      return () => {
        isActive = false;
        clearTimeout(noTokenTimeout);
        hasHandledRef.current = false;
      };
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
      .then(({ user, requiredTermsVersion, requiredPrivacyPolicyVersion }) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setAuth({ access_token: token, user });
        refreshAuth();
        const needsAgreements = needsAgreementsAcceptance(
          user,
          requiredTermsVersion,
          requiredPrivacyPolicyVersion,
        );
        const target =
          returnUrl ||
          (needsAgreements ? '/accept-agreements' : needsOnboarding(user) ? '/onboarding' : '/');
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
      isActive = false;
      clearTimeout(timeoutId);
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      hasHandledRef.current = false;
    };
    // Run only when searchParams change (e.g. actual URL change). t is stable enough for messages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
    <LoaderCard title={t('auth.login')} message={t('auth.signingIn')} />
  );
}

function LoginCallbackFallback() {
  const { t } = useTranslations();
  return <LoaderCard title={t('auth.login')} message={t('auth.signingIn')} />;
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={<LoginCallbackFallback />}>
      <LoginCallbackContent />
    </Suspense>
  );
}
