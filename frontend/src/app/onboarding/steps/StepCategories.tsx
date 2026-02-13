'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Category } from '@/lib/api';

interface StepCategoriesProps {
  availableCategories: Category[];
  categoriesLoading: boolean;
  onSubmit: (categoryIds: string[]) => void;
  onSkip: () => void;
  onBack: () => void;
  loading: boolean;
  error?: string;
  t: (key: string) => string;
}

export function StepCategories({
  availableCategories,
  categoriesLoading,
  onSubmit,
  onSkip,
  onBack,
  loading,
  error,
  t,
}: StepCategoriesProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedIds);
  };

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
            <ul className="space-y-3">
              {availableCategories.map((cat) => (
                <li key={cat.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`category-${cat.id}`}
                    checked={selectedIds.includes(cat.id)}
                    onCheckedChange={() => toggle(cat.id)}
                    disabled={loading}
                    aria-label={cat.name}
                  />
                  <label
                    htmlFor={`category-${cat.id}`}
                    className="text-sm font-medium leading-none cursor-pointer peer-disabled:opacity-70"
                  >
                    {cat.name}
                  </label>
                </li>
              ))}
            </ul>
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
            type="button"
            variant="ghost"
            className="flex-1 min-w-[100px] h-12 text-base"
            size="lg"
            disabled={loading || categoriesLoading}
            onClick={onSkip}
          >
            {t('onboarding.freelancerCategoriesSkip')}
          </Button>
          <Button
            type="submit"
            className="flex-1 min-w-[100px] h-12 text-base"
            size="lg"
            disabled={loading || categoriesLoading}
          >
            {loading ? t('onboarding.saving') : t('onboarding.freelancerCategoriesContinue')}
          </Button>
        </CardFooter>
      </form>
    </>
  );
}
