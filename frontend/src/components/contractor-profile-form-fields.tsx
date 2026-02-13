'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  LocationSearchSelect,
  type LocationOption,
} from '@/components/ui/location-search-select';
import { Check, Loader2, XCircle } from 'lucide-react';
import { slugFromName } from '@/lib/slug';
import { checkSlugAvailability } from '@/lib/api';

type StandaloneFields = {
  name: string;
  slug: string;
  email: string;
  phone: string;
  website: string;
  locationId: string;
  aboutUs: string;
};

type OnboardingFields = {
  profileName: string;
  profileEmail: string;
  profilePhone: string;
  profileWebsite: string;
  profileLocationId: string;
  profileAboutUs: string;
};

type FormValues =
  | StandaloneFields
  | (Record<string, unknown> & OnboardingFields);

const SLUG_CHECK_DEBOUNCE_MS = 400;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken';

interface ContractorProfileFormFieldsProps {
  variant: 'standalone' | 'onboarding';
  locations: LocationOption[];
  disabled?: boolean;
  /** Optional: larger inputs (e.g. for onboarding) */
  size?: 'default' | 'lg';
  /** Optional: translation function for labels/placeholders; if not provided, Polish defaults are used */
  t?: (key: string) => string;
  /** When editing profile: pass profile id so current slug shows as available */
  excludeProfileId?: string;
}

const defaultT = (key: string) => key;

export function ContractorProfileFormFields({
  variant,
  locations,
  disabled = false,
  size = 'default',
  t = defaultT,
  excludeProfileId,
}: ContractorProfileFormFieldsProps) {
  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext<FormValues>();

  const isOnboarding = variant === 'onboarding';
  const nameKey = isOnboarding ? 'profileName' : 'name';
  const slugKey = 'slug';
  const emailKey = isOnboarding ? 'profileEmail' : 'email';
  const phoneKey = isOnboarding ? 'profilePhone' : 'phone';
  const websiteKey = isOnboarding ? 'profileWebsite' : 'website';
  const locationKey = isOnboarding ? 'profileLocationId' : 'locationId';
  const aboutKey = isOnboarding ? 'profileAboutUs' : 'aboutUs';

  const watchedSlug = watch(slugKey as keyof FormValues) as string;

  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const slugCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slugCheckSlugRef = useRef<string | null>(null);

  // Run slug availability check (standalone only). Uses normalized slug.
  const runSlugCheck = (normalizedSlug: string) => {
    if (variant !== 'standalone') return;
    if (normalizedSlug.length < 2 || !SLUG_REGEX.test(normalizedSlug)) return;
    slugCheckSlugRef.current = normalizedSlug;
    setSlugStatus('checking');
    checkSlugAvailability(normalizedSlug, excludeProfileId)
      .then(({ available }) => {
        if (slugCheckSlugRef.current === normalizedSlug) {
          setSlugStatus(available ? 'available' : 'taken');
          if (available) {
            clearErrors(slugKey as keyof FormValues);
          } else {
            setError(slugKey as keyof FormValues, {
              type: 'manual',
              message: t('profile.validation.slugTaken') || 'Ten adres wizytówki jest zajęty. Wybierz inny.',
            });
          }
        }
      })
      .catch(() => {
        if (slugCheckSlugRef.current === normalizedSlug) {
          setSlugStatus('idle');
        }
      });
  };

  // Update slug from profile name on blur of name field (standalone only)
  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (variant === 'standalone') {
      const name = (getValues(nameKey as keyof FormValues) as string) || '';
      if (name.trim()) {
        setValue(slugKey as keyof FormValues, slugFromName(name, ''));
      }
    }
    const registered = register(nameKey as keyof FormValues);
    registered.onBlur?.(e);
  };

  // Check slug availability on blur of slug field (standalone only)
  const handleSlugBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    register(slugKey as keyof FormValues).onBlur?.(e);
    if (variant !== 'standalone') return;
    const raw = (getValues(slugKey as keyof FormValues) as string)?.trim?.() ?? '';
    const normalized = slugFromName(raw, '');
    if (normalized.length < 2 || !SLUG_REGEX.test(normalized)) {
      setSlugStatus('idle');
      clearErrors(slugKey as keyof FormValues);
      return;
    }
    runSlugCheck(normalized);
  };

  // Debounced slug availability check on slug value change (standalone only)
  useEffect(() => {
    if (variant !== 'standalone') return;
    const raw = (typeof watchedSlug === 'string' ? watchedSlug : '').trim().toLowerCase();
    const normalized = slugFromName(raw, '');
    const isValid = normalized.length >= 2 && SLUG_REGEX.test(normalized);

    if (!isValid) {
      setSlugStatus('idle');
      clearErrors(slugKey as keyof FormValues);
      if (slugCheckTimeoutRef.current) {
        clearTimeout(slugCheckTimeoutRef.current);
        slugCheckTimeoutRef.current = null;
      }
      return;
    }

    if (slugCheckTimeoutRef.current) clearTimeout(slugCheckTimeoutRef.current);
    slugCheckTimeoutRef.current = setTimeout(() => {
      slugCheckTimeoutRef.current = null;
      runSlugCheck(normalized);
    }, SLUG_CHECK_DEBOUNCE_MS);

    return () => {
      if (slugCheckTimeoutRef.current) {
        clearTimeout(slugCheckTimeoutRef.current);
        slugCheckTimeoutRef.current = null;
      }
    };
  }, [variant, watchedSlug, excludeProfileId]);

  const inputClass = size === 'lg' ? 'h-12 text-base px-4' : '';

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor={nameKey}>
          {t('profile.create.nameLabel') || 'Nazwa profilu *'}
        </Label>
        <Input
          id={nameKey}
          {...register(nameKey)}
          onBlur={variant === 'standalone' ? handleNameBlur : undefined}
          placeholder="np. Moja Firma sp. z o.o."
          maxLength={200}
          disabled={disabled}
          className={inputClass}
        />
        {errors[nameKey as keyof FormValues]?.message && (
          <p className="text-sm text-destructive">
            {String(errors[nameKey as keyof FormValues]?.message)}
          </p>
        )}
      </div>

      {variant === 'standalone' && (
        <div className="space-y-2">
          <Label htmlFor={slugKey}>
            {t('profile.create.slugLabel') || 'Adres wizytówki (slug)'}
          </Label>
          <div className="relative">
            <Input
              id={slugKey}
              {...register(slugKey)}
              onBlur={handleSlugBlur}
              placeholder="moja-firma"
              maxLength={100}
              disabled={disabled || slugStatus === 'checking'}
              aria-busy={slugStatus === 'checking'}
              aria-describedby={slugStatus === 'checking' ? `${slugKey}-checking` : undefined}
              className={inputClass}
            />
            {slugStatus === 'checking' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden>
                <Loader2 className="size-4 animate-spin" />
              </span>
            )}
            {slugStatus === 'available' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-500" aria-hidden>
                <Check className="size-4" />
              </span>
            )}
            {slugStatus === 'taken' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive" aria-hidden>
                <XCircle className="size-4" />
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('profile.create.slugHint') ||
              'Tylko małe litery, cyfry i myślniki. Adres: /company/[slug]'}
          </p>
          {slugStatus === 'checking' && (
            <p id={`${slugKey}-checking`} className="text-sm text-muted-foreground">
              {t('profile.create.slugChecking') || 'Sprawdzam dostępność...'}
            </p>
          )}
          {slugStatus === 'available' && (
            <p className="text-sm text-green-600 dark:text-green-500">
              {t('profile.create.slugAvailable') || 'Adres dostępny'}
            </p>
          )}
          {slugStatus === 'taken' && (
            <p className="text-sm text-destructive">
              {t('profile.validation.slugTaken') || 'Ten adres wizytówki jest zajęty. Wybierz inny.'}
            </p>
          )}
          {errors[slugKey as keyof FormValues]?.message && (
            <p className="text-sm text-destructive">
              {String(errors[slugKey as keyof FormValues]?.message)}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={emailKey}>
          {t('profile.create.emailLabel') || 'E-mail kontaktowy'}
        </Label>
        <Input
          id={emailKey}
          type="email"
          {...register(emailKey)}
          placeholder="kontakt@example.com"
          disabled={disabled}
          className={inputClass}
        />
        {errors[emailKey as keyof FormValues]?.message && (
          <p className="text-sm text-destructive">
            {String(errors[emailKey as keyof FormValues]?.message)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={phoneKey}>
          {t('profile.create.phoneLabel') || 'Numer telefonu'}
        </Label>
        <Input
          id={phoneKey}
          type="tel"
          {...register(phoneKey)}
          placeholder="+48 123 456 789"
          maxLength={30}
          disabled={disabled}
          className={inputClass}
        />
        {errors[phoneKey as keyof FormValues]?.message && (
          <p className="text-sm text-destructive">
            {String(errors[phoneKey as keyof FormValues]?.message)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={websiteKey}>
          {t('profile.create.websiteLabel') || 'Strona www'}
        </Label>
        <Input
          id={websiteKey}
          type="url"
          {...register(websiteKey)}
          placeholder="https://example.com"
          disabled={disabled}
          className={inputClass}
        />
        {errors[websiteKey as keyof FormValues]?.message && (
          <p className="text-sm text-destructive">
            {String(errors[websiteKey as keyof FormValues]?.message)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={locationKey}>
          {t('profile.create.locationLabel') || 'Miasto'}
        </Label>
        <Controller
          name={locationKey as keyof FormValues}
          control={control}
          render={({ field }) => (
            <LocationSearchSelect
              id={locationKey}
              value={typeof field.value === 'string' ? field.value : ''}
              onChange={field.onChange}
              locations={locations}
              disabled={disabled || locations.length === 0}
              placeholder="Szukaj miasta..."
              emptyLabel="Nie wybrano"
              inputClassName={inputClass}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={aboutKey}>
          {t('profile.create.aboutLabel') || 'O nas'} *
        </Label>
        <Textarea
          id={aboutKey}
          {...register(aboutKey)}
          placeholder="Krótki opis firmy lub działalności..."
          maxLength={2000}
          rows={size === 'lg' ? 4 : 5}
          disabled={disabled}
          className="resize-y"
        />
        {errors[aboutKey as keyof FormValues]?.message && (
          <p className="text-sm text-destructive">
            {String(errors[aboutKey as keyof FormValues]?.message)}
          </p>
        )}
      </div>
    </div>
  );
}
