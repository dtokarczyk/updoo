'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/useTranslations';

export function BlogStickySidebar() {
  const { t } = useTranslations();

  return (
    <aside
      className="w-full lg:w-80 flex-shrink-0 space-y-4"
      aria-label="Akcje i rejestracja"
    >
      <div className="sticky top-24 space-y-4">
        <Button
          asChild
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-bold gap-2"
        >
          <Link href="/job/new">
            <Plus className="size-4" aria-hidden />
            {t('blog.createJob')}
          </Link>
        </Button>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-2">
            {t('blog.sidebarTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('blog.sidebarDescription')}
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg">
              <Link href="/register">
                {t('blog.register')}
              </Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t('blog.haveAccount')}
            </p>
            <Button
              asChild
              variant="outline"
              className="w-full rounded-lg border border-border"
            >
              <Link href="/login">{t('blog.login')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
