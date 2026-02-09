'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getToken,
  getMyCompany,
  linkCompanyByNip,
  refreshCompany,
  updateStoredUser,
  type Company,
} from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';

function CompanyDetails({ company }: { company: Company }) {
  const { t } = useTranslations();

  const basicRows: { label: string; value: string | null }[] = [
    { label: t('profile.companyName'), value: company.name },
    { label: t('profile.companyNip'), value: company.nip },
    { label: t('profile.companyRegon'), value: company.regon },
  ];

  const addressRows: { label: string; value: string | null }[] = [
    { label: t('profile.companyStreet'), value: company.street },
    { label: t('profile.companyPropertyNumber'), value: company.propertyNumber },
    { label: t('profile.companyApartmentNumber'), value: company.apartmentNumber },
    { label: t('profile.companyPostalCode'), value: company.postalCode },
    { label: t('profile.companyLocality'), value: company.locality },
    { label: t('profile.companyCommune'), value: company.commune },
    { label: t('profile.companyCounty'), value: company.county },
    { label: t('profile.companyVoivodeship'), value: company.voivodeship },
  ];

  const otherRows: { label: string; value: string | null }[] = [
    { label: t('profile.companyIsActive'), value: company.isActive ? t('common.yes') : t('common.no') },
    { label: t('profile.companyUpdatedAt'), value: company.updatedAt ? new Date(company.updatedAt).toLocaleString() : null },
  ];

  const noData = t('profile.companyNoData');
  const displayValue = (v: string | null) =>
    v != null && String(v).trim() !== '' ? v : noData;

  const renderRows = (rows: { label: string; value: string | null }[]) => (
    <>
      {rows.map(({ label, value }) => (
        <div key={label} className="flex gap-2">
          <dt className="font-medium text-muted-foreground shrink-0 w-36">{label}</dt>
          <dd className="break-words min-w-0">{displayValue(value)}</dd>
        </div>
      ))}
    </>
  );

  const sectionCardClass = 'py-4 gap-3 rounded-lg';
  const sectionPaddingClass = 'px-4';

  return (
    <div className="space-y-6">
      <Card className={sectionCardClass}>
        <CardHeader className={sectionPaddingClass}>
          <CardTitle>{t('profile.companyBasicSection')}</CardTitle>
        </CardHeader>
        <CardContent className={sectionPaddingClass}>
          <dl className="space-y-2 text-sm">{renderRows(basicRows)}</dl>
        </CardContent>
      </Card>
      <Card className={sectionCardClass}>
        <CardHeader className={sectionPaddingClass}>
          <CardTitle>{t('profile.companyAddressSection')}</CardTitle>
        </CardHeader>
        <CardContent className={sectionPaddingClass}>
          <dl className="space-y-2 text-sm">{renderRows(addressRows)}</dl>
        </CardContent>
      </Card>
      <Card className={sectionCardClass}>
        <CardHeader className={sectionPaddingClass}>
          <CardTitle>{t('profile.companyOtherSection')}</CardTitle>
        </CardHeader>
        <CardContent className={sectionPaddingClass}>
          <dl className="space-y-2 text-sm">{renderRows(otherRows)}</dl>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfileCompanyPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [company, setCompany] = useState<Company | null | undefined>(undefined);
  const [nip, setNip] = useState('');
  const [changeNip, setChangeNip] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) {
      router.replace('/login');
      return;
    }
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted || !getToken()) return;
    let cancelled = false;
    getMyCompany()
      .then(({ company: c }) => {
        if (!cancelled) setCompany(c ?? null);
      })
      .catch(() => {
        if (!cancelled) setCompany(null);
      });
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  async function handleLinkNip(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const normalized = nip.trim().replace(/\s/g, '').replace(/-/g, '');
    if (!/^\d{10}$/.test(normalized)) {
      setError(t('profile.companyNipInvalid'));
      return;
    }
    setLoading(true);
    try {
      const { user, company: c } = await linkCompanyByNip(normalized);
      updateStoredUser(user);
      setCompany(c);
      setNip('');
      setSuccess(t('profile.companyLinked'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    if (!company) return;
    setError('');
    setSuccess('');
    setRefreshing(true);
    try {
      const { company: c } = await refreshCompany();
      setCompany(c);
      setSuccess(t('profile.companyRefreshed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setRefreshing(false);
    }
  }

  async function handleChangeCompany(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const normalized = changeNip.trim().replace(/\s/g, '').replace(/-/g, '');
    if (!/^\d{10}$/.test(normalized)) {
      setError(t('profile.companyNipInvalid'));
      return;
    }
    setChangeLoading(true);
    try {
      const { user, company: c } = await linkCompanyByNip(normalized);
      updateStoredUser(user);
      setCompany(c);
      setChangeNip('');
      setSuccess(t('profile.companyLinked'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setChangeLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('profile.tabCompany')}</CardTitle>
        <CardDescription>{t('profile.tabCompanyDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
            {success}
          </p>
        )}

        {company === undefined && (
          <Card className="py-4 rounded-lg">
            <CardHeader className="px-4">
              <CardTitle>{t('common.loading')}</CardTitle>
            </CardHeader>
          </Card>
        )}

        {company === null && (
          <>
            <p className="text-sm text-muted-foreground">
              {t('profile.companyNoNip')}
            </p>
            <form onSubmit={handleLinkNip} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nip">{t('profile.companyNip')}</Label>
                <Input
                  id="nip"
                  type="text"
                  inputMode="numeric"
                  placeholder={t('profile.companyNipPlaceholder')}
                  value={nip}
                  onChange={(e) => setNip(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  disabled={loading}
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  {t('profile.companyNipHint')}
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.submitting') : t('profile.companyLinkByNip')}
              </Button>
            </form>
          </>
        )}

        {company != null && (
          <div className="space-y-6">
            <CompanyDetails company={company} />
            <Card className="py-4 gap-3 rounded-lg">
              <CardHeader className="px-4">
                <CardTitle>{t('profile.companyRefreshCardTitle')}</CardTitle>
                <CardDescription>{t('profile.companyRefreshCardDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="px-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={refreshing}
                  onClick={handleRefresh}
                >
                  {refreshing ? t('common.loading') : t('profile.companyRefreshFromGus')}
                </Button>
              </CardContent>
            </Card>
            <Card className="py-4 gap-3 rounded-lg">
              <CardHeader className="px-4">
                <CardTitle>{t('profile.companyChangeTitle')}</CardTitle>
                <CardDescription>{t('profile.companyChangeHint')}</CardDescription>
              </CardHeader>
              <CardContent className="px-4">
                <form onSubmit={handleChangeCompany} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="changeNip">{t('profile.companyNip')}</Label>
                    <Input
                      id="changeNip"
                      type="text"
                      inputMode="numeric"
                      placeholder={t('profile.companyNipPlaceholder')}
                      value={changeNip}
                      onChange={(e) => setChangeNip(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      disabled={changeLoading}
                      maxLength={10}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full"
                    disabled={changeLoading}
                  >
                    {changeLoading ? t('common.submitting') : t('profile.companyLinkOther')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
