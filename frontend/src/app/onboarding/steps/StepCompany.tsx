'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, UserCircle } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { linkCompanyByNip, updateStoredUser, type AuthUser } from '@/lib/api';
import type { OnboardingFormValues } from '../schemas';

const LARGER_SIZES = ['MICRO', 'SMALL', 'MEDIUM', 'LARGE'] as const;

interface StepCompanyProps {
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error?: string;
  t: (key: string) => string;
  /** Called when company is successfully fetched from GUS (so parent can update user state). */
  onCompanyFetched?: (user: AuthUser) => void;
}

export function StepCompany({
  onSubmit,
  onBack,
  loading,
  error,
  t,
  onCompanyFetched,
}: StepCompanyProps) {
  const { watch, setValue, register, formState } =
    useFormContext<OnboardingFormValues>();
  const hasCompany = watch('hasCompany');
  const companySize = watch('companySize');
  const nipCompany = watch('nipCompany');
  const [showLargerSizePicker, setShowLargerSizePicker] = useState(false);
  const [fetchedCompany, setFetchedCompany] = useState<{ name: string } | null>(
    null,
  );
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const nipDigits = (nipCompany ?? '').replace(/\D/g, '');
  const nipValid = nipDigits.length === 10;

  useEffect(() => {
    if (hasCompany !== true) setFetchedCompany(null);
  }, [hasCompany]);

  useEffect(() => {
    setFetchedCompany(null);
    setFetchError(null);
  }, [nipDigits]);

  async function handleFetchFromGus() {
    if (!nipValid) return;
    setFetchError(null);
    setFetchLoading(true);
    try {
      const { user: linkedUser, company } = await linkCompanyByNip(nipDigits);
      updateStoredUser(linkedUser);
      setFetchedCompany({ name: company.name });
      onCompanyFetched?.(linkedUser);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : t('onboarding.companyFetchError'),
      );
    } finally {
      setFetchLoading(false);
    }
  }

  const isSolo = companySize === 'FREELANCER';
  const isLargerSize =
    companySize === 'MICRO' ||
    companySize === 'SMALL' ||
    companySize === 'MEDIUM' ||
    companySize === 'LARGE';
  const showLargerOptions = showLargerSizePicker || isLargerSize;

  const canProceedWithCompany =
    hasCompany !== true || (fetchedCompany != null && companySize != null);
  const submitDisabled =
    loading || (hasCompany === true && !canProceedWithCompany);

  const fieldError =
    formState.errors.hasCompany?.message ??
    formState.errors.nipCompany?.message ??
    formState.errors.companySize?.message ??
    fetchError;

  return (
    <>
      <CardHeader>
        <CardTitle>{t('onboarding.companyTitle')}</CardTitle>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <CardContent className="space-y-4">
          {(error || fieldError) && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error ?? fieldError}
            </p>
          )}
          <div className="space-y-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setValue('hasCompany', true);
                setValue('companySize', null);
                setShowLargerSizePicker(false);
              }}
              className={`flex w-full items-center gap-4 rounded-lg border p-5 text-left text-base transition-colors ${
                hasCompany === true
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/60'
              }`}
            >
              <div className="shrink-0 rounded-md bg-primary/10 p-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">
                {t('onboarding.companyHasCompany')}
              </span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setValue('hasCompany', false);
                setValue('nipCompany', '');
                setValue('companySize', null);
                setShowLargerSizePicker(false);
              }}
              className={`flex w-full items-center gap-4 rounded-lg border p-5 text-left text-base transition-colors ${
                hasCompany === false
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/60'
              }`}
            >
              <div className="shrink-0 rounded-md bg-primary/10 p-2">
                <UserCircle className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">
                {t('onboarding.companyNoCompany')}
              </span>
            </button>
          </div>
          {hasCompany === true && (
            <>
              <div className="space-y-2 pt-2">
                <Label htmlFor="nipCompany">{t('profile.nipCompany')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="nipCompany"
                    type="text"
                    placeholder={t('onboarding.companyNipPlaceholder')}
                    {...register('nipCompany', {
                      setValueAs: (v: string) =>
                        (v ?? '').replace(/\D/g, '').slice(0, 10),
                    })}
                    disabled={loading || fetchLoading}
                    maxLength={10}
                    className="h-12 text-base px-4 flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-12 shrink-0"
                    disabled={!nipValid || loading || fetchLoading}
                    onClick={handleFetchFromGus}
                  >
                    {fetchLoading
                      ? t('onboarding.fetchingCompany')
                      : t('onboarding.fetchCompanyFromGus')}
                  </Button>
                </div>
              </div>
              {fetchedCompany != null && (
                <p className="text-sm font-medium text-foreground pt-1">
                  {t('onboarding.companyFetchedLabel')} {fetchedCompany.name}
                </p>
              )}
              {fetchedCompany != null && (
              <>
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium text-foreground">
                  {t('onboarding.companySizeQuestion')}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setValue('companySize', 'FREELANCER');
                      setShowLargerSizePicker(false);
                    }}
                    className={`flex items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors ${
                      isSolo
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/60'
                    }`}
                  >
                    <div className="shrink-0 rounded-md bg-primary/10 p-2">
                      <UserCircle className="h-4 w-4 text-primary" />
                    </div>
                    <span>{t('onboarding.companySizeSolo')}</span>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setValue('companySize', null);
                      setShowLargerSizePicker(true);
                    }}
                    className={`flex items-center gap-3 rounded-lg border p-4 text-left text-sm transition-colors ${
                      showLargerOptions && !isSolo
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/60'
                    }`}
                  >
                    <div className="shrink-0 rounded-md bg-primary/10 p-2">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span>{t('onboarding.companySizeLarger')}</span>
                  </button>
                </div>
              </div>
              {showLargerOptions && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium text-foreground">
                    {t('onboarding.companySizeLargerQuestion')}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {LARGER_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        disabled={loading}
                        onClick={() => setValue('companySize', size)}
                        className={`flex items-center rounded-lg border p-3 text-left text-sm transition-colors ${
                          companySize === size
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/60'
                        }`}
                      >
                        <span>{t(`onboarding.companySize${size}`)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
            </>
          )}
        </CardContent>
        <CardFooter className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 text-base"
            size="lg"
            disabled={loading || fetchLoading}
            onClick={onBack}
          >
            {t('common.back')}
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 text-base"
            size="lg"
            disabled={submitDisabled}
          >
            {loading ? t('onboarding.saving') : t('common.continue')}
          </Button>
        </CardFooter>
      </form>
    </>
  );
}
