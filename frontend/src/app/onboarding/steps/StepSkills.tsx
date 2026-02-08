'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Skill } from '@/lib/api';

interface StepSkillsProps {
  skillsSearch: string;
  setSkillsSearch: (v: string) => void;
  availableSkills: Skill[];
  skillsLoading: boolean;
  skillsError: string;
  selectedSkillIds: string[];
  toggleSkill: (id: string) => void;
  filteredSkills: Skill[];
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  error?: string;
  t: (key: string) => string;
}

export function StepSkills({
  skillsSearch,
  setSkillsSearch,
  skillsLoading,
  skillsError,
  selectedSkillIds,
  toggleSkill,
  filteredSkills,
  onSubmit,
  onBack,
  loading,
  error,
  t,
}: StepSkillsProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-3xl">
          {t('onboarding.freelancerSkillsTitle')}
        </CardTitle>
        <CardDescription>
          {t('onboarding.freelancerSkillsDesc')}
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <CardContent className="space-y-4">
          {(error || skillsError) && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {error ?? skillsError}
            </p>
          )}
          <div className="space-y-3">
            <Input
              id="skills-search"
              type="text"
              placeholder={t('onboarding.freelancerSkillsSearchPlaceholder')}
              value={skillsSearch}
              onChange={(e) => setSkillsSearch(e.target.value)}
              disabled={skillsLoading || loading}
              className="h-12 text-base px-4"
            />
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3">
              {skillsLoading && (
                <p className="text-sm text-muted-foreground">
                  {t('common.loading')}
                </p>
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
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-base hover:bg-accent/60 cursor-pointer"
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
          </div>
        </CardContent>
        <CardFooter className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 text-base"
            size="lg"
            disabled={loading}
            onClick={onBack}
          >
            {t('common.back')}
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 text-base"
            size="lg"
            disabled={loading}
          >
            {loading ? t('onboarding.saving') : t('common.continue')}
          </Button>
        </CardFooter>
      </form>
    </>
  );
}
