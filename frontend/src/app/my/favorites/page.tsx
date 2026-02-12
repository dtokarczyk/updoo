import { redirect } from 'next/navigation';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getFavoritesJobsServer } from '@/lib/api';
import { getTokenFromCookies } from '@/lib/auth-server';
import { MyFavoritesList } from './MyFavoritesList';
import { t as translateT } from '@/lib/translations';

export default async function MyFavoritesPage() {
  const token = await getTokenFromCookies();
  if (!token) redirect('/login');

  const locale = await getLocaleFromRequest();
  const jobs = await getFavoritesJobsServer(locale, token);
  const t = (key: string) => translateT(locale, key);

  if (jobs.length === 0) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {t('my.favorites')}
        </h1>
        <div className="py-12 text-center text-muted-foreground rounded-lg border border-dashed">
          {t('my.noFavorites')}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full  ">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {t('my.favorites')}
      </h1>
      <MyFavoritesList initialJobs={jobs} />
    </div>
  );
}
