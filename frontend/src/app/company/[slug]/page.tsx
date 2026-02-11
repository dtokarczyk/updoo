'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getProfileBySlug,
  getStoredUser,
  type Profile,
} from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  User,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function DetailRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  if (value == null || value === '') return null;
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className={cn('text-sm font-medium', valueClassName)}>{value}</p>
      </div>
    </div>
  );
}

function ownerDisplayName(profile: Profile): string {
  const owner = profile.owner;
  if (!owner) return '';
  const n = owner.name?.trim();
  const s = owner.surname?.trim();
  if (n && s) return `${n} ${s}`;
  if (n) return n;
  if (s) return s;
  return '';
}

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
        setError(
          err instanceof Error ? err.message : t('company.profileNotFound'),
        );
      })
      .finally(() => setLoading(false));
  }, [slug, t]);

  const user = getStoredUser();
  const isLoggedIn = !!user;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <main className="text-center text-muted-foreground">
          {t('company.loadingProfile')}
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <main className="text-center">
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

  const isOwner = user?.id === profile.ownerId;
  const isAdmin = user?.accountType === 'ADMIN';
  const showUnverifiedBanner = !profile.isVerified && (isOwner || isAdmin);
  const contactName = ownerDisplayName(profile);

  const loginUrl = `/login?returnUrl=${encodeURIComponent(`/company/${slug}`)}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Cover photo – 16:9 above content */}
      {profile.coverPhotoUrl ? (
        <div className="-mx-4 mb-8 sm:-mx-6 sm:rounded-lg overflow-hidden aspect-video bg-muted">
          <img
            src={profile.coverPhotoUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-6">
        {/* Lewa kolumna – tytuł + opis */}
        <div className="lg:col-span-4 order-2 lg:order-1 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-4xl font-semibold leading-tight">
                {profile.name}
              </h1>
              {profile.isVerified && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {t('company.verified')}
                </span>
              )}
            </div>
            {profile.location?.name && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{profile.location.name}</span>
              </div>
            )}
          </div>

          {showUnverifiedBanner && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              {t('company.pendingVerification')}
            </div>
          )}

          {profile.aboutUs ? (
            <section>
              <div className="flex gap-3 items-start">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    {t('company.description')}
                  </p>
                  <p className="text-base whitespace-pre-wrap leading-relaxed">
                    {profile.aboutUs}
                  </p>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        {/* Prawa kolumna – wszystkie dane */}
        <aside className="lg:col-span-2 lg:self-start lg:sticky lg:top-8 order-1 lg:order-2">
          <div className="space-y-6">
            {contactName && (
              <DetailRow
                icon={User}
                label={t('company.contactName')}
                value={contactName}
              />
            )}

            <DetailRow
              icon={Building2}
              label={t('profile.companyName')}
              value={profile.name}
            />
            {profile.website && (
              <DetailRow
                icon={Globe}
                label={t('profile.create.websiteLabel')}
                value={
                  <a
                    href={
                      profile.website.startsWith('http')
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {profile.website}
                  </a>
                }
              />
            )}
            {profile.location?.name && (
              <DetailRow
                icon={MapPin}
                label={t('company.location')}
                value={profile.location.name}
              />
            )}

            {(profile.email || profile.phone) && (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2 border-t">
                  {t('company.contactData')}
                </p>
                {profile.email &&
                  (isLoggedIn ? (
                    <DetailRow
                      icon={Mail}
                      label={t('auth.email')}
                      value={
                        <a
                          href={`mailto:${profile.email}`}
                          className="text-primary hover:underline"
                        >
                          {profile.email}
                        </a>
                      }
                    />
                  ) : (
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {t('auth.email')}
                        </p>
                        <Link
                          href={loginUrl}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {t('company.loginToSeeContact')}
                        </Link>
                      </div>
                    </div>
                  ))}
                {profile.phone &&
                  (isLoggedIn ? (
                    <DetailRow
                      icon={Phone}
                      label={t('profile.phone')}
                      value={profile.phone}
                    />
                  ) : (
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {t('profile.phone')}
                        </p>
                        <Link
                          href={loginUrl}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {t('company.loginToSeeContact')}
                        </Link>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
