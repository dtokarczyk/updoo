import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getProfilesList } from '@/lib/api';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig } from '@/lib/metadata-config';
import { t } from '@/lib/translations';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).companyList;
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function ProfilesListPage() {
  const locale = await getLocaleFromRequest();
  const { items, total } = await getProfilesList(1, 24);

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
                <Link href={`/company/${profile.slug}`} className="block h-full">
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    {profile.coverPhotoUrl ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
                        <Image
                          src={profile.coverPhotoUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-t-xl bg-muted" />
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="line-clamp-2 text-lg">
                        {profile.name}
                      </CardTitle>
                      {profile.location?.name && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-1">
                            {profile.location.name}
                          </span>
                        </div>
                      )}
                    </CardHeader>
                    {profile.aboutUs && (
                      <CardContent className="pt-0">
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                          {profile.aboutUs}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
