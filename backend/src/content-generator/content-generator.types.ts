import type {
  BillingType,
  ExperienceLevel,
  JobLanguage,
  ProjectType,
} from '@prisma/client';

export interface DailySlot {
  hour: number;
  minute: number;
}

export type SupportedLanguage = 'POLISH' | 'ENGLISH';

export interface GeneratedJobFormData {
  user: {
    email: string;
    name: string;
    surname: string;
  };
  job: {
    title: string;
    description: string;
    categoryId: string;
    billingType: BillingType;
    rate: number;
    currency: string;
    experienceLevel: ExperienceLevel;
    isRemote: boolean;
    projectType: ProjectType;
    language?: JobLanguage;
    offerDays?: number;
    skillIds: string[];
  };
}
