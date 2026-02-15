'use client';

import { useEffect, useState } from 'react';
import {
  generateAiJob,
  sendTestEmail,
  getAdminStats,
  type AdminStats,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslations } from '@/hooks/useTranslations';

export default function AdminPage() {
  useTranslations();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const handleGenerateJob = async () => {
    setGenerating(true);
    setMessage(null);
    setError(null);

    try {
      const result = await generateAiJob();
      setMessage(result.message || 'Oferta została wygenerowana pomyślnie');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Nie udało się wygenerować oferty',
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingEmail(true);
    setMessage(null);
    setError(null);

    try {
      const result = await sendTestEmail();
      setMessage(
        result.ok
          ? `E-mail testowy został wysłany na Twój adres.${result.messageId ? ` (ID: ${result.messageId})` : ''}`
          : 'Wysłano żądanie.',
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Nie udało się wysłać e-maila testowego',
      );
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {stats !== null && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Wszystkich użytkowników</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {stats.totalUsers}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Zarejestrowani w ciągu 7 dni</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {stats.registeredUsersLast7Days}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Zarejestrowani dziś</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {stats.registeredUsersToday}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Utworzone oferty</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {stats.jobsCreatedByRealUsers}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Panel administracyjny</CardTitle>
          <CardDescription>
            Generuj oferty pracy z wykorzystaniem AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Kliknij przycisk poniżej, aby wygenerować nową ofertę pracy w
              losowej kategorii. Oferta zostanie automatycznie utworzona i
              opublikowana.
            </p>
            <Button
              onClick={handleGenerateJob}
              disabled={generating}
              className="w-full"
            >
              {generating ? 'Generowanie...' : 'Wygeneruj ofertę z AI'}
            </Button>
          </div>

          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Wyślij e-mail testowy na swój adres, aby sprawdzić konfigurację
              poczty (MailerSend).
            </p>
            <Button
              onClick={handleSendTestEmail}
              disabled={sendingEmail}
              variant="outline"
              className="w-full"
            >
              {sendingEmail ? 'Wysyłanie...' : 'Wyślij e-mail testowy'}
            </Button>
          </div>

          {message && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">
                {message}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
