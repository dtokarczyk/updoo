'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/useTranslations';

export function BlogSignUpCta() {
  const { t } = useTranslations();

  return (
    <section
      className="mt-12 pt-8 border-t border-border"
      aria-label="Załóż konto w Hoplo"
    >
      <div className="bg-muted/50 rounded-xl p-6 md:p-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">
          {t('blog.ctaTitle')}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          {t('blog.ctaDescription')}
        </p>
        <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/register">
            {t('blog.register')}
          </Link>
        </Button>
      </div>
    </section>
  );
}
