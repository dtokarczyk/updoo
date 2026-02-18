import type { Metadata } from 'next';
import Link from 'next/link';
import { getProfilesList, type Profile } from '@/lib/api';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig, getDefaultOpenGraph } from '@/lib/metadata-config';
import { t } from '@/lib/translations';
import { getTokenFromCookies } from '@/lib/auth-server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n';

function ProfileCard({
  profile,
  locale,
  showVerificationState,
}: {
  profile: Profile;
  locale: Locale;
  showVerificationState: boolean;
}) {
  const isUnverified = !profile.isVerified;
  const hasRejection = !!profile.rejectedReason;
  const borderClass =
    showVerificationState && isUnverified
      ? 'ring-2 ring-amber-500 dark:ring-amber-400'
      : '';

  return (
    <Link href={`/company/${profile.slug}`} className="block h-full">
      <Card
        className={cn(
          'h-full transition-colors hover:bg-muted/50',
          borderClass,
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="line-clamp-2 text-lg">{profile.name}</CardTitle>
          {profile.location?.name && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{profile.location.name}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {hasRejection && showVerificationState && (
            <p className="text-xs text-amber-700 dark:text-amber-300 line-clamp-2 mb-2">
              {t(locale, 'company.rejectionReason')}: {profile.rejectedReason}
            </p>
          )}
          {profile.aboutUs ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {profile.aboutUs}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).companyList;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl';
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      ...getDefaultOpenGraph(baseUrl, '/profiles'),
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function ProfilesListPage() {
  const locale = await getLocaleFromRequest();
  const token = await getTokenFromCookies();
  const { items, total } = await getProfilesList(1, 24, token);
  const showVerificationState = items.some((p) => !p.isVerified);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {t(locale, 'company.listTitle')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t(locale, 'company.listDescription')}
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {t(locale, 'company.emptyList')}
        </p>
      ) : (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            {t(locale, 'company.totalCount', { count: String(total) })}
          </p>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((profile) => (
              <li key={profile.id}>
                <ProfileCard
                  profile={profile}
                  locale={locale}
                  showVerificationState={showVerificationState}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
