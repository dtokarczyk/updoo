'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { type Category, getStoredUser, getToken } from '@/lib/api';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getUserLocale, type Locale } from '@/lib/i18n';
import { t as translate } from '@/lib/translations';

export function CategoriesSidebarMobile({
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

  const allLabel = t('common.all');
  const [open, setOpen] = useState(false);
  const [canCreateJob, setCanCreateJob] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    queueMicrotask(() =>
      setCanCreateJob(!!token && user?.accountType === 'CLIENT'),
    );
  }, []);

  const currentLabel = currentCategorySlug
    ? (categories.find((c) => c.slug === currentCategorySlug)?.name ?? allLabel)
    : allLabel;

  return (
    <nav className="lg:hidden py-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex w-full items-center justify-between gap-2 text-xl font-semibold text-foreground',
            'rounded-md border border-input bg-background px-3',
            'py-2.5',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
          aria-expanded={open}
        >
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <CategoryIcon
              categoryName={currentLabel}
              className="h-9 w-9 shrink-0"
            />
            {currentLabel}
          </span>
          {open ? (
            <ChevronUp className="size-6 shrink-0" aria-hidden />
          ) : (
            <ChevronDown className="size-6 shrink-0" aria-hidden />
          )}
        </button>
        {canCreateJob && (
          <Link
            href="/job/new"
            onClick={() => setOpen(false)}
            className="shrink-0"
          >
            <Button
              type="button"
              size="icon"
              className="size-11 rounded-md"
              aria-label={t('jobs.newJob')}
            >
              <Plus className="size-5" aria-hidden />
            </Button>
          </Link>
        )}
      </div>
      <ul
        className={cn(
          'space-y-1 overflow-hidden transition-[max-height] duration-200 ease-in-out pt-1',
          open ? 'max-h-200' : 'max-h-0',
        )}
      >
        {currentCategorySlug && (
          <li>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-xl font-semibold transition-colors',
                !currentCategorySlug
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <CategoryIcon
                categoryName={allLabel}
                className="h-9 w-9 shrink-0"
              />
              {allLabel}
            </Link>
          </li>
        )}
        {categories
          .filter((cat) => cat.slug !== currentCategorySlug)
          .map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/jobs/${encodeURIComponent(cat.slug)}/1`}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-xl font-semibold transition-colors',
                  currentCategorySlug === cat.slug
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <CategoryIcon
                  categoryName={cat.name}
                  className="h-9 w-9 shrink-0"
                />
                {cat.name}
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  );
}
