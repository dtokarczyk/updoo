import { format } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';

/**
 * Formats an ISO date string for display (full date and time).
 */
export function formatDate(iso: string, locale: 'pl' | 'en'): string {
  const dateFnsLocale = locale === 'en' ? enUS : pl;
  const date = new Date(iso);
  const dateFormat =
    locale === 'en' ? "d MMMM yyyy 'at' HH:mm" : "d MMMM yyyy 'o' HH:mm";
  return format(date, dateFormat, { locale: dateFnsLocale });
}
