'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  getCategories,
  getLocations,
  getSkills,
  getDraftJob,
  type Category,
  type Location,
  type Skill,
  type BillingType,
  type HoursPerWeek,
  type ExperienceLevel,
  type ProjectType,
  type CreateJobPayload,
  type Job,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SelectBox } from '@/components/ui/SelectBox';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/useTranslations';
import {
  jobFormSchema,
  defaultJobFormValues,
  type JobFormValues,
  type SelectedSkill,
} from '@/components/job-form-schema';

const CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP', 'CHF'];

/** Suggested hourly rates in PLN by category slug (backend slug, locale-independent). */
const SUGGESTED_HOURLY_RATES_PLN: Record<
  string,
  { JUNIOR: number; MID: number; SENIOR: number }
> = {
  programming: { JUNIOR: 70, MID: 120, SENIOR: 180 },
  design: { JUNIOR: 60, MID: 100, SENIOR: 150 },
  marketing: { JUNIOR: 55, MID: 95, SENIOR: 140 },
  writing: { JUNIOR: 50, MID: 85, SENIOR: 130 },
  'office-working': { JUNIOR: 45, MID: 75, SENIOR: 110 },
  other: { JUNIOR: 50, MID: 90, SENIOR: 130 },
};

const DEFAULT_SUGGESTED_HOURLY_PLN = 100;

function getSuggestedHourlyRatePln(
  categorySlug: string,
  experienceLevel: ExperienceLevel,
): number {
  const slug = categorySlug.trim().toLowerCase();
  const byLevel = SUGGESTED_HOURLY_RATES_PLN[slug];
  if (byLevel && byLevel[experienceLevel] != null) {
    return byLevel[experienceLevel];
  }
  return DEFAULT_SUGGESTED_HOURLY_PLN;
}

/** @deprecated Use JobFormValues from job-form-schema instead */
export type JobFormData = JobFormValues;

interface JobFormProps {
  initialData?: Job;
  onSubmit: (data: CreateJobPayload) => Promise<void>;
  mode: 'create' | 'edit';
  loading?: boolean;
}

export function JobForm({
  initialData,
  onSubmit,
  mode,
  loading: externalLoading = false,
}: JobFormProps) {
  const { t } = useTranslations();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const skillInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: defaultJobFormValues,
  });

  const {
    register,
    control,
    handleSubmit: rhfHandleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const { fields: selectedSkills, append: appendSkill, remove: removeSkill } = useFieldArray({
    control,
    name: 'selectedSkills',
  });

  const watchedCategoryId = watch('categoryId');
  const watchedExperienceLevel = watch('experienceLevel');
  const watchedBillingType = watch('billingType');

  const BILLING_LABELS: Record<BillingType, string> = {
    FIXED: t('jobs.fixedRate'),
    HOURLY: t('jobs.newJobForm.hourlyRate'),
  };

  const BILLING_DESCRIPTIONS: Record<BillingType, string> = {
    HOURLY: t('jobs.newJobForm.billingTypeHourlyDescription'),
    FIXED: t('jobs.newJobForm.billingTypeFixedDescription'),
  };

  const HOURS_LABELS: Record<HoursPerWeek, string> = {
    LESS_THAN_10: t('jobs.lessThan10'),
    FROM_11_TO_20: t('jobs.from11To20'),
    FROM_21_TO_30: t('jobs.from21To30'),
    MORE_THAN_30: t('jobs.moreThan30'),
  };

  const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
    JUNIOR: t('jobs.junior'),
    MID: t('jobs.mid'),
    SENIOR: t('jobs.senior'),
  };

  const EXPERIENCE_DESCRIPTIONS: Record<ExperienceLevel, string> = {
    JUNIOR: t('jobs.newJobForm.experienceJuniorDescription'),
    MID: t('jobs.newJobForm.experienceMidDescription'),
    SENIOR: t('jobs.newJobForm.experienceSeniorDescription'),
  };

  const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
    ONE_TIME: t('jobs.oneTime'),
    CONTINUOUS: t('jobs.continuous'),
  };

  const PROJECT_TYPE_DESCRIPTIONS: Record<ProjectType, string> = {
    ONE_TIME: t('jobs.newJobForm.projectTypeOneTimeDescription'),
    CONTINUOUS: t('jobs.newJobForm.projectTypeContinuousDescription'),
  };

  // Load initial data for edit mode or draft from localStorage
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const offerDays =
        initialData.deadline && initialData.createdAt
          ? (() => {
            const ms =
              new Date(initialData.deadline).getTime() -
              new Date(initialData.createdAt).getTime();
            const days = Math.round(ms / (24 * 60 * 60 * 1000));
            const allowed = [7, 14, 21, 30];
            return allowed.reduce((prev, curr) =>
              Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev,
            );
          })()
          : 14;
      const expectedOffers =
        initialData.expectedOffers != null && [6, 10, 14].includes(initialData.expectedOffers)
          ? initialData.expectedOffers
          : 10;
      reset({
        title: initialData.title,
        description: initialData.description,
        categoryId: initialData.categoryId,
        language: initialData.language ?? 'POLISH',
        billingType: initialData.billingType,
        hoursPerWeek: (initialData.hoursPerWeek ?? '') as JobFormValues['hoursPerWeek'],
        rate:
          initialData.rateNegotiable &&
            (initialData.rate === '0' || initialData.rate === '' || !initialData.rate)
            ? ''
            : (initialData.rate ?? '1000'),
        rateNegotiable: initialData.rateNegotiable ?? false,
        currency: initialData.currency ?? 'PLN',
        experienceLevel: initialData.experienceLevel,
        locationId: initialData.locationId ?? '',
        isRemote: initialData.isRemote,
        projectType: initialData.projectType,
        offerDays: offerDays as JobFormValues['offerDays'],
        expectedOffers: expectedOffers as JobFormValues['expectedOffers'],
        expectedApplicantTypes: initialData.expectedApplicantTypes ?? [],
        selectedSkills:
          initialData.skills?.map((r) => ({ skillId: r.skill.id, name: r.skill.name })) ?? [],
      });
    } else if (mode === 'create' && !draftLoaded) {
      const draft = getDraftJob();
      if (draft) {
        reset({
          title: draft.title,
          description: draft.description,
          categoryId: draft.categoryId,
          language: draft.language ?? 'POLISH',
          billingType: draft.billingType,
          hoursPerWeek: (draft.hoursPerWeek ?? '') as JobFormValues['hoursPerWeek'],
          rate:
            draft.rateNegotiable && (draft.rate === 0 || draft.rate == null)
              ? ''
              : (draft.rate?.toString() ?? ''),
          rateNegotiable: draft.rateNegotiable ?? false,
          currency: draft.currency ?? 'PLN',
          experienceLevel: draft.experienceLevel,
          locationId: draft.locationId ?? '',
          isRemote: draft.isRemote,
          projectType: draft.projectType,
          offerDays: (draft.offerDays ?? 14) as JobFormValues['offerDays'],
          expectedOffers: (draft.expectedOffers != null && [6, 10, 14].includes(draft.expectedOffers)
            ? draft.expectedOffers
            : 10) as JobFormValues['expectedOffers'],
          expectedApplicantTypes: draft.expectedApplicantTypes ?? [],
          selectedSkills: [],
        });
        setDraftLoaded(true);
      }
    }
  }, [initialData, mode, draftLoaded, reset]);

  // Load draft skills after skills list is loaded
  useEffect(() => {
    if (mode === 'create' && skills.length > 0 && draftLoaded) {
      const draft = getDraftJob();
      if (draft) {
        const loadedSkills: SelectedSkill[] = [];
        if (draft.skillIds?.length) {
          draft.skillIds.forEach((id) => {
            const skill = skills.find((s) => s.id === id);
            if (skill) loadedSkills.push({ skillId: skill.id, name: skill.name });
          });
        }
        if (draft.newSkillNames?.length) {
          draft.newSkillNames.forEach((name) => loadedSkills.push({ skillId: null, name }));
        }
        if (loadedSkills.length > 0) {
          setValue('selectedSkills', loadedSkills);
        }
      }
    }
  }, [mode, skills, draftLoaded, setValue]);

  // Load categories, locations, skills
  useEffect(() => {
    Promise.all([getCategories(), getLocations(), getSkills()])
      .then(([cats, locs, sk]) => {
        setCategories(cats);
        setLocations(locs);
        setSkills(sk);
      })
      .catch(() => setSubmitError(t('jobs.failedToLoadData')))
      .finally(() => setLoading(false));
  }, [t]);

  // Suggest hourly rate from category × experience level (create mode, HOURLY)
  useEffect(() => {
    if (
      mode !== 'create' ||
      !watchedCategoryId ||
      !watchedExperienceLevel ||
      watchedBillingType !== 'HOURLY'
    )
      return;
    const category = categories.find((c) => c.id === watchedCategoryId);
    if (!category) return;
    const suggested = getSuggestedHourlyRatePln(
      category.slug,
      watchedExperienceLevel as ExperienceLevel,
    );
    setValue('rate', String(suggested));
  }, [mode, watchedCategoryId, watchedExperienceLevel, watchedBillingType, categories, setValue]);

  const addSkill = (skill: SelectedSkill) => {
    if (selectedSkills.length >= 5) return;
    if (
      selectedSkills.some(
        (s) => s.name.toLowerCase() === skill.name.toLowerCase(),
      )
    )
      return;
    appendSkill(skill);
    setSkillInput('');
    setSkillDropdownOpen(false);
    skillInputRef.current?.focus();
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (selectedSkills.length >= 5) return;
      const raw = skillInput.trim();
      if (!raw) return;
      const fromDict = skills.find(
        (s) => s.name.toLowerCase() === raw.toLowerCase(),
      );
      if (fromDict) addSkill({ skillId: fromDict.id, name: fromDict.name });
      else addSkill({ skillId: null, name: raw });
    }
  };

  const filteredSkills = skillInput.trim()
    ? skills.filter(
      (s) =>
        s.name.toLowerCase().includes(skillInput.toLowerCase()) &&
        !selectedSkills.some((sel) => sel.skillId === s.id),
    )
    : [];

  const onFormSubmit = async (data: JobFormValues) => {
    setSubmitError(null);
    const rateNum = parseFloat(data.rate.replace(',', '.'));
    const rateOmitted =
      data.rate.trim() === '' || Number.isNaN(rateNum) || rateNum < 0;
    const effectiveRate = rateOmitted ? null : rateNum;
    const effectiveRateNegotiable = data.rateNegotiable || rateOmitted;
    try {
      await onSubmit({
        title: data.title.trim(),
        description: data.description.trim(),
        categoryId: data.categoryId,
        language: 'POLISH',
        billingType: data.billingType as BillingType,
        hoursPerWeek:
          data.billingType === 'HOURLY'
            ? (data.hoursPerWeek as HoursPerWeek)
            : undefined,
        rate: effectiveRate,
        rateNegotiable: effectiveRateNegotiable,
        currency: data.currency,
        experienceLevel: data.experienceLevel as ExperienceLevel,
        locationId: data.locationId || undefined,
        isRemote: data.isRemote,
        projectType: data.projectType as ProjectType,
        offerDays: data.offerDays as number,
        expectedOffers: data.expectedOffers as number,
        expectedApplicantTypes: data.expectedApplicantTypes,
        skillIds: data.selectedSkills
          .filter((s) => s.skillId != null)
          .map((s) => s.skillId as string),
        newSkillNames: data.selectedSkills
          .filter((s) => s.skillId == null)
          .map((s) => s.name),
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('jobs.failedToCreate'),
      );
    }
  };

  if (loading || externalLoading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <form onSubmit={rhfHandleSubmit(onFormSubmit)} className="space-y-8">
      {submitError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {submitError}
        </p>
      )}

      {/* Step 1: Title, Description, Category (language always POLISH, set on backend) */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('jobs.newJobForm.step1')}</h2>
        <div className="space-y-2">
          <Label htmlFor="title">{t('jobs.title')}</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder={t('jobs.newJobForm.titlePlaceholder')}
            maxLength={200}
            disabled={isSubmitting}
            className={cn(
              'h-11 text-base',
              errors.title && 'border-destructive',
            )}
            aria-invalid={!!errors.title}
          />
          {errors.title?.message && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t(errors.title.message)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t('jobs.description')}</Label>
          <textarea
            id="description"
            {...register('description')}
            placeholder={t('jobs.newJobForm.descriptionPlaceholder')}
            maxLength={5000}
            rows={6}
            disabled={isSubmitting}
            className={cn(
              'flex w-full rounded-md border bg-transparent px-4 py-3 text-base shadow-xs transition-[color,box-shadow] outline-none',
              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              'placeholder:text-muted-foreground disabled:opacity-50',
              errors.description ? 'border-destructive' : 'border-input',
            )}
            aria-invalid={!!errors.description}
          />
          {errors.description?.message && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t(errors.description.message)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t('jobs.category')}</Label>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('common.loading')}
            </p>
          ) : (
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories.map((c) => (
                      <SelectBox
                        key={c.id}
                        value={c.id}
                        label={c.name}
                        selected={field.value === c.id}
                        onSelect={() => field.onChange(c.id)}
                        disabled={isSubmitting}
                        className={
                          errors.categoryId ? 'border-destructive' : undefined
                        }
                      />
                    ))}
                  </div>
                  {errors.categoryId?.message && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {t(errors.categoryId.message)}
                    </p>
                  )}
                </>
              )}
            />
          )}
        </div>
      </div>

      {/* Step 2: Experience Level, Expected Skills, Remote */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('jobs.newJobForm.step2')}</h2>

        <div className="space-y-3">
          <Label>{t('jobs.experienceLevel')}</Label>
          <Controller
            name="experienceLevel"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map(
                  (level) => (
                    <SelectBox
                      key={level}
                      value={level}
                      label={EXPERIENCE_LABELS[level]}
                      description={EXPERIENCE_DESCRIPTIONS[level]}
                      selected={field.value === level}
                      onSelect={() => field.onChange(level)}
                      disabled={isSubmitting}
                      className={
                        errors.experienceLevel ? 'border-destructive' : undefined
                      }
                    />
                  ),
                )}
              </div>
            )}
          />
          {errors.experienceLevel?.message && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t(errors.experienceLevel.message)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t('jobs.newJobForm.expectedSkills')}</Label>
          <p className="text-xs text-muted-foreground">
            {t('jobs.newJobForm.skillsDescription')}{' '}
            {t('jobs.newJobForm.skillsMaxCount')}
          </p>
          <div className="flex flex-wrap gap-2 p-2 border border-input rounded-md bg-transparent min-h-10">
            {selectedSkills.map((s, i) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-sm"
              >
                {s.name}
                <button
                  type="button"
                  onClick={() => removeSkill(i)}
                  disabled={isSubmitting}
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 leading-none"
                  aria-label={t('jobs.newJobForm.remove')}
                >
                  ×
                </button>
              </span>
            ))}
            <div className="relative inline-flex flex-1 min-w-[120px]">
              <Input
                ref={skillInputRef}
                value={skillInput}
                onChange={(e) => {
                  setSkillInput(e.target.value);
                  setSkillDropdownOpen(true);
                }}
                onFocus={() => setSkillDropdownOpen(true)}
                onBlur={() =>
                  setTimeout(() => setSkillDropdownOpen(false), 150)
                }
                onKeyDown={handleSkillKeyDown}
                placeholder={
                  selectedSkills.length >= 5
                    ? t('jobs.newJobForm.skillsMaxCount')
                    : t('jobs.newJobForm.addSkillPlaceholder')
                }
                disabled={isSubmitting || selectedSkills.length >= 5}
                className="border-0 shadow-none focus-visible:ring-0 h-11 text-base min-w-0"
              />
              {skillDropdownOpen &&
                selectedSkills.length < 5 &&
                (filteredSkills.length > 0 || skillInput.trim()) && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-md border border-input bg-background py-1 shadow-md">
                    {filteredSkills.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addSkill({ skillId: s.id, name: s.name });
                        }}
                      >
                        {s.name}
                      </button>
                    ))}
                    {skillInput.trim() &&
                      !skills.some(
                        (s) =>
                          s.name.toLowerCase() ===
                          skillInput.trim().toLowerCase(),
                      ) && (
                        <button
                          type="button"
                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted text-muted-foreground"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addSkill({ skillId: null, name: skillInput.trim() });
                          }}
                        >
                          {t('jobs.newJobForm.addNewSkill', {
                            name: skillInput.trim(),
                          })}
                        </button>
                      )}
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Controller
            name="isRemote"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isRemote"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor="isRemote"
                  className="cursor-pointer text-base font-medium"
                >
                  {t('jobs.remoteWork')}
                </Label>
              </div>
            )}
          />

          <Controller
            name="locationId"
            control={control}
            render={({ field }) =>
              !watch('isRemote') ? (
                <div className="space-y-2">
                  <Label htmlFor="location">{t('jobs.location')}</Label>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || locations.length === 0}
                  >
                    <SelectTrigger className="h-11 text-base">
                      <SelectValue placeholder={t('jobs.newJobForm.notSelected')} />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <></>
              )
            }
          />
        </div>
      </div>

      {/* Step 3: Project Type, Billing Type, Hours Per Week, Fixed Rate */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('jobs.newJobForm.step3')}</h2>

        <div className="space-y-3">
          <Label>{t('jobs.projectType')}</Label>
          <Controller
            name="projectType"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((type) => (
                  <SelectBox
                    key={type}
                    value={type}
                    label={PROJECT_TYPE_LABELS[type]}
                    description={PROJECT_TYPE_DESCRIPTIONS[type]}
                    selected={field.value === type}
                    onSelect={() => field.onChange(type)}
                    disabled={isSubmitting}
                    className={
                      errors.projectType ? 'border-destructive' : undefined
                    }
                  />
                ))}
              </div>
            )}
          />
          {errors.projectType?.message && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t(errors.projectType.message)}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label>{t('jobs.billingType')}</Label>
          <Controller
            name="billingType"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(BILLING_LABELS) as BillingType[]).map((type) => (
                  <SelectBox
                    key={type}
                    value={type}
                    label={BILLING_LABELS[type]}
                    description={BILLING_DESCRIPTIONS[type]}
                    selected={field.value === type}
                    onSelect={() => field.onChange(type)}
                    disabled={isSubmitting}
                    className={
                      errors.billingType ? 'border-destructive' : undefined
                    }
                  />
                ))}
              </div>
            )}
          />
          {errors.billingType?.message && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t(errors.billingType.message)}
            </p>
          )}

          {watch('billingType') === 'HOURLY' && (
            <Controller
              name="hoursPerWeek"
              control={control}
              render={({ field }) => (
                <div className="space-y-3 mt-4">
                  <Label>{t('jobs.hoursPerWeek')}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Object.keys(HOURS_LABELS) as HoursPerWeek[]).map((hours) => (
                      <SelectBox
                        key={hours}
                        value={hours}
                        label={HOURS_LABELS[hours]}
                        selected={field.value === hours}
                        onSelect={() => field.onChange(hours)}
                        disabled={isSubmitting}
                        className={
                          errors.hoursPerWeek ? 'border-destructive' : undefined
                        }
                      />
                    ))}
                  </div>
                  {errors.hoursPerWeek?.message && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {t(errors.hoursPerWeek.message)}
                    </p>
                  )}
                </div>
              )}
            />
          )}

          {watch('billingType') && (
            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">
                    {watch('billingType') === 'HOURLY'
                      ? t('jobs.newJobForm.hourlyRate')
                      : t('jobs.newJobForm.fixedRate')}
                  </Label>
                  <Input
                    id="rate"
                    type="number"
                    min={0}
                    step="0.01"
                    {...register('rate')}
                    placeholder={t('jobs.rateOptionalPlaceholder')}
                    disabled={isSubmitting}
                    className={cn(
                      'h-11 text-base',
                      errors.rate && 'border-destructive',
                    )}
                    aria-invalid={!!errors.rate}
                  />
                  {errors.rate?.message && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {t(errors.rate.message)}
                    </p>
                  )}
                  {watch('billingType') === 'HOURLY' && (
                    <p className="text-xs text-muted-foreground">
                      {t('jobs.newJobForm.suggestedRateNote')}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('jobs.currency')}</Label>
                  <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <Controller
                name="rateNegotiable"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="rateNegotiable"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="rateNegotiable" className="cursor-pointer">
                      {t('jobs.rateNegotiable')}
                    </Label>
                  </div>
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Step 4: Offer Days */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('jobs.newJobForm.step4')}</h2>

        <div className="space-y-3">
          <Label>{t('jobs.offerDays')}</Label>
          <Controller
            name="offerDays"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {([7, 14, 21, 30] as const).map((days) => (
                  <SelectBox
                    key={days}
                    value={days.toString()}
                    label={`${days} ${t('jobs.newJobForm.days')}`}
                    selected={field.value === days}
                    onSelect={() => field.onChange(days)}
                    disabled={isSubmitting}
                    className={errors.offerDays ? 'border-destructive' : undefined}
                  />
                ))}
              </div>
            )}
          />
          {errors.offerDays?.message && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t(errors.offerDays.message)}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label>{t('jobs.expectedOffers')}</Label>
          <p className="text-sm text-muted-foreground">
            {t('jobs.newJobForm.expectedOffersDescription')}
          </p>
          <Controller
            name="expectedOffers"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-3">
                {([6, 10, 14] as const).map((num) => (
                  <SelectBox
                    key={num}
                    value={num.toString()}
                    label={num.toString()}
                    selected={field.value === num}
                    onSelect={() => field.onChange(num)}
                    disabled={isSubmitting}
                    className={errors.expectedOffers ? 'border-destructive' : undefined}
                  />
                ))}
              </div>
            )}
          />
          {errors.expectedOffers?.message && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t(errors.expectedOffers.message)}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label>{t('jobs.expectedApplicantType')}</Label>
          <p className="text-sm text-muted-foreground">
            {t('jobs.newJobForm.expectedApplicantTypeDescription')}
          </p>
          <Controller
            name="expectedApplicantTypes"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    { value: 'FREELANCER_NO_B2B', labelKey: 'jobs.newJobForm.expectedApplicantTypeFreelancerNoB2B' },
                    { value: 'FREELANCER_B2B', labelKey: 'jobs.newJobForm.expectedApplicantTypeFreelancerB2B' },
                    { value: 'COMPANY', labelKey: 'jobs.newJobForm.expectedApplicantTypeCompany' },
                  ] as const
                ).map(({ value, labelKey }) => (
                  <SelectBox
                    key={value}
                    value={value}
                    label={t(labelKey)}
                    selected={field.value.includes(value)}
                    onSelect={() => {
                      const next = field.value.includes(value)
                        ? field.value.filter((v) => v !== value)
                        : [...field.value, value];
                      field.onChange(next);
                    }}
                    disabled={isSubmitting}
                    className={errors.expectedApplicantTypes ? 'border-destructive' : undefined}
                  />
                ))}
              </div>
            )}
          />
          {errors.expectedApplicantTypes?.message && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t(errors.expectedApplicantTypes.message)}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
        {isSubmitting
          ? t('jobs.newJobForm.submitting')
          : mode === 'create'
            ? t('jobs.newJobForm.submit')
            : t('jobs.saveChanges')}
      </Button>
    </form>
  );
}
