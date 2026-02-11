'use client';

import { useState, useMemo } from 'react';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import type { Skill } from '@/lib/api';

export interface SkillsFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  availableSkills: Skill[];
  skillsLoading: boolean;
  disabled?: boolean;
  formId: string;
  searchPlaceholder: string;
  emptyLabel: string;
  noResultsLabel: string;
}

export function SkillsFormFields<T extends FieldValues>({
  control,
  name,
  availableSkills,
  skillsLoading,
  disabled = false,
  formId,
  searchPlaceholder,
  emptyLabel,
  noResultsLabel,
}: SkillsFormFieldsProps<T>) {
  const [skillsSearch, setSkillsSearch] = useState('');

  const filteredSkills = useMemo(
    () =>
      skillsSearch.trim().length === 0
        ? availableSkills
        : availableSkills.filter((skill) =>
            skill.name
              .toLowerCase()
              .includes(skillsSearch.trim().toLowerCase()),
          ),
    [availableSkills, skillsSearch],
  );

  return (
    <FieldGroup className="gap-2">
      <Field>
        <FieldLabel htmlFor={`${formId}-skills-search`}>
          {searchPlaceholder}
        </FieldLabel>
        <Input
          id={`${formId}-skills-search`}
          type="text"
          placeholder={searchPlaceholder}
          value={skillsSearch}
          onChange={(e) => setSkillsSearch(e.target.value)}
          disabled={skillsLoading || disabled}
          aria-invalid={false}
        />
      </Field>

      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3">
              {skillsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Spinner className="size-8 text-muted-foreground" />
                </div>
              )}
              {!skillsLoading && filteredSkills.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {skillsSearch.trim().length > 0 ? noResultsLabel : emptyLabel}
                </p>
              )}

              {!skillsLoading &&
                filteredSkills.map((skill) => {
                  const selectedIds = (field.value ?? []) as string[];
                  const checked = selectedIds.includes(skill.id);
                  return (
                    <label
                      key={skill.id}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent/60"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? selectedIds.filter((x) => x !== skill.id)
                            : [...selectedIds, skill.id];
                          field.onChange(next);
                        }}
                        disabled={disabled}
                        aria-label={skill.name}
                        className="size-4 shrink-0 rounded border border-input bg-background accent-primary"
                      />
                      <span>{skill.name}</span>
                    </label>
                  );
                })}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
}
