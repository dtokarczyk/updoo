'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { resetPassword } from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const token = searchParams.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsMustMatch'));
      return;
    }
    if (!token) {
      setError(t('auth.resetPasswordDesc'));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, newPassword, confirmPassword);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex justify-center p-4 pt-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-3xl">
              {t('auth.resetPasswordTitle')}
            </CardTitle>
            <CardDescription>{t('auth.resetPasswordSuccess')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex justify-center p-4 pt-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-3xl">
              {t('auth.resetPasswordTitle')}
            </CardTitle>
            <CardDescription>{t('auth.noResetToken')}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full h-12">
              <Link href="/login/forgot-password">
                {t('auth.forgotPasswordTitle')}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-4 pt-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl">
            {t('auth.resetPasswordTitle')}
          </CardTitle>
          <CardDescription>{t('auth.resetPasswordDesc')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('auth.password')}</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder={t('auth.passwordMinLengthPlaceholder')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                autoFocus
                disabled={loading}
                className="h-12 text-base px-4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t('auth.confirmPassword')}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('auth.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                disabled={loading}
                className="h-12 text-base px-4"
              />
            </div>
          </CardContent>
          <CardFooter className="mt-6 flex flex-col gap-4">
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? t('common.submitting') : t('auth.setNewPassword')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordForm />
    </Suspense>
  );
}
