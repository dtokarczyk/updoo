import { z } from 'zod';

export type SkillsFormValues = {
  selectedSkillIds: string[];
};

export const defaultSkillsFormValues: SkillsFormValues = {
  selectedSkillIds: [],
};

/** Returns Zod schema with translated validation messages. Use with useTranslations: getSkillsFormSchema(t) */
export function getSkillsFormSchema(t: (key: string) => string) {
  return z.object({
    selectedSkillIds: z.array(z.string()),
  }) satisfies z.ZodType<SkillsFormValues>;
}
