'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import { Sidebar } from './sidebar';

const DESKTOP_BREAKPOINT = 768;

export default function MyPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const check = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !isDesktop) return;
    router.replace('/my/applications');
  }, [mounted, isDesktop, router]);

  if (!mounted) {
    return null;
  }

  if (isDesktop) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-2">
      <h1 className="text-xl font-semibold">{t('my.title')}</h1>
      <p className="text-sm text-muted-foreground mb-2">{t('my.desc')}</p>
      <Sidebar variant="list" />
    </div>
  );
}
