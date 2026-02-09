'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  getStoredUser,
  updateProfile,
  updateStoredUser,
  getToken,
  clearAuth,
} from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import {
  getPasswordFormSchema,
  defaultPasswordFormValues,
  type PasswordFormValues,
} from './schema';

const formId = 'profile-password-form';

export default function ProfilePasswordPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [hasPassword, setHasPassword] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const user = getStoredUser();
    return user ? user.hasPassword !== false : true;
  });
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(getPasswordFormSchema(t, hasPassword)),
    defaultValues: defaultPasswordFormValues,
    mode: 'onSubmit',
  });

  const { handleSubmit, reset, control, formState: { isSubmitting } } = form;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) {
      router.replace('/login');
      return;
    }
  }, [mounted, router]);

  async function onSubmit(data: PasswordFormValues) {
    setSubmitError('');
    setSuccess(false);
    try {
      const payload: Parameters<typeof updateProfile>[0] = {
        ...(hasPassword && { oldPassword: data.oldPassword.trim() }),
        password: data.password.trim(),
      };
      const { user: updated } = await updateProfile(payload);
      updateStoredUser(updated);
      setHasPassword(updated.hasPassword !== false);
      reset(defaultPasswordFormValues);
      setSuccess(true);
      if (hasPassword) {
        clearAuth();
        router.push('/login');
        router.refresh();
        return;
      }
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('profile.saveFailed'),
      );
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
        {submitError && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            <CheckCircle2 />
            <AlertDescription>{t('profile.profileSaved')}</AlertDescription>
          </Alert>
        )}
        {!hasPassword && (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {t('profile.noPasswordGoogle')}
          </p>
        )}
        <FormProvider {...form}>
          <form
            id={formId}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {hasPassword && (
              <Controller
                name="oldPassword"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-oldPassword`}>
                      {t('profile.currentPassword')}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-oldPassword`}
                      type="password"
                      placeholder={t('profile.currentPasswordPlaceholder')}
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}

            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-password`}>
                    {hasPassword
                      ? t('profile.newPassword')
                      : t('profile.setPassword')}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-password`}
                    type="password"
                    placeholder={t('profile.passwordPlaceholder')}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="passwordConfirm"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-passwordConfirm`}>
                    {t('profile.newPasswordConfirm')}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-passwordConfirm`}
                    type="password"
                    placeholder={t('profile.passwordPlaceholder')}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    {t('profile.passwordMinLength')}
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <CardFooter className="px-0">
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t('common.saving')
                  : hasPassword
                    ? t('common.save')
                    : t('profile.setPassword')}
              </Button>
            </CardFooter>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
