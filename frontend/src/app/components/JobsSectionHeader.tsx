'use client';

import { useEffect, useState } from 'react';
import { JobsFeed } from '@/app/components/JobsFeed';
import type { JobLanguage, PopularSkill } from '@/lib/api';
import { getPopularSkillsForCategory } from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import { useRouter } from 'next/navigation';
import ReactCountryFlag from 'react-country-flag';
import { Button } from '@/components/ui/button';
import { getUserLocale, type Locale } from '@/lib/i18n';
import { t as translate } from '@/lib/translations';

export function JobsSectionHeader({
  sectionTitle,
  categoryId,
  categorySlugForRouting,
  page,
  categoryName,
  initialLanguage,
  initialSkillIds,
  initialLocale,
}: {
  sectionTitle: string;
  categoryId?: string;
  categorySlugForRouting: string;
  page: number;
  categoryName?: string;
  initialLanguage?: JobLanguage;
  initialSkillIds?: string[];
  /** Initial locale from server to avoid hydration mismatch */
  initialLocale?: Locale;
}) {
  const { locale: clientLocale } = useTranslations();

  // Use initialLocale from server during SSR to avoid hydration mismatch
  // After hydration, use client locale which may differ if user preferences changed
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale ?? clientLocale,
  );

  // Update locale after mount if client locale differs from initial locale
  useEffect(() => {
    const currentLocale = getUserLocale();
    if (currentLocale !== initialLocale) {
      queueMicrotask(() => setLocaleState(currentLocale));
    }
  }, [initialLocale]);

  // Use server locale for translations during SSR, client locale after mount
  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(locale, key, params);
  };
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);
  const [language, setLanguage] = useState<'' | JobLanguage>(
    initialLanguage ?? '',
  );
  const [popularSkills, setPopularSkills] = useState<PopularSkill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
    initialSkillIds ?? [],
  );

  const buildUrl = (opts?: {
    page?: number;
    language?: '' | JobLanguage;
    skillIds?: string[];
  }) => {
    const nextPage = opts?.page ?? 1;
    const nextLanguage = opts?.language ?? language;
    const nextSkillIds = opts?.skillIds ?? selectedSkillIds;

    const searchParams = new URLSearchParams();
    if (
      nextLanguage &&
      (nextLanguage === 'ENGLISH' || nextLanguage === 'POLISH')
    ) {
      searchParams.set('language', nextLanguage);
    }
    if (nextSkillIds.length > 0) {
      searchParams.set('skills', nextSkillIds.join(','));
    }

    const search = searchParams.toString();
    const base =
      categorySlugForRouting === 'all' && nextPage === 1
        ? '/'
        : `/jobs/${encodeURIComponent(categorySlugForRouting)}/${nextPage}`;
    return `${base}${search ? `?${search}` : ''}`;
  };

  useEffect(() => {
    if (!categoryId) {
      queueMicrotask(() => {
        setPopularSkills([]);
        setSelectedSkillIds([]);
      });
      return;
    }
    let cancelled = false;
    getPopularSkillsForCategory(categoryId)
      .then((skills) => {
        if (cancelled) return;
        setPopularSkills(skills);
        // Ensure selected skills always belong to current popular list.
        setSelectedSkillIds((prev) =>
          prev.filter((id) => skills.some((s) => s.id === id)),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setPopularSkills([]);
        setSelectedSkillIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const LANGUAGE_OPTIONS: {
    value: '' | JobLanguage;
    label: string;
    countryCode?: string;
  }[] = [
      { value: '', label: t('jobs.allLanguages') },
      { value: 'ENGLISH', label: t('jobs.english'), countryCode: 'GB' },
      { value: 'POLISH', label: t('jobs.polish'), countryCode: 'PL' },
    ];

  return (
    <section
      className="flex-1 min-w-0 space-y-6 lg:min-h-[60vh]"
      aria-label={sectionTitle}
    >
      <div className="flex flex-col gap-3">
        {count !== null && (
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {categoryName
              ? t('jobs.headerSampleWithCategory', {
                category: categoryName,
                count,
              })
              : t('jobs.headerSampleWithoutCategory', { count })}
          </h2>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {LANGUAGE_OPTIONS.map((opt) => {
              const isActive = language === opt.value;
              if (opt.value === '') {
                return (
                  <Button
                    key="all-languages"
                    type="button"
                    size="sm"
                    variant={isActive ? 'default' : 'outline'}
                    className="rounded-full px-3 py-1 text-xs cursor-pointer"
                    onClick={() => {
                      setLanguage('');
                      const target = buildUrl({
                        page: 1,
                        language: '',
                        skillIds: selectedSkillIds,
                      });
                      router.replace(target, { scroll: false });
                    }}
                  >
                    {opt.label}
                  </Button>
                );
              }
              return (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={isActive ? 'default' : 'outline'}
                  className="rounded-full px-3 py-1 text-xs flex items-center gap-1 cursor-pointer"
                  onClick={() => {
                    const nextValue =
                      language === opt.value ? '' : (opt.value as JobLanguage);
                    setLanguage(nextValue as '' | JobLanguage);
                    const target = buildUrl({
                      page: 1,
                      language: nextValue as '' | JobLanguage,
                      skillIds: selectedSkillIds,
                    });
                    router.replace(target, { scroll: false });
                  }}
                  aria-pressed={isActive}
                  aria-label={opt.label}
                >
                  {opt.countryCode && (
                    <ReactCountryFlag
                      svg
                      countryCode={opt.countryCode}
                      className="mr-1"
                      style={{ width: '1em', height: '1em' }}
                    />
                  )}
                  <span>{opt.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {popularSkills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {popularSkills.map((skill) => {
              const isActive = selectedSkillIds.includes(skill.id);
              return (
                <Button
                  key={skill.id}
                  type="button"
                  size="sm"
                  variant={isActive ? 'default' : 'outline'}
                  className="rounded-full px-3 py-1 text-xs cursor-pointer"
                  onClick={() => {
                    const exists = selectedSkillIds.includes(skill.id);
                    const nextSkillIds = exists
                      ? selectedSkillIds.filter((id) => id !== skill.id)
                      : [...selectedSkillIds, skill.id];
                    setSelectedSkillIds(nextSkillIds);
                    const target = buildUrl({
                      page: 1,
                      language,
                      skillIds: nextSkillIds,
                    });
                    router.replace(target, { scroll: false });
                  }}
                  aria-pressed={isActive}
                >
                  {skill.name}
                </Button>
              );
            })}
          </div>
        )}
      </div>
      <JobsFeed
        categoryId={categoryId}
        categorySlug={categorySlugForRouting}
        page={page}
        language={language || undefined}
        skillIds={selectedSkillIds}
        onCountChange={setCount}
      />
    </section>
  );
}
