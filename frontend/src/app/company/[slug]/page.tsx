'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProfileBySlug, getStoredUser, type Profile } from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Globe, Mail, MapPin, Phone } from 'lucide-react';

export default function CompanyProfilePage() {
  const params = useParams();
  const { t } = useTranslations();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError(t('company.missingProfileId'));
      return;
    }
    getProfileBySlug(slug)
      .then(setProfile)
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('company.profileNotFound'));
      })
      .finally(() => setLoading(false));
  }, [slug, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <main className="max-w-2xl mx-auto text-center text-muted-foreground">
          {t('company.loadingProfile')}
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <main className="max-w-2xl mx-auto text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {t('company.profileNotFound')}
          </h1>
          <p className="text-muted-foreground mb-4">
            {error ?? t('company.profileNotFoundDesc')}
          </p>
          <Button asChild variant="outline">
            <Link href="/">{t('company.backToHome')}</Link>
          </Button>
        </main>
      </div>
    );
  }

  const user = getStoredUser();
  const isOwner = user?.id === profile.ownerId;
  const isAdmin = user?.accountType === 'ADMIN';
  const showUnverifiedBanner = !profile.isVerified && (isOwner || isAdmin);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <main className="max-w-2xl mx-auto">
        {showUnverifiedBanner && (
          <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            {t('company.pendingVerification')}
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-2xl">{profile.name}</CardTitle>
                {profile.isVerified && (
                  <span className="shrink-0 inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {t('company.verified')}
                  </span>
                )}
              </div>
              {profile.location?.name && (
                <CardDescription className="flex items-center gap-1.5 mt-1">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{profile.location.name}</span>
                </CardDescription>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile.owner && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{t('company.owner')} </span>
                {[profile.owner.name, profile.owner.surname].filter(Boolean).join(' ')}
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              {profile.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Globe className="h-4 w-4 shrink-0" />
                  {profile.website}
                </a>
              )}
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  {profile.email}
                </a>
              )}
              {profile.phone && (
                <span className="inline-flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 shrink-0" />
                  {profile.phone}
                </span>
              )}
            </div>

            {profile.aboutUs && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">{t('company.aboutUs')}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {profile.aboutUs}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
