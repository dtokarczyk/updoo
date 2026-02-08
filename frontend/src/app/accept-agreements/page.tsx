'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getToken,
  getProfile,
  acceptAgreements,
  updateStoredUser,
  needsOnboarding,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/hooks/useTranslations';

export default function AcceptAgreementsPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const { refreshAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    getProfile()
      .then((profile) => {
        if (cancelled || !profile) return;
        const { user, needsAgreementsAcceptance } = profile;
        if (!needsAgreementsAcceptance) {
          router.replace(needsOnboarding(user) ? '/onboarding' : '/');
          return;
        }
      })
      .catch(() => {
        if (!cancelled) router.replace('/login');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!termsChecked || !privacyChecked) {
      setError(t('agreements.mustAcceptBoth'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { user } = await acceptAgreements();
      updateStoredUser(user);
      refreshAuth();
      router.push(needsOnboarding(user) ? '/onboarding' : '/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('agreements.acceptFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4 pt-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('common.loading')}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-4 pt-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t('agreements.title')}</CardTitle>
          <CardDescription className="text-base">
            {t('agreements.description')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={termsChecked}
                onCheckedChange={(c) => setTermsChecked(Boolean(c))}
                disabled={submitting}
                aria-describedby="terms-desc"
              />
              <Label
                htmlFor="terms"
                id="terms-desc"
                className="text-sm font-normal cursor-pointer"
              >
                {t('auth.termsLabelBefore')}{' '}
                <Link
                  href="/agreements/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t('auth.termsLink')}
                </Link>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="privacy"
                checked={privacyChecked}
                onCheckedChange={(c) => setPrivacyChecked(Boolean(c))}
                disabled={submitting}
                aria-describedby="privacy-desc"
              />
              <Label
                htmlFor="privacy"
                id="privacy-desc"
                className="text-sm font-normal cursor-pointer"
              >
                {t('auth.privacyLabelBefore')}{' '}
                <Link
                  href="/agreements/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t('auth.privacyLink')}
                </Link>
              </Label>
            </div>
          </CardContent>
          <CardFooter className="pt-6">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t('agreements.accepting') : t('agreements.accept')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
