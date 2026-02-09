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
import { Textarea } from '@/components/ui/textarea';
import {
  getStoredUser,
  updateProfile,
  updateStoredUser,
  getToken,
} from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';

export default function ProfileBasicPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultMessage, setDefaultMessage] = useState('');
  const [accountType, setAccountType] = useState<
    'CLIENT' | 'FREELANCER' | 'ADMIN' | null
  >(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getStoredUser();
    if (user) {
      setName(user.name ?? '');
      setSurname(user.surname ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
      setAccountType(user.accountType);
      if (user.defaultMessage != null) {
        setDefaultMessage(user.defaultMessage);
      }
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
    setLoading(true);
    try {
      const payload: Parameters<typeof updateProfile>[0] = {
        name: name.trim() || undefined,
        surname: surname.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        ...(accountType === 'FREELANCER' && {
          defaultMessage: defaultMessage.trim() || undefined,
        }),
      };
      const { user: updated } = await updateProfile(payload);
      updateStoredUser(updated);
      setSuccess(true);
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
        <CardTitle>{t('profile.tabBasic')}</CardTitle>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('auth.name')}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t('auth.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surname">{t('auth.surname')}</Label>
            <Input
              id="surname"
              type="text"
              placeholder={t('auth.surname')}
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              autoComplete="family-name"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('profile.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t('onboarding.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {t('profile.phoneDesc')}
            </p>
          </div>
          {accountType === 'FREELANCER' && (
            <div className="space-y-2">
              <Label htmlFor="defaultMessage">
                {t('profile.defaultMessage')}
              </Label>
              <Textarea
                id="defaultMessage"
                placeholder={t('profile.defaultMessagePlaceholder')}
                value={defaultMessage}
                onChange={(e) => setDefaultMessage(e.target.value)}
                rows={8}
                disabled={loading}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {t('profile.defaultMessageDesc')}
              </p>
            </div>
          )}
          <CardFooter className="px-0">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
