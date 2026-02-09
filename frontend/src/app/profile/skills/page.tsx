'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  getStoredUser,
  updateProfile,
  updateStoredUser,
  getToken,
  getSkills,
  type Skill,
} from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';

export default function ProfileSkillsPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [skillsSearch, setSkillsSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getStoredUser();
    if (user && Array.isArray(user.skills)) {
      setSelectedSkillIds(user.skills.map((skill) => skill.id));
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) {
      router.replace('/login');
      return;
    }
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    async function loadSkills() {
      setSkillsLoading(true);
      try {
        const allSkills = await getSkills();
        if (!cancelled) setSkills(allSkills);
      } finally {
        if (!cancelled) setSkillsLoading(false);
      }
    }
    void loadSkills();
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  function toggleSkill(id: string) {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const filteredSkills =
    skillsSearch.trim().length === 0
      ? skills
      : skills.filter((skill) =>
          skill.name.toLowerCase().includes(skillsSearch.trim().toLowerCase()),
        );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const { user: updated } = await updateProfile({ skillIds: selectedSkillIds });
      updateStoredUser(updated);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('profile.tabSkills')}</CardTitle>
        <CardDescription>{t('onboarding.freelancerSkillsDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-600 dark:text-green-400 rounded-md bg-green-500/10 px-3 py-2">
            {t('profile.profileSaved')}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder={t('onboarding.freelancerSkillsSearchPlaceholder')}
            value={skillsSearch}
            onChange={(e) => setSkillsSearch(e.target.value)}
            disabled={skillsLoading || loading}
          />
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3">
            {skillsLoading && (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            )}
            {!skillsLoading && filteredSkills.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {skillsSearch.trim().length > 0
                  ? t('onboarding.freelancerSkillsNoResults')
                  : t('onboarding.freelancerSkillsEmpty')}
              </p>
            )}
            {!skillsLoading &&
              filteredSkills.map((skill) => {
                const checked = selectedSkillIds.includes(skill.id);
                return (
                  <label
                    key={skill.id}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent/60"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleSkill(skill.id)}
                      className="shrink-0"
                      disabled={loading}
                      aria-label={skill.name}
                    />
                    <span>{skill.name}</span>
                  </label>
                );
              })}
          </div>
          <CardFooter className="px-0">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
