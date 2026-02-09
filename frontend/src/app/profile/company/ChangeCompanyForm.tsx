'use client';

import { useState } from 'react';
import { Controller, useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { linkCompanyByNip, updateStoredUser, type Company } from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import {
  getChangeCompanyFormSchema,
  defaultChangeCompanyFormValues,
  type ChangeCompanyFormValues,
} from './change-company-schema';

const formId = 'change-company-form';

type ChangeCompanyFormProps = {
  onSuccess: (company: Company) => void;
  onError?: (message: string) => void;
  onSuccessMessage?: (message: string) => void;
};

export function ChangeCompanyForm({
  onSuccess,
  onError,
  onSuccessMessage,
}: ChangeCompanyFormProps) {
  const { t } = useTranslations();
  const [expanded, setExpanded] = useState(false);

  const form = useForm<ChangeCompanyFormValues>({
    resolver: zodResolver(getChangeCompanyFormSchema(t)),
    defaultValues: defaultChangeCompanyFormValues,
    mode: 'onSubmit',
  });

  const { handleSubmit, reset, control, formState: { isSubmitting } } = form;

  async function onSubmit(data: ChangeCompanyFormValues) {
    const normalized = data.nip.trim().replace(/\s/g, '').replace(/-/g, '');
    onError?.('');
    onSuccessMessage?.('');
    try {
      const { user, company: c } = await linkCompanyByNip(normalized);
      updateStoredUser(user);
      reset(defaultChangeCompanyFormValues);
      setExpanded(false);
      onSuccess(c);
      onSuccessMessage?.(t('profile.companyLinked'));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : t('common.error'));
    }
  }

  function handleExpand() {
    reset(defaultChangeCompanyFormValues);
    setExpanded(true);
  }

  function handleCancel() {
    reset(defaultChangeCompanyFormValues);
    setExpanded(false);
  }

  if (!expanded) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleExpand}
      >
        {t('profile.companyChangeTitle')}
      </Button>
    );
  }

  return (
    <FormProvider {...form}>
      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FieldGroup>
          <Controller
            name="nip"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${formId}-nip`}>
                  {t('profile.companyNip')}
                </FieldLabel>
                <Input
                  {...field}
                  id={`${formId}-nip`}
                  type="text"
                  inputMode="numeric"
                  placeholder={t('profile.companyNipPlaceholder')}
                  disabled={isSubmitting}
                  maxLength={10}
                  aria-invalid={fieldState.invalid}
                  onChange={(e) =>
                    field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                />
                <FieldDescription>{t('profile.companyChangeHint')}</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('common.submitting') : t('profile.companyLinkOther')}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
