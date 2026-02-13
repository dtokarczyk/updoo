import type {
  BillingType,
  ExperienceLevel,
  HoursPerWeek,
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
    hoursPerWeek?: HoursPerWeek | null;
    rate: number;
    rateNegotiable: boolean;
    currency: string;
    experienceLevel: ExperienceLevel;
    locationId?: string | null;
    isRemote: boolean;
    projectType: ProjectType;
    language?: JobLanguage;
    offerDays?: number;
    expectedOffers?: number | null;
    expectedApplicantTypes: string[];
    skillIds: string[];
  };
}
