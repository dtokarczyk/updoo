'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  register as apiRegister,
  setAuth,
  getGoogleAuthUrl,
  getAgreementsVersions,
  OAUTH_RETURN_URL_KEY,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/hooks/useTranslations';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [termsVersion, setTermsVersion] = useState<string | null>(null);
  const [privacyVersion, setPrivacyVersion] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAgreementsVersions()
      .then((v) => {
        setTermsVersion(v.termsVersion);
        setPrivacyVersion(v.privacyPolicyVersion);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t('auth.passwordsMustMatch'));
      return;
    }
    if (!termsChecked || !privacyChecked) {
      setError(t('auth.mustAcceptTerms'));
      return;
    }
    setLoading(true);
    try {
      const data = await apiRegister(
        email,
        password,
        confirmPassword,
        true,
      );
      setAuth(data);
      refreshAuth();
      router.push('/onboarding');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('auth.registrationFailed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center p-4 pt-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl">{t('auth.register')}</CardTitle>
          <CardDescription>{t('auth.enterDetails')}</CardDescription>
        </CardHeader>
        <div>
          <div className="px-6 pb-2">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12"
              disabled={loading}
              onClick={() => {
                const returnUrl = searchParams.get('returnUrl');
                if (returnUrl && typeof window !== 'undefined') {
                  sessionStorage.setItem(OAUTH_RETURN_URL_KEY, returnUrl);
                }
                window.location.href = getGoogleAuthUrl();
              }}
            >
              <img
                src="/icon/google.svg"
                alt=""
                className="h-5 w-5 mr-2"
                aria-hidden
              />
              {t('auth.loginWithGoogle')}
            </Button>

            <div className="relative flex items-center gap-2 my-4">
              <span className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">
                {t('auth.or')}
              </span>
              <span className="flex-1 border-t border-border" />
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  className="h-12 text-base px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.passwordMinLengthPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-12 text-base px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  {t('auth.confirmPassword')}
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder={t('auth.passwordMinLengthPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-12 text-base px-4"
                />
              </div>
              {termsVersion != null && (
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={termsChecked}
                    onCheckedChange={(c) => setTermsChecked(Boolean(c))}
                    disabled={loading}
                    aria-describedby="terms-desc"
                  />
                  <Label
                    htmlFor="terms"
                    id="terms-desc"
                    className="text-sm font-normal cursor-pointer"
                  >
                    {t('auth.termsLabelBefore')}{' '}
                    <Link
                      href={`/agreements/terms/${termsVersion}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('auth.termsLink')}
                    </Link>
                  </Label>
                </div>
              )}
              {privacyVersion != null && (
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="privacy"
                    checked={privacyChecked}
                    onCheckedChange={(c) => setPrivacyChecked(Boolean(c))}
                    disabled={loading}
                    aria-describedby="privacy-desc"
                  />
                  <Label
                    htmlFor="privacy"
                    id="privacy-desc"
                    className="text-sm font-normal cursor-pointer"
                  >
                    {t('auth.privacyLabelBefore')}{' '}
                    <Link
                      href={`/agreements/privacy/${privacyVersion}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('auth.privacyLink')}
                    </Link>
                  </Label>
                </div>
              )}
            </CardContent>
            <CardFooter className="mt-6 flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full h-12"
                disabled={loading}
              >
                {loading ? t('auth.registering') : t('auth.register')}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link
                  href="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t('auth.logIn')}
                </Link>
              </p>
            </CardFooter>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-4 pt-12">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-3xl">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
