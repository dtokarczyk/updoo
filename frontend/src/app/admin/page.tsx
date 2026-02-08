'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getStoredUser, generateAiJob, type AuthUser } from '@/lib/api';
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
  const [generating, setGenerating] = useState(false);
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
      <div className="max-w-2xl mx-auto">
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
