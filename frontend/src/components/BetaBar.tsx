import { t } from '@/lib/translations';
import type { Locale } from '@/lib/i18n';

export function BetaBar({ initialLocale }: { initialLocale: Locale }) {
  const text = t(initialLocale, 'beta.bar');
  return (
    <div
      role="banner"
      className="w-full bg-primary text-primary-foreground text-center py-2 px-4 text-sm"
    >
      {text}
    </div>
  );
}
