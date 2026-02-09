'use client';

import { Building2, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface StepProfileQuestionProps {
  onYes: () => void;
  onNo: () => void;
  loading: boolean;
  error?: string;
  t: (key: string) => string;
}

export function StepProfileQuestion({
  onYes,
  onNo,
  loading,
  error,
  t,
}: StepProfileQuestionProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-3xl">
          {t('onboarding.profileQuestionTitle')}
        </CardTitle>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}
          <p className="text-muted-foreground">
            {t('onboarding.profileQuestionDescription')}
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onYes}
              className="flex items-center gap-4 rounded-lg border border-border hover:border-primary/60 p-5 text-left text-base transition-colors w-full"
            >
              <div className="shrink-0 rounded-md bg-primary/10 p-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">
                {t('onboarding.profileQuestionYes')}
              </span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onNo}
              className="flex items-center gap-4 rounded-lg border border-border hover:border-primary/60 p-5 text-left text-base transition-colors w-full"
            >
              <div className="shrink-0 rounded-md bg-muted p-2">
                <UserX className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="font-medium">
                {t('onboarding.profileQuestionNo')}
              </span>
            </button>
          </div>
        </CardContent>
        <CardFooter className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 text-base"
            size="lg"
            disabled={loading}
            onClick={onNo}
          >
            {t('onboarding.profileQuestionSkip')}
          </Button>
          <Button
            type="button"
            className="flex-1 h-12 text-base"
            size="lg"
            disabled={loading}
            onClick={onYes}
          >
            {t('onboarding.profileQuestionCreate')}
          </Button>
        </CardFooter>
      </form>
    </>
  );
}
