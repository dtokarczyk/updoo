'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getStoredUser,
  generateAiJob,
  sendTestEmail,
  getAdminStats,
  type AuthUser,
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
  const router = useRouter();
  useTranslations();
  const [, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.replace('/login');
      return;
    }
    if (storedUser.accountType !== 'ADMIN') {
      router.replace('/');
      return;
    }
    setUser(storedUser);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (loading) return;
    getAdminStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [loading]);

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">Ładowanie...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {stats !== null && (
          <Card>
            <CardHeader>
              <CardTitle>Statystyki</CardTitle>
              <CardDescription>Podsumowanie z ostatnich 7 dni</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <dt className="text-sm text-muted-foreground">
                    Zarejestrowani użytkownicy (ostatnie 7 dni)
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {stats.registeredUsersLast7Days}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
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
    </div>
  );
}
