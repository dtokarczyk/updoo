'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { type Category, getStoredUser, getToken } from '@/lib/api';
import { CategoryIcon } from '@/components/CategoryIcon';
import { cn } from '@/lib/utils';
import { getUserLocale, type Locale } from '@/lib/i18n';
import { t as translate } from '@/lib/translations';

export function CategoriesSidebarDesktop({
  categories,
  currentCategorySlug,
  initialLocale,
}: {
  categories: Category[];
  currentCategorySlug?: string;
  initialLocale?: Locale;
}) {
  // Use initialLocale from server during SSR to avoid hydration mismatch
  // After hydration, use client locale which may differ if user preferences changed
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale ?? getUserLocale(),
  );
  const [, setCanCreateJob] = useState(false);

  // Update locale after mount if client locale differs from initial locale
  useEffect(() => {
    const currentLocale = getUserLocale();
    if (currentLocale !== initialLocale) {
      queueMicrotask(() => setLocaleState(currentLocale));
    }
    const token = getToken();
    const user = getStoredUser();
    queueMicrotask(() =>
      setCanCreateJob(!!token && user?.accountType === 'CLIENT'),
    );
  }, [initialLocale]);

  // Use server locale for translations during SSR, client locale after mount
  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(locale, key, params);
  };

  const allLabel = t('common.all');

  return (
    <nav className="hidden lg:block">
      <ul>
        <li>
          <Link
            href="/"
            className={cn(
              'group flex items-center gap-3 rounded-lg px-2 py-1.5 text-xl font-semibold transition-colors',
              !currentCategorySlug
                ? 'bg-muted/60 text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <CategoryIcon
              categoryName={allLabel}
              className={cn(
                'h-9 w-9 shrink-0',
                currentCategorySlug && 'group-hover:opacity-70',
              )}
            />
            {allLabel}
          </Link>
        </li>
        {categories.map((cat) => {
          const isActive = currentCategorySlug === cat.slug;
          return (
            <li key={cat.id}>
              <Link
                href={`/jobs/${encodeURIComponent(cat.slug)}/1`}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-2 py-1.5 text-xl font-semibold transition-colors',
                  isActive
                    ? 'bg-muted/60 text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <CategoryIcon
                  categoryName={cat.name}
                  className={cn(
                    'h-9 w-9 shrink-0',
                    !isActive && 'group-hover:opacity-70',
                  )}
                />
                {cat.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
