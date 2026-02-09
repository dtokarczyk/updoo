'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  getToken,
  getMyCompany,
  linkCompanyByNip,
  refreshCompany,
  updateStoredUser,
  type Company,
} from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import { ChangeCompanyForm } from './ChangeCompanyForm';

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

  const sectionPaddingClass = 'px-4';
  const sectionSpacing = 'space-y-4';

  return (
    <Card className="py-4 gap-3 rounded-lg">
      <CardContent className={`${sectionPaddingClass} ${sectionSpacing}`}>
        <section>
          <h3 className="text-sm font-semibold mb-2">{t('profile.companyBasicSection')}</h3>
          <dl className="space-y-2 text-sm">{renderRows(basicRows)}</dl>
        </section>
        <section>
          <h3 className="text-sm font-semibold mb-2">{t('profile.companyAddressSection')}</h3>
          <dl className="space-y-2 text-sm">{renderRows(addressRows)}</dl>
        </section>
        <section>
          <h3 className="text-sm font-semibold mb-2">{t('profile.companyOtherSection')}</h3>
          <dl className="space-y-2 text-sm">{renderRows(otherRows)}</dl>
        </section>
      </CardContent>
    </Card>
  );
}

export default function ProfileCompanyPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [company, setCompany] = useState<Company | null | undefined>(undefined);
  const [nip, setNip] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
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

  if (!mounted) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('profile.tabCompany')}</CardTitle>
        <CardDescription>{t('profile.tabCompanyDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            <CheckCircle2 />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {company === undefined && (
          <Card className="py-4 rounded-lg">
            <CardContent className="flex justify-center py-8">
              <Spinner className="size-8 text-muted-foreground" />
            </CardContent>
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
            <ChangeCompanyForm
              onSuccess={(c) => setCompany(c)}
              onError={setError}
              onSuccessMessage={setSuccess}
            />
            <CompanyDetails company={company} />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('profile.companyRefreshHint')}</p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={refreshing}
                onClick={handleRefresh}
              >
                {refreshing ? t('common.loading') : t('profile.companyRefreshFromGus')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
