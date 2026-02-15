'use client';

import { useEffect, useState } from 'react';
import { JobsFeed } from '@/components/JobsFeed';
import { FollowCategoryButton } from '@/components/FollowCategoryButton';
import type { PopularSkill } from '@/lib/api';
import { getPopularSkillsForCategory } from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getUserLocale, type Locale } from '@/lib/i18n';
import { t as translate } from '@/lib/translations';

export function JobsSectionHeader({
  sectionTitle,
  categoryId,
  categorySlugForRouting,
  page,
  categoryName,
  initialSkillIds,
  initialLocale,
}: {
  sectionTitle: string;
  categoryId?: string;
  categorySlugForRouting: string;
  page: number;
  categoryName?: string;
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
  const [popularSkills, setPopularSkills] = useState<PopularSkill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
    initialSkillIds ?? [],
  );

  const buildUrl = (opts?: { page?: number; skillIds?: string[] }) => {
    const nextPage = opts?.page ?? 1;
    const nextSkillIds = opts?.skillIds ?? selectedSkillIds;

    const searchParams = new URLSearchParams();
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

  return (
    <section
      className="flex-1 min-w-0 space-y-6 lg:min-h-[60vh]"
      aria-label={sectionTitle}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-row gap-1">
          {count !== null && (
            <h2 className="text-2xl font-semibold tracking-tight text-foreground w-3/5">
              {categoryName
                ? t('jobs.headerSampleWithCategory', {
                    category: categoryName,
                    count,
                  })
                : t('jobs.headerSampleWithoutCategory', { count })}
            </h2>
          )}
          <div className="w-2/5 flex justify-end">
            {categoryId && categoryName && (
              <FollowCategoryButton
                categoryId={categoryId}
                title={categoryName}
              />
            )}
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
        skillIds={selectedSkillIds}
        onCountChange={setCount}
      />
    </section>
  );
}
