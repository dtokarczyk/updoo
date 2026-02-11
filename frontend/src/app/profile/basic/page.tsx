'use client';

import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, CircleAlert, Camera, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useAuthQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
} from '@/lib/api-query';
import { useTranslations } from '@/hooks/useTranslations';
import {
  getBasicProfileFormSchema,
  defaultBasicProfileFormValues,
  type BasicProfileFormValues,
} from './schema';
import { ProfileAvatar } from '@/components/ProfileAvatar';

const formId = 'profile-basic-form';

export default function ProfileBasicPage() {
  const { t } = useTranslations();
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuthQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const uploadAvatarMutation = useUploadAvatarMutation();
  const removeAvatarMutation = useRemoveAvatarMutation();

  const form = useForm<BasicProfileFormValues>({
    resolver: zodResolver(getBasicProfileFormSchema(t)),
    defaultValues: defaultBasicProfileFormValues,
    mode: 'onSubmit',
  });

  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = form;

  // Sync form with user from React Query (including after refetch from mutations)
  useEffect(() => {
    if (!user) return;
    reset({
      name: user.name ?? '',
      surname: user.surname ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      defaultMessage: user.defaultMessage ?? '',
    });
  }, [user, reset]);

  const accountType = user?.accountType ?? null;
  const avatarUrl = user?.avatarUrl ?? null;
  const avatarUploading = uploadAvatarMutation.isPending;
  const avatarRemoving = removeAvatarMutation.isPending;

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setAvatarError(t('profile.avatarUploadFailed'));
      return;
    }
    setAvatarError('');
    setSuccess(false);
    try {
      await uploadAvatarMutation.mutateAsync(file);
      setSuccess(true);
    } catch {
      setAvatarError(t('profile.avatarUploadFailed'));
    } finally {
      e.target.value = '';
    }
  }

  async function onRemoveAvatar() {
    if (!avatarUrl) return;
    setAvatarError('');
    setSuccess(false);
    try {
      await removeAvatarMutation.mutateAsync();
      setSuccess(true);
    } catch {
      setAvatarError(t('profile.avatarUploadFailed'));
    }
  }

  async function onSubmit(data: BasicProfileFormValues) {
    setSubmitError('');
    setSuccess(false);
    try {
      const payload = {
        name: data.name.trim() || undefined,
        surname: data.surname.trim() || undefined,
        email: data.email.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        ...(accountType === 'FREELANCER' && {
          defaultMessage: data.defaultMessage?.trim() || undefined,
        }),
      };
      await updateProfileMutation.mutateAsync(payload);
      setSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('profile.saveFailed'),
      );
    }
  }

  if (!user) return null;

  console.log(avatarUrl);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('profile.tabBasic')}</CardTitle>
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

        <FormProvider {...form}>
          <form
            id={formId}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <Field>
              <FieldLabel>{t('profile.avatar')}</FieldLabel>
              <div className="flex items-center gap-4">
                <label htmlFor={`${formId}-avatar`} className="cursor-pointer">
                  <ProfileAvatar className="h-20 w-20 ring-2 ring-muted" />
                  <input
                    ref={fileInputRef}
                    id={`${formId}-avatar`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={avatarUploading}
                    onChange={onAvatarChange}
                    aria-label={t('profile.changeAvatar')}
                  />
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={avatarUploading || avatarRemoving}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-fit"
                    >
                      <Camera className="size-4" />
                      {avatarUploading
                        ? t('profile.avatarUploading')
                        : t('profile.changeAvatar')}
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={avatarUploading || avatarRemoving}
                        onClick={onRemoveAvatar}
                        className="w-fit text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        {avatarRemoving
                          ? t('common.saving')
                          : t('profile.removeAvatar')}
                      </Button>
                    )}
                  </div>
                  {avatarError && (
                    <span className="text-sm text-destructive">
                      {avatarError}
                    </span>
                  )}
                </div>
              </div>
            </Field>

            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-name`}>
                    {t('auth.name')}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-name`}
                    type="text"
                    placeholder={t('auth.name')}
                    autoComplete="given-name"
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
              name="surname"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-surname`}>
                    {t('auth.surname')}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-surname`}
                    type="text"
                    placeholder={t('auth.surname')}
                    autoComplete="family-name"
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
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-email`}>
                    {t('auth.email')}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-email`}
                    type="email"
                    placeholder={t('auth.email')}
                    autoComplete="email"
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
              name="phone"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-phone`}>
                    {t('profile.phone')}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-phone`}
                    type="tel"
                    placeholder={t('onboarding.phonePlaceholder')}
                    autoComplete="tel"
                    disabled={isSubmitting}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>{t('profile.phoneDesc')}</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {accountType === 'FREELANCER' && (
              <Controller
                name="defaultMessage"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-defaultMessage`}>
                      {t('profile.defaultMessage')}
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id={`${formId}-defaultMessage`}
                      placeholder={t('profile.defaultMessagePlaceholder')}
                      rows={8}
                      disabled={isSubmitting}
                      className="resize-none"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      {t('profile.defaultMessageDesc')}
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}

            <CardFooter className="px-0">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('common.saving') : t('common.save')}
              </Button>
            </CardFooter>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
