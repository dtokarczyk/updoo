'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SelectBox } from '@/components/ui/SelectBox';
import { getCategories, followCategory } from '@/lib/api';
import type { Category } from '@/lib/api';
import type { TranslateFn } from '../schemas';

interface StepCategoriesProps {
  onSuccess: () => void;
  onBack: () => void;
  t: TranslateFn;
}

export function StepCategories({ onSuccess, onBack, t }: StepCategoriesProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((cats) => {
        if (!cancelled) setAvailableCategories(cats);
      })
      .catch(() => {
        if (!cancelled) setAvailableCategories([]);
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      for (const id of selectedIds) {
        await followCategory(id);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onboarding.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle>{t('onboarding.freelancerCategoriesTitle')}</CardTitle>
        <CardDescription>
          {t('onboarding.freelancerCategoriesDesc')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}
          {categoriesLoading ? (
            <p className="text-sm text-muted-foreground">
              {t('onboarding.freelancerCategoriesLoading')}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableCategories.map((cat) => (
                <SelectBox
                  key={cat.id}
                  value={cat.id}
                  label={cat.name}
                  selected={selectedIds.includes(cat.id)}
                  onSelect={() => toggle(cat.id)}
                  disabled={loading}
                />
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="mt-4 flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-w-[100px] h-12 text-base"
            size="lg"
            disabled={loading}
            onClick={onBack}
          >
            {t('common.back')}
          </Button>
          <Button
            type="submit"
            className="flex-1 min-w-[100px] h-12 text-base"
            size="lg"
            disabled={loading || categoriesLoading}
          >
            {loading
              ? t('onboarding.saving')
              : t('onboarding.freelancerCategoriesContinue')}
          </Button>
        </CardFooter>
      </form>
    </>
  );
}
