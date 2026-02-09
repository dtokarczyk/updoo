'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  getStoredUser,
  updateProfile,
  updateStoredUser,
  getToken,
  clearAuth,
} from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';

export default function ProfilePasswordPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [hasPassword, setHasPassword] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getStoredUser();
    if (user) {
      setHasPassword(user.hasPassword !== false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) {
      router.replace('/login');
      return;
    }
  }, [mounted, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!password.trim() || !passwordConfirm.trim()) {
      setError(t('profile.passwordBothRequired'));
      return;
    }
    if (password.trim() !== passwordConfirm.trim()) {
      setError(t('profile.passwordMismatch'));
      return;
    }
    if (hasPassword && !oldPassword.trim()) {
      setError(t('profile.passwordBothRequired'));
      return;
    }
    setLoading(true);
    try {
      const payload: Parameters<typeof updateProfile>[0] = {
        ...(hasPassword && { oldPassword: oldPassword.trim() }),
        password: password.trim(),
      };
      const { user: updated } = await updateProfile(payload);
      updateStoredUser(updated);
      setHasPassword(updated.hasPassword !== false);
      setOldPassword('');
      setPassword('');
      setPasswordConfirm('');
      setSuccess(true);
      if (hasPassword) {
        clearAuth();
        router.push('/login');
        router.refresh();
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('profile.tabPassword')}</CardTitle>
        <CardDescription>{t('profile.editProfileDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400 rounded-md bg-green-500/10 px-3 py-2">
            {t('profile.profileSaved')}
          </p>
        )}
        {!hasPassword && (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {t('profile.noPasswordGoogle')}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {hasPassword && (
            <div className="space-y-2">
              <Label htmlFor="oldPassword">{t('profile.currentPassword')}</Label>
              <Input
                id="oldPassword"
                type="password"
                placeholder={t('profile.currentPasswordPlaceholder')}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">
              {hasPassword ? t('profile.newPassword') : t('profile.setPassword')}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={t('profile.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">
              {t('profile.newPasswordConfirm')}
            </Label>
            <Input
              id="passwordConfirm"
              type="password"
              placeholder={t('profile.passwordPlaceholder')}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {t('profile.passwordMinLength')}
            </p>
          </div>
          <CardFooter className="px-0">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? t('common.saving')
                : hasPassword
                  ? t('common.save')
                  : t('profile.setPassword')}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
