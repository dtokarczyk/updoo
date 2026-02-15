'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Upload,
  Users,
  ShieldCheck,
  UserCircle,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

type HeroTab = 'hiring' | 'finding';

const HERO_VIDEO_SRC = '/videos/video-hero.mp4';

const TAB_PARAM = 'tab';
const TAB_FOR_CUSTOMERS = 'forCustomers';
const TAB_FOR_FREELANCERS = 'forFreelancers';

function tabFromParam(param: string | null): HeroTab | null {
  if (param === TAB_FOR_CUSTOMERS) return 'hiring';
  if (param === TAB_FOR_FREELANCERS) return 'finding';
  return null;
}

export function HeroBanner({
  t,
}: {
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const searchParams = useSearchParams();
  const tabFromUrl = tabFromParam(searchParams.get(TAB_PARAM));
  const [heroTab, setHeroTab] = useState<HeroTab>(tabFromUrl ?? 'hiring');

  return (
    <div className="relative w-full max-w-full rounded-xl overflow-hidden mb-6">
      <video
        src={HERO_VIDEO_SRC}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      />
      <div className="relative bg-background/80 lg:bg-background/70 flex flex-col justify-between p-5 pb-5 md:min-h-[70vh] ">
        <div className="mb-4">
          <h1 className="text-3xl lg:text-4xl font-black pr-7 pl-4 pt-4 text-white text-left mb-1">
            {t('homepage.heroText')}
          </h1>
          <p className="text-lg lg:text-xl text-white/90 font-medium pr-7 pl-4 mb-4">
            {t('homepage.heroSubtitle')}
          </p>

          <ul className="flex flex-col gap-4 pr-7 pl-4 mb-4 text-white/90 list-none">
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                1
              </span>
              <div>
                <p className="text-lg lg:text-xl font-medium text-white">
                  {t('homepage.heroBenefit1')}
                </p>
                <p className="text-base text-white/80 leading-relaxed mt-0.5">
                  {t('homepage.heroBenefit1Desc')}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                2
              </span>
              <div>
                <p className="text-lg lg:text-xl font-medium text-white">
                  {t('homepage.heroBenefit2')}
                </p>
                <p className="text-base text-white/80 leading-relaxed mt-0.5">
                  {t('homepage.heroBenefit2Desc')}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                3
              </span>
              <div>
                <p className="text-lg lg:text-xl font-medium text-white">
                  {t('homepage.heroBenefit3')}
                </p>
                <p className="text-base text-white/80 leading-relaxed mt-0.5">
                  {t('homepage.heroBenefit3Desc')}
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div>
          <div className="flex mx-4 gap-1">
            <button
              type="button"
              onClick={() => setHeroTab('hiring')}
              className={`w-full rounded-t-lg cursor-pointer text-lg font-bold leading-none transition-colors p-3 ${heroTab === 'hiring'
                ? 'bg-white text-black'
                : 'bg-white/10 backdrop-blur-md border-t border-x border-white/20 text-white/90 hover:bg-white/15'
                }`}
            >
              {t('homepage.forHiring')}
            </button>
            <button
              type="button"
              onClick={() => setHeroTab('finding')}
              className={`w-full rounded-t-lg cursor-pointer text-lg font-bold leading-none transition-colors p-3 ${heroTab === 'finding'
                ? 'bg-white text-black'
                : 'bg-white/10 backdrop-blur-md border-t border-x border-white/20 text-white/90 hover:bg-white/15'
                }`}
            >
              {t('homepage.forFindingJobs')}
            </button>
          </div>
          <div className="w-full py-4 px-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
            {(() => {
              const hiringIcons: LucideIcon[] = [Sparkles, Upload, Users];
              const findingIcons: LucideIcon[] = [
                ShieldCheck,
                UserCircle,
                Briefcase,
              ];
              const icons = heroTab === 'hiring' ? hiringIcons : findingIcons;
              const labels =
                heroTab === 'hiring'
                  ? [
                    t('homepage.heroFeature1'),
                    t('homepage.heroFeature2'),
                    t('homepage.heroFeature3'),
                  ]
                  : [
                    t('homepage.heroFeature1FindingJobs'),
                    t('homepage.heroFeature2FindingJobs'),
                    t('homepage.heroFeature3FindingJobs'),
                  ];
              return (
                <div className="flex flex-col gap-5 mb-4">
                  {icons.map((Icon, i) => (
                    <div key={i} className="flex items-center gap-3 text-left">
                      <div className="flex shrink-0 items-center justify-center w-11 h-11 rounded-full bg-white/20 text-white">
                        <Icon className="w-5 h-5" aria-hidden />
                      </div>
                      <p className="text-base lg:text-lg font-medium text-white/95 leading-relaxed">
                        {labels[i]}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="flex justify-center">
              {heroTab === 'hiring' ? (
                <Button
                  asChild
                  size="lg"
                  variant="default"
                  className="text-lg px-8 py-6 bg-white text-black hover:bg-gray-100 focus-visible:ring-white/20"
                >
                  <Link href="/job/new">{t('jobs.createJob')}</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  variant="default"
                  className="text-lg px-8 py-6 bg-white text-black hover:bg-gray-100 focus-visible:ring-white/20"
                >
                  <Link href="/register">
                    {t('homepage.createFreeProfile')}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
