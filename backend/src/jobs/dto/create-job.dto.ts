import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
  IsIn,
  ValidateIf,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum BillingTypeDto {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
}

export enum HoursPerWeekDto {
  LESS_THAN_10 = 'LESS_THAN_10',
  FROM_11_TO_20 = 'FROM_11_TO_20',
  FROM_21_TO_30 = 'FROM_21_TO_30',
  MORE_THAN_30 = 'MORE_THAN_30',
}

export enum ExperienceLevelDto {
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
}

export enum ProjectTypeDto {
  ONE_TIME = 'ONE_TIME',
  CONTINUOUS = 'CONTINUOUS',
}

export enum JobLanguageDto {
  ENGLISH = 'ENGLISH',
  POLISH = 'POLISH',
}

export class CreateJobDto {
  @IsString()
  @MinLength(1, { message: 'validation.titleRequired' })
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1, { message: 'validation.descriptionRequired' })
  @MaxLength(5000)
  description: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsEnum(JobLanguageDto)
  language?: JobLanguageDto;

  @IsEnum(BillingTypeDto)
  billingType: BillingTypeDto;

  @IsEnum(HoursPerWeekDto)
  @ValidateIf((o) => o.billingType === BillingTypeDto.HOURLY)
  @IsNotEmpty({ message: 'validation.hoursPerWeekRequired' })
  hoursPerWeek?: HoursPerWeekDto;

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null
      ? null
      : Number(value),
  )
  @ValidateIf((_o, v) => v != null && v !== '')
  @IsNumber({ allowNaN: false }, { message: 'validation.rateNonNegative' })
  @Min(0, { message: 'validation.rateNonNegative' })
  rate?: number | null;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  rateNegotiable?: boolean;

  @IsString()
  @MinLength(3, { message: 'validation.currencyLength' })
  @MaxLength(3)
  currency: string;

  @IsEnum(ExperienceLevelDto)
  experienceLevel: ExperienceLevelDto;

  @IsOptional()
  @IsString()
  locationId?: string | null;

  @IsBoolean()
  @Type(() => Boolean)
  isRemote: boolean;

  @IsEnum(ProjectTypeDto)
  projectType: ProjectTypeDto;

  /** Number of days to collect offers: 7, 14, 21 or 30. Sets deadline = createdAt + offerDays. */
  @IsOptional()
  @IsNumber()
  @IsIn([7, 14, 21, 30], { message: 'validation.offerDaysInvalid' })
  @Type(() => Number)
  offerDays?: number;

  /** Expected number of offers (slots). Only 6, 10 or 14 allowed. */
  @IsOptional()
  @IsNumber()
  @IsIn([6, 10, 14], { message: 'validation.expectedOffersInvalid' })
  @Type(() => Number)
  expectedOffers?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5, { message: 'validation.skillsMaxCount' })
  skillIds?: string[];

  /** New skill names to create and attach (like tags). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @ArrayMaxSize(5, { message: 'validation.skillsMaxCount' })
  newSkillNames?: string[];
}
