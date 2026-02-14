'use client';

import { useEffect, useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  getNotificationPreferences,
  updateNotificationPreference,
  type NotificationPreference,
  type NotificationFrequency,
} from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';

export default function ProfileNotificationsPage() {
  const { t } = useTranslations();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('notifications.saveFailed'),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    setMounted(true);
    void loadPreferences();
  }, [loadPreferences]);

  async function handleToggleEnabled(
    pref: NotificationPreference,
    checked: boolean,
  ) {
    setError('');
    setSuccess('');
    try {
      const updated = await updateNotificationPreference(pref.type, {
        enabled: checked,
      });
      setPreferences((prev) =>
        prev.map((p) => (p.type === updated.type ? updated : p)),
      );
      setSuccess(t('notifications.saved'));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('notifications.saveFailed'),
      );
    }
  }

  async function handleFrequencyChange(
    pref: NotificationPreference,
    frequency: NotificationFrequency,
  ) {
    setError('');
    setSuccess('');
    try {
      const updated = await updateNotificationPreference(pref.type, {
        frequency,
      });
      setPreferences((prev) =>
        prev.map((p) => (p.type === updated.type ? updated : p)),
      );
      setSuccess(t('notifications.saved'));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('notifications.saveFailed'),
      );
    }
  }

  if (!mounted) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('notifications.title')}</CardTitle>
        <CardDescription>{t('notifications.description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
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

        {loading && (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        )}

        {!loading &&
          preferences.map((pref) => (
            <NotificationItem
              key={pref.type}
              pref={pref}
              t={t}
              onToggle={handleToggleEnabled}
              onFrequencyChange={handleFrequencyChange}
            />
          ))}
      </CardContent>
    </Card>
  );
}

function NotificationItem({
  pref,
  t,
  onToggle,
  onFrequencyChange,
}: {
  pref: NotificationPreference;
  t: (key: string) => string;
  onToggle: (pref: NotificationPreference, checked: boolean) => void;
  onFrequencyChange: (
    pref: NotificationPreference,
    frequency: NotificationFrequency,
  ) => void;
}) {
  // Map notification type to translation keys
  const typeLabels: Record<string, { title: string; description: string }> = {
    NEW_JOBS_IN_FOLLOWED_CATEGORIES: {
      title: t('notifications.newJobsInFollowedCategories'),
      description: t('notifications.newJobsInFollowedCategoriesDesc'),
    },
    NEW_JOB_MATCHING_SKILLS: {
      title: t('notifications.newJobMatchingSkills'),
      description: t('notifications.newJobMatchingSkillsDesc'),
    },
    NEW_APPLICATION_TO_MY_JOB: {
      title: t('notifications.newApplicationToMyJob'),
      description: t('notifications.newApplicationToMyJobDesc'),
    },
  };

  const labels = typeLabels[pref.type] ?? {
    title: pref.type,
    description: '',
  };

  return (
    <div className="rounded-lg border p-4 space-y-4">
      {/* Header: title + toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Label className="text-sm font-medium leading-none">
            {labels.title}
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            {labels.description}
          </p>
        </div>
        <Switch
          checked={pref.enabled}
          onCheckedChange={(checked) => onToggle(pref, checked)}
          aria-label={labels.title}
        />
      </div>

      {/* Frequency selector (only visible when enabled) */}
      {pref.enabled && (
        <div className="space-y-2 pl-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('notifications.frequency')}
          </p>
          <div className="flex flex-col gap-2">
            <FrequencyOption
              value="INSTANT"
              label={t('notifications.instant')}
              description={
                pref.type === 'NEW_APPLICATION_TO_MY_JOB'
                  ? t('notifications.instantDescApplications')
                  : t('notifications.instantDesc')
              }
              selected={pref.frequency === 'INSTANT'}
              onSelect={() => onFrequencyChange(pref, 'INSTANT')}
            />
            <FrequencyOption
              value="DAILY_DIGEST"
              label={t('notifications.dailyDigest')}
              description={
                pref.type === 'NEW_APPLICATION_TO_MY_JOB'
                  ? t('notifications.dailyDigestDescApplications')
                  : t('notifications.dailyDigestDesc')
              }
              selected={pref.frequency === 'DAILY_DIGEST'}
              onSelect={() => onFrequencyChange(pref, 'DAILY_DIGEST')}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FrequencyOption({
  label,
  description,
  selected,
  onSelect,
}: {
  value: string;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-start gap-3 rounded-md border p-3 text-left transition-colors cursor-pointer ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:bg-accent'
      }`}
      aria-pressed={selected}
    >
      <div
        className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
          selected ? 'border-primary' : 'border-muted-foreground'
        }`}
      >
        {selected && <div className="h-2 w-2 rounded-full bg-primary" />}
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
