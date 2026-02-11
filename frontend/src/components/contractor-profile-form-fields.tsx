'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  LocationSearchSelect,
  type LocationOption,
} from '@/components/ui/location-search-select';

type StandaloneFields = {
  name: string;
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

interface ContractorProfileFormFieldsProps {
  variant: 'standalone' | 'onboarding';
  locations: LocationOption[];
  disabled?: boolean;
  /** Optional: larger inputs (e.g. for onboarding) */
  size?: 'default' | 'lg';
  /** Optional: translation function for labels/placeholders; if not provided, Polish defaults are used */
  t?: (key: string) => string;
}

const defaultT = (key: string) => key;

export function ContractorProfileFormFields({
  variant,
  locations,
  disabled = false,
  size = 'default',
  t = defaultT,
}: ContractorProfileFormFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FormValues>();

  const isOnboarding = variant === 'onboarding';
  const nameKey = isOnboarding ? 'profileName' : 'name';
  const emailKey = isOnboarding ? 'profileEmail' : 'email';
  const phoneKey = isOnboarding ? 'profilePhone' : 'phone';
  const websiteKey = isOnboarding ? 'profileWebsite' : 'website';
  const locationKey = isOnboarding ? 'profileLocationId' : 'locationId';
  const aboutKey = isOnboarding ? 'profileAboutUs' : 'aboutUs';

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
          placeholder="np. Kodiwo sp. z o.o."
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
          {t('profile.create.aboutLabel') || 'O nas'}
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
